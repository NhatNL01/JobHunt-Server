const mongoose = require("mongoose");
const Room = require("../models/room");
const HttpError = require("../models/http-error");

const getRoomsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  let rooms;
  try {
    rooms = await Room.find({
      members: {
        $in: userId,
      },
    })
      .sort({
        date: "desc",
      })
      .populate("members");
  } catch (err) {
    return next(new HttpError("Fetching rooms failed. Please try again", 500));
  }
  res.json({ rooms: rooms.map((room) => room.toObject({ getters: true })) });
};

const createRoom = async (req, res, next) => {
  const { name, description, member1, member2 } = req.body;

  const room = await Room.find({
    members: {
      $all: [member1, member2],
    },
  });
  if (room.length > 0) {
    res.status(201).json({
      room: room,
    });
  } else {
    const createdRoom = await Room.create({
      name,
      description,
      members: [member1, member2],
    });
    res.status(201).json({
      room: createdRoom.populate("members").toObject({ getters: true }),
    });
  }
};

exports.getRoomsByUserId = getRoomsByUserId;
exports.createRoom = createRoom;
