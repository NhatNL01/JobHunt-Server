const { validationResult } = require("express-validator");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { GOOGLE_API_KEY, JWT_KEY } = process.env;
const HttpError = require("../models/http-error");
const User = require("../models/user");
const Post = require("../models/post");
const { createJWTtoken } = require("../utils");
const DEFAULT_AVATAR =
  "https://res.cloudinary.com/drkvr9wta/image/upload/v1647701003/undraw_profile_pic_ic5t_ncxyyo.png";

const {
  followNotification,
  removeFollowNotification,
} = require("../controllers/notifications");
const { uploadToCloudinary } = require("../utils");

const getUserById = async (req, res, next) => {
  let { userId } = req.params;
  let user;
  try {
    user = await User.findById(userId, "-password")
      .populate({
        path: "posts",
        populate: {
          path: "tags",
        },
      })
      .populate("followedTags")
      .populate("company");
    //exclude password, i.e. return only name and email
  } catch (err) {
    return next(new HttpError("Getting user failed, please try again!", 500));
  }
  res.status(200).json({
    user: user.toObject({ getters: true }),
  });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data", 422)
    );
  }
  const { name, email, password } = req.body;

  //check if there is an existing user
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(new HttpError("Signing up failed, please try again!", 500));
  }

  //user already exists => tell him/her to login
  if (existingUser) {
    return next(
      new HttpError("User already exists, please login instead", 422)
    );
  }

  //hash the password
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12); //12 - number of salting rounds (can't be reverse-engineered)
  } catch (err) {
    return next(new HttpError("Could not create user, please try again", 500));
  }

  const imageUrl = await uploadToCloudinary(req.file);

  //create a new user with hashed password
  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    avatar: imageUrl,
  });

  //save the user
  try {
    await createdUser.save();
  } catch (err) {
    return next(new HttpError("Signup failed, please try again", 500));
  }

  //generate a token
  let token;
  try {
    token = jwt.sign(
      //takes payload (the data you want to encode)
      { userId: createdUser.id, email: createdUser.email },
      JWT_KEY,
      { expiresIn: "10h" } //token expires in 10 hr
    );
  } catch (err) {
    return next(new HttpError("Signup failed, please try again", 500));
  }

  res.status(201).json({
    user: {
      name: createdUser.name,
      userId: createdUser.id,
      email: createdUser.email,
      token,
      bio: createdUser.bio,
      avatar: createdUser.avatar,
    },
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email }).populate("followedTags");
  } catch (err) {
    return next(new HttpError("Logging in failed, please try again.", 500));
  }

  //user doesn't exist (invalid credentials)
  if (!existingUser) {
    return next(new HttpError("Invalid credentials, login failed!", 403));
  }

  //validate password
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(
      new HttpError("Login failed, please check your credentials!", 500)
    );
  }

  //invalid password
  if (!isValidPassword) {
    return next(new HttpError("Invalid credentials, login failed!", 401));
  }

  //everything ok => generate token
  let token;
  try {
    // token = jwt.sign(
    //   { userId: existingUser.id, email: existingUser.email },
    //   JWT_KEY,
    //   { expiresIn: '10h' }
    // );
    token = createJWTtoken(existingUser.id, existingUser.email);
  } catch (err) {
    return next(new HttpError("Login failed, please try again", 500));
  }
  res.json({
    user: {
      name: existingUser.name,
      userId: existingUser.id,
      role: existingUser.role,
      email: existingUser.email,
      token,
      bio: existingUser.bio,
      avatar: existingUser.avatar,
      company: existingUser.company,
      tags: existingUser.followedTags,
    },
  });
};

// when login is successful, retrieve user info
const twitterLogin = (req, res) => {
  if (req.user) {
    const {
      name,
      id: userId,
      email,
      bio,
      avatar,
      followedTags: tags,
    } = req.user;
    const token = createJWTtoken(req.user.id, req.user.email);
    res.status(201).json({
      user: {
        name,
        userId,
        email,
        bio,
        avatar,
        token,
        tags,
      },
    });
  }
};

// when login failed, send failed msg
const twitterFailure = (req, res) => {
  res.status(401).json({
    success: false,
    message: "user failed to authenticate.",
  });
};

const twitterLogout = (req, res) => {
  if (req.user) {
    req.logout();
    res.json({ message: "Logout successful" });
  }
};

const updateUser = async (req, res, next) => {
  const { userId } = req.params;
  const { body } = req;

  if (req.file) {
    const imageUrl = await uploadToCloudinary(req.file);
    req = { ...req, body: { ...body, avatar: imageUrl } };
  }

  let user;
  try {
    user = User.findByIdAndUpdate(
      userId,
      req.body,
      { new: true },
      (err, data) => {
        if (err) {
          return next(new HttpError("Could not find user to update", 500));
        } else {
          const { name, id: userId, bio, email, avatar } = data;
          res.status(200).json({ user: { name, userId, bio, email, avatar } });
        }
      }
    );
  } catch (err) {
    return next(new HttpError("Could not update user", 500));
  }
};

const followUser = async (req, res, next) => {
  const { userId, followId } = req.body;
  let user;
  try {
    user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { following: followId } },
      { new: true }
    );
    userToFollow = await User.findByIdAndUpdate(
      followId,
      { $addToSet: { followers: userId } },
      { new: true }
    );
    await followNotification(userId, followId);
    res.status(201).json(user);
  } catch (err) {
    return next(new HttpError("Follow failed, please try again", 400));
  }
};

const unfollowUser = async (req, res, next) => {
  const { userId, followId } = req.body;
  let user;
  try {
    user = await User.findByIdAndUpdate(
      userId,
      { $pull: { following: followId } },
      { new: true }
    );
    userToFollow = await User.findByIdAndUpdate(
      followId,
      { $pull: { followers: userId } },
      { new: true }
    );
    await removeFollowNotification(userId, followId);
    res.status(201).json(user);
  } catch (err) {
    return next(new HttpError("Unfollow failed, please try again", 400));
  }
};

const registerRecruiter = async (req, res, next) => {
  const { userId } = req.params;
  const { body } = req;

  let user;
  try {
    user = User.findByIdAndUpdate(
      userId,
      { role: "recruiter" },
      { new: true },
      (err, data) => {
        if (err) {
          return next(new HttpError("Could not find user to update", 500));
        } else {
          const { name, id: userId, bio, email, avatar, role } = data;
          res
            .status(200)
            .json({ user: { name, userId, bio, email, avatar, role } });
        }
      }
    );
  } catch (err) {
    return next(new HttpError("Could not register recruiter", 500));
  }
};

exports.getUserById = getUserById;
exports.signup = signup;
exports.login = login;
// exports.googleLogin = googleLogin;
// exports.githubLogin = githubLogin;
// exports.fbLogin = fbLogin;
exports.twitterFailure = twitterFailure;
exports.twitterLogin = twitterLogin;
exports.twitterLogout = twitterLogout;
exports.updateUser = updateUser;
exports.followUser = followUser;
exports.unfollowUser = unfollowUser;
exports.registerRecruiter = registerRecruiter;
