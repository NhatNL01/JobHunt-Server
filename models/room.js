const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const roomSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", roomSchema);
