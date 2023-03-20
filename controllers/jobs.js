const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Post = require("../models/post");
const Job = require("../models/job");
const User = require("../models/user");
const Tag = require("../models/tag");
const { uploadToCloudinary } = require("../utils");
const { createTags, updateTags } = require("./tags");
const { likeNotification, removeLikeNotification } = require("./notifications");
//ok
const getAllJobs = async (req, res, next) => {
  let jobs;
  try {
    jobs = await Job.find()
      .sort({ date: "desc" })
      .populate("author")
      .populate("tags");
  } catch (err) {
    return next(new HttpError("Could not fetch jobs, please try again", 500));
  }
  res.json({ jobs: jobs.map((job) => job.toObject({ getters: true })) });
};
//ok
const getJobById = async (req, res, next) => {
  const { jobId } = req.params;
  let job;
  try {
    job = await Job.findById(jobId).populate("author");
    //findById works directly on the contructor fn
  } catch (err) {
    //stop execution in case of error
    return next(new HttpError("Something went wrong with the server", 500));
  }
  if (!job) {
    return next(new HttpError("Could not find job for the provided ID", 404));
  }
  //job is a special mongoose obj; convert it to normal JS obj using toObject
  //get rid of "_" in "_id" using { getters: true }
  res.json({ job: job.toObject({ getters: true }) });
};

const getJobsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  let jobs;
  try {
    jobs = await Job.find({ author: userId }).populate("author");
  } catch (err) {
    return next(new HttpError("Fetching jobs failed. Please try again", 500));
  }
  if (!jobs || jobs.length === 0) {
    //forward the error to the middleware and stop execution
    return next(new HttpError("Could not find jobs for the user ID", 404));
  }
  res.json({ jobs: jobs.map((job) => job.toObject({ getters: true })) });
};

const getJobsByCompanyId = async (req, res, next) => {
  const { companyId } = req.params;
  let jobs;
  let members;
  try {
    members = await User.find({ company: companyId });
  } catch (err) {
    return next(
      new HttpError("Fetching company failed. Please try again", 500)
    );
  }
  let arrMemberId = [];
  members.forEach((member) => (arrMemberId = arrMemberId.concat(member._id)));

  try {
    // let job = await Job.find({ author: member._id });
    jobs = await Job.find({
      author: {
        $in: arrMemberId,
      },
    });
  } catch (err) {
    return next(new HttpError("Fetching jobs failed. Please try again", 500));
  }

  // jobs = jobs.concat(job);

  if (!jobs || jobs.length === 0) {
    //forward the error to the middleware and stop execution
    return next(new HttpError("Could not find jobs for the company ID", 404));
  }
  res.json({ jobs: jobs.map((job) => job.toObject({ getters: true })) });
};

//ok, bug tags
const createJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please try again!", 422));
  }
  // const imageUrl = await uploadToCloudinary(req.file);
  const {
    name,
    deadline,
    salary,
    numRecruit,
    workingFormat,
    experience,
    descripsion,
    workingAddress,
    status,
    author,
    company,
    tags,
  } = req.body;
  let user;
  try {
    user = await User.findById(author); //check if the user ID exists
  } catch (err) {
    return next(new HttpError("Creating post failed, please try again", 500));
  }
  if (!user) {
    return next(new HttpError("Could not find user for provided ID", 404));
  }
  const createdJob = await Job.create({
    name,
    deadline,
    salary,
    numRecruit,
    workingFormat,
    experience,
    descripsion,
    workingAddress,
    status,
    author,
    company,
  });
  // await createTags(JSON.parse(tags), createdJob);

  //2 operations to execute:
  //1. save new doc with the new post
  //2. add post id to the corresponding user
  //execute multiple indirectly related operations such that if one fails, we undo all operations: transcations
  //transcations are built on "sessions"
  try {
    const sess = await mongoose.startSession(); //start session
    sess.startTransaction(); //start transaction
    await createdJob.save({ session: sess }); //save new doc with the new post
    user.jobs.push(createdJob); //add post id to the corresponding user
    //(BTS: MongoDB grabs just the post id and adds it to the "posts" array in the "user" doc)
    await user.save({ session: sess }); //save the updated user (part of our current session)
    await sess.commitTransaction(); //session commits the transaction
    //only at this point, the changes are saved in DB... anything goes wrong, EVERYTHING is undone by MongoDB
  } catch (err) {
    return next(new HttpError("Creating post failed, please try again", 500));
  }
  res.status(201).json({
    jobs: createdJob.populate("author").toObject({ getters: true }),
  });
};
//ok bug tags
const updateJob = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please try again!", 422));
  }
  const { jobId } = req.params;
  const { body } = req;

  // if (req.file) {
  //   const imageUrl = await uploadToCloudinary(req.file);
  //   req = { ...req, body: { ...body, image: imageUrl } };
  // }

  let job;
  try {
    job = await Job.findById(jobId);
    //.populate('tags')
  } catch (err) {
    return next(new HttpError("Could not update job, please try again!", 500));
  }

  if (job.author.toString() !== req.body.author) {
    return next(new HttpError("You are not allowed to update the job", 401));
  }
  Object.keys(req.body).map((key) => {
    if (key !== "tags") job[key] = req.body[key];
  });
  // await updateTags(JSON.parse(req.body.tags), job);
  try {
    await job.save();
    res.status(200).json({
      job: job.toObject({ getters: true }),
    });
  } catch (err) {
    return next(new HttpError("Could not update job", 500));
  }
};
//ok bug: req.body.author chi can truyen userid la xoa khong can xac thuc
const deletejob = async (req, res, next) => {
  const { jobId } = req.params;
  let job;
  try {
    //"populate" allows us to refer to another collection and work with it
    //works only if "ref" property is there in the model
    job = await Job.findById(jobId).populate("author");
  } catch (err) {
    return next(new HttpError("Could not delete job.", 500));
  }

  if (!job) {
    return next(new HttpError("Could not find job for the provided ID.", 404));
  }
  if (job.author.id !== req.body.author) {
    return next(new HttpError("You are not allowed to delete the job", 401));
  }

  try {
    const sess = await mongoose.startSession(); //start session
    sess.startTransaction(); //start transaction
    await job.remove({ session: sess }); //remove doc; make sure we refer to the current session
    job.author.jobs.pull(job); //remove job id from the corresponding user
    await job.author.save({ session: sess }); //save the updated user (part of our current session)
    await sess.commitTransaction(); //session commits the transaction
    //only at this point, the changes are saved in DB... anything goes wrong, EVERYTHING is undone by MongoDB
  } catch (err) {
    return next(new HttpError("Deleting job failed, please try again", 500));
  }
  res.status(201).json({ message: "Deleted job" });
};

//ok bug auth
const bookmarkJob = async (req, res, next) => {
  const { jobId, userId } = req.body;
  let job;
  try {
    job = await Job.findByIdAndUpdate(
      jobId,
      {
        $addToSet: { bookmarks: userId },
      },
      { new: true }
    );
  } catch (err) {
    return next(new HttpError("Could not bookmark job", 500));
  }
  if (job) {
    res.status(200).json({
      job: job.toObject({ getters: true }),
    });
  } else {
    return next(new HttpError("Invalid job", 500));
  }
};

const unbookmarkJob = async (req, res, next) => {
  const { jobId, userId } = req.body;
  let job;
  try {
    job = await Job.findByIdAndUpdate(
      jobId,
      {
        $pull: { bookmarks: userId },
      },
      { new: true }
    );
  } catch (err) {
    return next(new HttpError("Could not unbookmark job", 500));
  }
  res.status(200).json({
    job: job.toObject({ getters: true }),
  });
};

const getSearchResults = async (req, res, next) => {
  const query = {};
  if (req.query.search) {
    const options = "$options";
    query.name = { $regex: req.query.search, [options]: "i" };
    let jobs;
    try {
      jobs = await Job.find(query);
      //.populate('author')
      //.populate('tags')
    } catch (err) {
      return next(new HttpError("Search failed, please try again", 400));
    }
    res
      .status(201)
      .json({ jobs: jobs.map((job) => job.toObject({ getters: true })) });
  }
};

const getBookmarks = async (req, res, next) => {
  const { userId } = req.params;
  let posts;
  try {
    posts = await Post.find({ bookmarks: userId })
      .populate("tags")
      .populate("author");
  } catch (err) {
    return next(
      new HttpError("Fetching posts failed. Please try again later", 500)
    );
  }
  res.json({ posts: posts.map((post) => post.toObject({ getters: true })) });
};

exports.getAllJobs = getAllJobs;
exports.getJobById = getJobById;
exports.getJobsByUserId = getJobsByUserId;
exports.getJobsByCompanyId = getJobsByCompanyId;
exports.createJob = createJob;
exports.updateJob = updateJob;
exports.deletejob = deletejob;
exports.bookmarkJob = bookmarkJob;
exports.unbookmarkJob = unbookmarkJob;
exports.getBookmarks = getBookmarks;
exports.getSearchResults = getSearchResults;
