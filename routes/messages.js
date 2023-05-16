const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { checkAuth } = require("../middleware/check-auth");
const messagesControllers = require("../controllers/messages");
const { getMessagesByRoomId, createMessage, createMessageChatGPT } =
  messagesControllers;

router.use(checkAuth);

router.get("/:roomId", getMessagesByRoomId);

router.post("/", createMessage);

router.post("/gpt", createMessageChatGPT);

module.exports = router;
