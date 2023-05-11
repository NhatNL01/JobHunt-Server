const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minLength: 8 },
  avatar: { type: String },
  bio: { type: String },
  links: { type: String },
  joinDate: { type: Date, default: Date.now },
  location: { type: String },
  work: { type: String },
  skills: { type: String },

  role: {
    type: String,
    default: "user",
    enum: ["user", "recruiter", "admin"],
    required: true,
  },
  active: {
    type: Boolean,
    required: true,
    default: true,
  },

  posts: [{ type: mongoose.Types.ObjectId, ref: "Post" }],
  cvs: [{ type: mongoose.Types.ObjectId, ref: "Cv" }],
  applications: [{ type: mongoose.Types.ObjectId, ref: "Application" }],
  comments: [{ type: mongoose.Types.ObjectId, ref: "Comment" }],
  following: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  followers: [{ type: mongoose.Types.ObjectId, ref: "User" }],
  followedTags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  bookmarks: [{ type: mongoose.Types.ObjectId, ref: "Post" }],
  company: { type: mongoose.Types.ObjectId, ref: "Company" },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
