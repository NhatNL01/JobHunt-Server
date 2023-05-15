const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { checkAuth } = require("../middleware/check-auth");
const roomsControllers = require("../controllers/rooms");
const { getRoomsByUserId, createRoom } = roomsControllers;

router.use(checkAuth);

router.get("/:userId", getRoomsByUserId);

router.post("/", createRoom);

module.exports = router;
