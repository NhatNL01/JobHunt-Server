const mongoose = require("mongoose");
const Message = require("../models/message");
const HttpError = require("../models/http-error");
const OAI = require("openai");
// import { Configuration, OpenAIApi } from "openai";

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
const createMessageChatGPT = async (req, res, next) => {
  const { text, sender, roomId } = req.body;
  const openai = new OAI.OpenAIApi(
    new OAI.Configuration({
      apiKey: process.env.GPT_API_KEY,
    })
  );

  let prevMessage = await Message.findOne({
    roomId: roomId,
  }).sort({
    date: "desc",
  });

  let resText = "";
  await openai
    .createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Your name is JobHunt GPT Bot, created by NhatNL, you are a supporter in job search website. This Bot knows everything in the World. You will interact and respond to all user messages about job Recruiment field.",
        },
        {
          role: "system",
          content: `Your previous answer to user is "${prevMessage}"`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    })
    .then((res) => {
      resText = res.data.choices[0].message.content;
    });
  // }

  const createdMessageUser = await Message.create({
    text,
    sender,
    roomId,
  });
  const createdMessageGPT = await Message.create({
    text: resText,
    sender: "646320b2e2dbf52fcc3ba8d9",
    roomId,
  });

  // res.status(201).json({
  //   message: createdMessage.populate("sender").toObject({ getters: true }),
  // });
  res.status(201).json({
    message: createdMessageUser.populate("sender").toObject({ getters: true }),
  });
};

exports.createMessage = createMessage;
exports.createMessageChatGPT = createMessageChatGPT;
exports.getMessagesByRoomId = getMessagesByRoomId;
