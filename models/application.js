const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const applicationSchema = new Schema({
  status: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Success", "Reject"],
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  date: { type: Date, default: Date.now },
  jobPost: { type: mongoose.Types.ObjectId, required: true, ref: "Post" },
  author: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  cv: { type: mongoose.Types.ObjectId, required: true, ref: "Cv" },
});

module.exports = mongoose.model("Application", applicationSchema);
