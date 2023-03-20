const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const cvSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  date: { type: Date, default: Date.now },
  author: { type: mongoose.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Cv", cvSchema);
