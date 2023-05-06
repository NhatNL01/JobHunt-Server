const mongoose = require("mongoose");
const User = require("../models/user");
const Message = require("../models/message");
const HttpError = require("../models/http-error");

const getMessagesByTwoUserId = async (req, res, next) => {
  const { user1Id, user2Id } = req.params;
  let messages;
  try {
    messages1 = await Message.find({
      sender: user1Id,
      receiver: user2Id,
    }).populate("sender");
    messages2 = await Message.find({
      sender: user2Id,
      receiver: user1Id,
    }).populate("sender");
    messages = messages1.concat(messages2);
  } catch (err) {
    return next(
      new HttpError("Fetching messages failed. Please try again", 500)
    );
  }
  if (!messages1 || messages1.length === 0) {
    //forward the error to the middleware and stop execution
    return next(new HttpError("Could not find messages for the user ID", 404));
  }

  res.json({
    messages: messages.map((message) => message.toObject({ getters: true })),
  });
};
//ok
const createMessage = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Invalid inputs passed, please try again!", 422));
  }

  const { content, sender, receiver } = req.body;
  let s;
  let r;
  try {
    s = await User.findById(sender); //check if the user ID exists
    r = await User.findById(receiver); //check if the user ID exists
  } catch (err) {
    return next(
      new HttpError("Creating message failed, please try again", 500)
    );
  }
  if (!s || !r) {
    return next(new HttpError("Could not find user for provided ID", 404));
  }
  const createdMessage = await Message.create({
    content,
    sender,
    receiver,
  });

  res.status(201).json({
    messages: createdMessage.populate("sender").toObject({ getters: true }),
  });
};

exports.getMessagesByTwoUserId = getMessagesByTwoUserId;
exports.createMessage = createMessage;
