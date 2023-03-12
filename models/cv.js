const mongoose = require("mongoose");

//schema = blueprint of post (it must contain title, image, etc.)
const Schema = mongoose.Schema;

//model - based on schema - each instance is a new document
const cvSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    // required: true,
  },
  date: { type: Date, default: Date.now },
  author: { type: mongoose.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Cv", cvSchema); //returns a constructor function
