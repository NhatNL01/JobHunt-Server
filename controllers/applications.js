const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Post = require("../models/post");
const Job = require("../models/job");
const Cv = require("../models/cv");
const User = require("../models/user");
const Tag = require("../models/tag");
const Application = require("../models/application");
const { likeNotification, removeLikeNotification } = require("./notifications");
//ok
const getAllApplications = async (req, res, next) => {
  let applications;
  try {
    applications = await Application.find()
      .sort({ date: "desc" })
      .populate("author")
      .populate("tags");
  } catch (err) {
    return next(
      new HttpError("Could not fetch applications, please try again", 500)
    );
  }
  res.json({
    applications: applications.map((app) => app.toObject({ getters: true })),
  });
};
//ok
const getApplicationById = async (req, res, next) => {
  const { applicationId } = req.params;
  let application;
  try {
    application = await Application.findById(applicationId).populate("author");
    //findById works directly on the contructor fn
  } catch (err) {
    //stop execution in case of error
    return next(new HttpError("Something went wrong with the server", 500));
  }
  if (!application) {
    return next(
      new HttpError("Could not find application for the provided ID", 404)
    );
  }
  //application is a special mongoose obj; convert it to normal JS obj using toObject
  //get rid of "_" in "_id" using { getters: true }
  res.json({ application: application.toObject({ getters: true }) });
};

const getApplicationsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  let applications;
  try {
    applications = await Application.find({ author: userId }).populate(
      "author"
    );
  } catch (err) {
    return next(
      new HttpError("Fetching applications failed. Please try again", 500)
    );
  }
  if (!applications || applications.length === 0) {
    //forward the error to the middleware and stop execution
    return next(
      new HttpError("Could not find applications for the user ID", 404)
    );
  }
  res.json({
    applications: applications.map((app) => app.toObject({ getters: true })),
  });
};

const getApplicationsByJobId = async (req, res, next) => {
  const { jobId } = req.params;
  let applications;
  try {
    applications = await Application.find({ job: jobId })
      .populate("cv")
      .populate("author");
  } catch (err) {
    return next(
      new HttpError("Fetching applications failed. Please try again", 500)
    );
  }
  if (!applications || applications.length === 0) {
    //forward the error to the middleware and stop execution
    return next(
      new HttpError("Could not find applications for the job ID", 404)
    );
  }
  res.json({
    applications: applications.map((app) => app.toObject({ getters: true })),
  });
};

const createApplication = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please try again!", 422));
  }
  const { body, job, author, cv } = req.body;
  let user;
  let cvCheck;
  let jobCheck;
  try {
    user = await User.findById(author); //check if the user ID exists
    cvCheck = await Cv.findById(cv); //check if the user ID exists
    jobCheck = await Post.findById(job); //check if the user ID exists
  } catch (err) {
    return next(new HttpError("Creating post failed, please try again", 500));
  }
  if (!user || !cvCheck || !jobCheck) {
    return next(
      new HttpError("Could not find user|cv|job for provided ID", 404)
    );
  }
  const createdApplication = await Application.create({
    body,
    job,
    author,
    cv,
  });

  //2 operations to execute:
  //1. save new doc with the new post
  //2. add post id to the corresponding user
  //execute multiple indirectly related operations such that if one fails, we undo all operations: transcations
  //transcations are built on "sessions"
  try {
    const sess = await mongoose.startSession(); //start session
    sess.startTransaction(); //start transaction
    await createdApplication.save({ session: sess }); //save new doc with the new post
    user.applications.push(createdApplication); //add post id to the corresponding user
    //(BTS: MongoDB grabs just the post id and adds it to the "posts" array in the "user" doc)
    await user.save({ session: sess }); //save the updated user (part of our current session)
    await sess.commitTransaction(); //session commits the transaction
    //only at this point, the changes are saved in DB... anything goes wrong, EVERYTHING is undone by MongoDB
  } catch (err) {
    return next(new HttpError("Creating post failed, please try again", 500));
  }
  res.status(201).json({
    application: createdApplication
      .populate("author")
      .toObject({ getters: true }),
  });
};

const updateApplication = async (req, res, next) => {
  const { applicationId } = req.params;
  const { body } = req;

  let application;
  try {
    application = Application.findByIdAndUpdate(
      applicationId,
      {
        status: req.body.status,
      },
      { new: true },
      (err, data) => {
        if (err) {
          return next(
            new HttpError("Could not find application to update", 500)
          );
        } else {
          const { cv, author, job, status, body } = data;
          res
            .status(200)
            .json({ application: { status, cv, author, job, body } });
        }
      }
    );
  } catch (err) {
    return next(new HttpError("Could not update user", 500));
  }
};

//ok
const deleteApplication = async (req, res, next) => {
  const { applicationId } = req.params;
  let application;
  try {
    //"populate" allows us to refer to another collection and work with it
    //works only if "ref" property is there in the model
    application = await Application.findById(applicationId).populate("author");
  } catch (err) {
    return next(new HttpError("Could not delete application.", 500));
  }

  if (!application) {
    return next(
      new HttpError("Could not find application for the provided ID.", 404)
    );
  }
  if (application.author.id !== req.body.author) {
    return next(
      new HttpError("You are not allowed to delete the application", 401)
    );
  }

  try {
    const sess = await mongoose.startSession(); //start session
    sess.startTransaction(); //start transaction
    await application.remove({ session: sess }); //remove doc; make sure we refer to the current session
    application.author.applications.pull(application); //remove application id from the corresponding user
    await application.author.save({ session: sess }); //save the updated user (part of our current session)
    await sess.commitTransaction(); //session commits the transaction
    //only at this point, the changes are saved in DB... anything goes wrong, EVERYTHING is undone by MongoDB
  } catch (err) {
    return next(
      new HttpError("Deleting application failed, please try again", 500)
    );
  }
  res.status(201).json({ message: "Deleted application" });
};

exports.getAllApplications = getAllApplications;
exports.getApplicationById = getApplicationById;
exports.getApplicationsByJobId = getApplicationsByJobId;
exports.getApplicationsByUserId = getApplicationsByUserId;
exports.createApplication = createApplication;
exports.updateApplication = updateApplication;
exports.deleteApplication = deleteApplication;
