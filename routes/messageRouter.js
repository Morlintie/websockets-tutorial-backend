const express = require("express");
const {
  getUnreadMessages,
  getMessages,
  markMessagesAsSeen,
  sentMessage,
} = require("../controllers/messageController");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");

const router = express.Router();

router.get("/unread", authenticationMiddleware, getUnreadMessages);
router.get("/:id", authenticationMiddleware, getMessages);
router.patch("/seen/:id", authenticationMiddleware, markMessagesAsSeen);
router.post(
  "/send/:id",
  authenticationMiddleware,

  (req, res) => {
    sentMessage(req, res, req.app.get("io"), req.app.get("onlineUsers"));
  }
);

module.exports = router;
