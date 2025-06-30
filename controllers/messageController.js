const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");
const Message = require("../models/Message");

const getUnreadMessages = async (req, res) => {
  try {
    const { userId } = req.user;
    const users = await User.find({ _id: { $ne: userId } }).select(
      "-password -__v"
    );

    const unreadMessages = users.map(async (user) => {
      const messages = await Message.find({
        sender: user._id,
        receiver: userId,
        seen: false,
      });
      return {
        userId: user._id,
        unreadMessages: messages.length,
      };
    });

    const unreadMessagesResults = await Promise.all(unreadMessages);
    res.status(StatusCodes.OK).json({
      users,
      unreadMessages: unreadMessagesResults,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error",
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide user id");
    }

    const user = await User.findOne({ _id: id });
    if (!user) {
      throw new BadRequestError("User not found");
    }
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: id },
        { senderId: id, receiverId: userId },
      ],
    }).sort("createdAt");

    res.status(StatusCodes.OK).json({
      messages,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error",
    });
  }
};

const markMessagesAsSeen = async (req, res) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    if (!id) {
      throw new BadRequestError("Please provide chat id");
    }
    const chat = await Message.findOneAndUpdate(
      { _id: id },
      { seen: true },
      { new: true, runValidators: true }
    );
    if (!chat) {
      throw new BadRequestError("Chat not found");
    }
    res.status(StatusCodes.OK).json({
      chat,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error",
    });
  }
};
