const { v4: uuid } = require('uuid');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const HttpError = require('../models/http-error');
const Post = require('../models/post');
const Job = require('../models/job');
const User = require('../models/user');
const Tag = require('../models/tag');
const Company = require('../models/company');
const { uploadToCloudinary } = require('../utils');
const { createTags, updateTags } = require('./tags');
const company = require('../models/company');

//ok
const getAllCompanies = async (req, res, next) => {
  let companies;
  try {
    companies = await Company.find()
      .populate('members');
  } catch (err) {
    return next(new HttpError('Could not fetch companies, please try again', 500));
  }
  res.json({ companies: companies.map((company) => company.toObject({ getters: true })) });
};
//ok
const getCompanyById = async (req, res, next) => {
  const { companyId } = req.params;
  let company;
  try {
    company = await Company.findById(companyId);
    //findById works directly on the contructor fn
  } catch (err) {
    //stop execution in case of error
    return next(new HttpError('Something went wrong with the server', 500));
  }
  if (!company) {
    return next(new HttpError('Could not find company for the provided ID', 404));
  }
  //company is a special mongoose obj; convert it to normal JS obj using toObject
  //get rid of "_" in "_id" using { getters: true }
  res.json({ company: company.toObject({ getters: true }) });
};

//ok, bug: Da co cty r thi khong dc tao cong ty moi
const createCompany = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please try again!', 422));
  }
  const imageUrl = await uploadToCloudinary(req.file);
  const {
    name,
    description,
    foundedYear,
    scale,
    address,
    contact,
    author
  } = req.body;
  let user;
  try {
    user = await User.findById(author); //check if the user ID exists
  } catch (err) {
    return next(new HttpError('Creating post failed, please try again', 500));
  }
  if (!user) {
    return next(new HttpError('Could not find user for provided ID', 404));
  }
  const createdCompany = await Company.create({
    name,
    description,
    foundedYear,
    scale,
    address,
    contact,
    avatar: imageUrl,
    members: [author]
  });


  //2 operations to execute:
  //1. save new doc with the new post
  //2. add post id to the corresponding user
  //execute multiple indirectly related operations such that if one fails, we undo all operations: transcations
  //transcations are built on "sessions"

  try {
    const sess = await mongoose.startSession(); //start session
    sess.startTransaction(); //start transaction
    await createdCompany.save({ session: sess }); //save new doc with the new post
    user.company = createdCompany;  //add post id to the corresponding user
    //(BTS: MongoDB grabs just the post id and adds it to the "posts" array in the "user" doc)
    await user.save({ session: sess }); //save the updated user (part of our current session)
    await sess.commitTransaction(); //session commits the transaction
    //only at this point, the changes are saved in DB... anything goes wrong, EVERYTHING is undone by MongoDB
  } catch (err) {
    return next(new HttpError('Creating post failed, please try again', 500));
  }
  res.status(201).json({
    company: createdCompany.populate('members').toObject({ getters: true }),
  });
};

//ok, 
const addMenberToCompany = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please try again!', 422));
  }
  const { companyId, memberId } = req.params;
  const { body } = req;

  // if (req.file) {
  //   const imageUrl = await uploadToCloudinary(req.file);
  //   req = { ...req, body: { ...body, image: imageUrl } };
  // }

  let company;
  let member;
  try {
    company = await Company.findById(companyId);
    member = await User.findById(memberId);
  } catch (err) {
    return next(new HttpError('Could not add member to company, please try again!', 500));
  }

  // if (company.author.toString() !== req.body.author) {
  //   return next(new HttpError('You are not allowed to update the company', 401));
  // }

  company.members.push(memberId);
  member.company = companyId;

  // Object.keys(req.body).map((key) => {
  //   company[key] = req.body[key];
  // });
  // await updateTags(JSON.parse(req.body.tags), company);
  try {
    await company.save();
    await member.save();
    res.status(200).json({
      company: company.toObject({ getters: true }),
    });
  } catch (err) {
    return next(new HttpError('Could not add member to company', 500));
  }
};

//ok 
const updateCompany = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please try again!', 422));
  }
  const { companyId } = req.params;
  const { body } = req;

  let company;
  try {
    company = await Company.findById(companyId);
  } catch (err) {
    return next(new HttpError('Could not update company, please try again!', 500));
  }

  // if (company.members.find(member => {
  //   return member.toString() !== req.body.member;
  // })) {
  //   return next(new HttpError('You are not allowed to update the company', 401));
  // }

  Object.keys(req.body).map((key) => {
    company[key] = req.body[key];
  });

  try {
    await company.save();
    res.status(200).json({
      company: company.toObject({ getters: true }),
    });
  } catch (err) {
    return next(new HttpError('Could not update company', 500));
  }
};
//ok 
const deleteCompany = async (req, res, next) => {
  const { companyId } = req.params;
  let company;
  try {
    //"populate" allows us to refer to another collection and work with it
    //works only if "ref" property is there in the model
    company = await Company.findById(companyId).populate('members');
  } catch (err) {
    return next(new HttpError('Could not delete company.', 500));
  }

  if (!company) {
    return next(new HttpError('Could not find company for the provided ID.', 404));
  }
  // if (company.author.id !== req.body.author) {
  //   return next(new HttpError('You are not allowed to delete the company', 401));
  // }

  try {
    const sess = await mongoose.startSession(); //start session
    sess.startTransaction(); //start transaction
    await company.remove({ session: sess }); //remove doc; make sure we refer to the current session
    company.members.forEach(async member => {
      member.company = null;
      await member.save({ session: sess });
    });
    // company.members.company = null; //remove company id from the corresponding user
    // await company.author.save({ session: sess }); //save the updated user (part of our current session)
    await sess.commitTransaction(); //session commits the transaction
    //only at this point, the changes are saved in DB... anything goes wrong, EVERYTHING is undone by MongoDB
  } catch (err) {
    return next(new HttpError('Deleting company failed, please try again', 500));
  }
  res.status(201).json({ message: 'Deleted company' });
};


const getSearchResults = async (req, res, next) => {
  const query = {};
  if (req.query.search) {
    const options = '$options';
    query.name = { $regex: req.query.search, [options]: 'i' };
    let companies;
    try {
      companies = await Company.find(query)
        //.populate('author')
        //.populate('tags')
        ;
    } catch (err) {
      return next(new HttpError('Search failed, please try again', 400));
    }
    res
      .status(201)
      .json({ companies: companies.map((company) => company.toObject({ getters: true })) });
  }
};


exports.getAllCompanies = getAllCompanies;
exports.getCompanyById = getCompanyById;
exports.addMenberToCompany = addMenberToCompany;
exports.createCompany = createCompany;
exports.updateCompany = updateCompany;
exports.deleteCompany = deleteCompany;
exports.getSearchResults = getSearchResults;
