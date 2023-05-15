const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const messageSchema = new Schema({
  roomId: { type: Schema.Types.ObjectId, ref: "Room" },
  text: {
    type: String,
    required: true,
  },
  sender: { type: Schema.Types.ObjectId, ref: "User" },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
