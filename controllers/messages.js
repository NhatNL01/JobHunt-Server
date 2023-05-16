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
      apiKey: "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",
    })
  );

  // let prevMessage = await Message.findOne({
  //   roomId: roomId,
  // }).sort({
  //   date: "desc",
  // });

  let resText = "";
  // if (prevMessage) {
  //   await openai
  //     .createEdit({
  //       model: "text-davinci-edit-001",
  //       input: prevMessage.text,
  //       instruction: text,
  //     })
  //     .then((res) => {
  //       console.log(res.data.choices[0].text);
  //       resText = res.data.choices[0].text;
  //     });
  // } else {
  await openai
    .createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: text,
        },
      ],
    })
    .then((res) => {
      // console.log(res.data.choices[0].message.content);
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
