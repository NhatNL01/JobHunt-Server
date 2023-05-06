const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { checkAuth } = require("../middleware/check-auth");
const messagesControllers = require("../controllers/messages");
const { getMessagesByTwoUserId, createMessage } = messagesControllers;

router.use(checkAuth);

router.get("/:user1Id/:user2Id", getMessagesByTwoUserId);

router.post("/", createMessage);

module.exports = router;
