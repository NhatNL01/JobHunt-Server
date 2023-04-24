const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Post = require("../models/post");
const Cv = require("../models/cv");
const Job = require("../models/job");
const User = require("../models/user");
const { uploadToCloudinary } = require("../utils");

//ok
const getAllCvs = async (req, res, next) => {
  let cvs;
  try {
    cvs = await Cv.find().sort({ date: "desc" });
    //.populate('author')
    //.populate('tags');
  } catch (err) {
    return next(new HttpError("Could not fetch cvs, please try again", 500));
  }
  res.json({ cvs: cvs.map((cv) => cv.toObject({ getters: true })) });
};
//ok
const getCvById = async (req, res, next) => {
  const { cvId } = req.params;
  let cv;
  try {
    cv = await cv.findById(cvId).populate("author");
    //findById works directly on the contructor fn
  } catch (err) {
    //stop execution in case of error
    return next(new HttpError("Something went wrong with the server", 500));
  }
  if (!cv) {
    return next(new HttpError("Could not find cv for the provided ID", 404));
  }
  //cv is a special mongoose obj; convert it to normal JS obj using toObject
  //get rid of "_" in "_id" using { getters: true }
  res.json({ cv: cv.toObject({ getters: true }) });
};

const getCvsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  let cvs;
  try {
    cvs = await Cv.find({ author: userId }).populate("author");
  } catch (err) {
    return next(new HttpError("Fetching cvs failed. Please try again", 500));
  }
  if (!cvs || cvs.length === 0) {
    //forward the error to the middleware and stop execution
    return next(new HttpError("Could not find cvs for the user ID", 404));
  }
  res.json({ cvs: cvs.map((cv) => cv.toObject({ getters: true })) });
};
//ok
const createCv = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please try again!", 422));
  }
  console.log(req.file);
  const imageUrl = await uploadToCloudinary(req.file);
  const { name, author } = req.body;
  let user;
  try {
    user = await User.findById(author); //check if the user ID exists
  } catch (err) {
    return next(new HttpError("Creating post failed, please try again", 500));
  }
  if (!user) {
    return next(new HttpError("Could not find user for provided ID", 404));
  }
  const createdCv = await Cv.create({
    name,
    image: imageUrl,
    author,
  });

  //2 operations to execute:
  //1. save new doc with the new post
  //2. add post id to the corresponding user
  //execute multiple indirectly related operations such that if one fails, we undo all operations: transcations
  //transcations are built on "sessions"
  try {
    const sess = await mongoose.startSession(); //start session
    sess.startTransaction(); //start transaction
    await createdCv.save({ session: sess }); //save new doc with the new post
    user.cvs.push(createdCv); //add post id to the corresponding user
    //(BTS: MongoDB grabs just the post id and adds it to the "posts" array in the "user" doc)
    await user.save({ session: sess }); //save the updated user (part of our current session)
    await sess.commitTransaction(); //session commits the transaction
    //only at this point, the changes are saved in DB... anything goes wrong, EVERYTHING is undone by MongoDB
  } catch (err) {
    return next(new HttpError("Creating post failed, please try again", 500));
  }
  res.status(201).json({
    cvs: createdCv.populate("author").toObject({ getters: true }),
  });
};
//ok
const updateCv = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please try again!", 422));
  }
  const { cvId } = req.params;
  const { body } = req;

  if (req.file) {
    const imageUrl = await uploadToCloudinary(req.file);
    req = { ...req, body: { ...body, image: imageUrl } };
  }

  let cv;
  try {
    cv = await Cv.findById(cvId);
    //.populate('tags')
  } catch (err) {
    return next(new HttpError("Could not update cv, please try again!", 500));
  }
  if (!cv) {
    return next(new HttpError("Could not find cv for the provided ID.", 404));
  }
  if (cv.author.toString() !== req.body.author) {
    return next(new HttpError("You are not allowed to update the cv", 401));
  }
  Object.keys(req.body).map((key) => {
    cv[key] = req.body[key];
  });
  // await updateTags(JSON.parse(req.body.tags), cv);
  try {
    await cv.save();
    res.status(200).json({
      cv: cv.toObject({ getters: true }),
    });
  } catch (err) {
    return next(new HttpError("Could not update cv", 500));
  }
};
//ok
const deleteCv = async (req, res, next) => {
  const { cvId } = req.params;
  let cv;
  try {
    //"populate" allows us to refer to another collection and work with it
    //works only if "ref" property is there in the model
    cv = await Cv.findById(cvId).populate("author");
  } catch (err) {
    return next(new HttpError("Could not delete cv.", 500));
  }

  if (!cv) {
    return next(new HttpError("Could not find cv for the provided ID.", 404));
  }
  if (cv.author.id !== req.body.author) {
    return next(new HttpError("You are not allowed to delete the cv", 401));
  }

  try {
    const sess = await mongoose.startSession(); //start session
    sess.startTransaction(); //start transaction
    await cv.remove({ session: sess }); //remove doc; make sure we refer to the current session
    cv.author.cvs.pull(cv); //remove cv id from the corresponding user
    await cv.author.save({ session: sess }); //save the updated user (part of our current session)
    await sess.commitTransaction(); //session commits the transaction
    //only at this point, the changes are saved in DB... anything goes wrong, EVERYTHING is undone by MongoDB
  } catch (err) {
    return next(new HttpError("Deleting cv failed, please try again", 500));
  }
  res.status(201).json({ message: "Deleted cv" });
};

exports.getAllCvs = getAllCvs;
exports.getCvById = getCvById;
exports.getCvsByUserId = getCvsByUserId;
exports.createCv = createCv;
exports.updateCv = updateCv;
exports.deleteCv = deleteCv;
