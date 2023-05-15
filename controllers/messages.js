const mongoose = require("mongoose");
const Message = require("../models/message");
const HttpError = require("../models/http-error");

const getMessagesByRoomId = async (req, res, next) => {
  const { roomId } = req.params;
  let messages;
  try {
    messages = await Message.find({
      roomId: roomId,
    })
      .sort({
        date: "asc",
      })
      .populate("sender");
  } catch (err) {
    return next(
      new HttpError("Fetching messages failed. Please try again", 500)
    );
  }
  res.json({
    messages: messages.map((message) => message.toObject({ getters: true })),
  });
};

const createMessage = async (req, res, next) => {
  const { text, sender, roomId } = req.body;
  const createdMessage = await Message.create({
    text,
    sender,
    roomId,
  });

  res.status(201).json({
    message: createdMessage.populate("sender").toObject({ getters: true }),
  });
};

exports.createMessage = createMessage;
exports.getMessagesByRoomId = getMessagesByRoomId;
