const mongoose = require('mongoose');

//schema = blueprint of post (it must contain title, image, etc.)
const Schema = mongoose.Schema;

//model - based on schema - each instance is a new document
const jobSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
    required: true
  },
  salary: {
    type: String,
    // required: true,
  },
  numRecruit: {
    type: Number,
    //required: true,
  },
  workingFormat: {
    type: String,
    //enum: ["Part-time", "Full-time"],
    //required: true,
  },
  experience: {
    type: String,
    //required: true,
  },
  descripsion: {
    type: String,
    required: true,
  },
  workingAddress: {
    type: String,
    //required: true,
  },
  status: {
    type: String,
    required: true,
  },
  // image: {
  //   type: String,
  //   //required: true,
  // },
  date: { type: Date, default: Date.now },
  author: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  company: {
    type: mongoose.Types.ObjectId,
    //required: true,
    ref: 'Company'
  },
  tags: [{
    type: mongoose.Types.ObjectId,
    //required: true, 
    ref: "Tag"
  }],
  bookmarks: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
});

module.exports = mongoose.model('Job', jobSchema); //returns a constructor function
