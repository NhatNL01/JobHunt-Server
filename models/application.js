const mongoose = require("mongoose");

//schema = blueprint of post (it must contain title, image, etc.)
const Schema = mongoose.Schema;

//model - based on schema - each instance is a new document
const applicationSchema = new Schema({
  status: {
    type: String,
    default: "Đợi duyệt",
    enum: ["Đợi duyệt", "Đã được nhận", "Đã bị từ chối"],
    //required: true,
  },
  body: {
    type: String,
    //required: true 
  },
  date: { type: Date, default: Date.now },
  job: { type: mongoose.Types.ObjectId, required: true, ref: "Job" },
  author: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  cv: { type: mongoose.Types.ObjectId, required: true, ref: "Cv" },
});

module.exports = mongoose.model("Application", applicationSchema); //returns a constructor function
