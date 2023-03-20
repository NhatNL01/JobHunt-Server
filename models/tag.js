const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const tagSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  date: { type: Date, default: Date.now },

  followers: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  posts: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Post",
    },
  ],
  jobs: [
    {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Job",
    },
  ],
});

module.exports = mongoose.model("Tag", tagSchema);
