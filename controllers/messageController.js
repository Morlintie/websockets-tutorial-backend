const { StatusCodes } = require("http-status-codes");
const { BadRequestError } = require("../errors");
const { io, onlineUsers } = require("../server");
const Message = require("../models/Message");
const User = require("../models/User");

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

const sentMessage = async (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { message, image } = req.body;
  if (!id) {
    throw new BadRequestError("Please provide user id");
  }

  const user = await User.findOne({ _id: id });
  if (!user) {
    throw new BadRequestError("User not found");
  }
  if (image) {
    const result = await cloudinary.uploader.upload(image, {
      folder: "quickchat/messages",
      use_filename: true,
    });
    const newMessage = await Message.create({
      senderId: userId,
      receiverId: id,
      message,
      image: result.secure_url,
    });
    const receiverSocketId = onlineUsers[id];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", {
        text: newMessage,
        senderId: userId,
        receiverId: id,
        image: result.secure_url,
        seen: false,
      });
    }
    res.status(StatusCodes.CREATED).json({ message: newMessage });
  }
  const newMessage = await Message.create({
    senderId: userId,
    receiverId: id,
    text: message || "",
  });

  const receiverSocketId = onlineUsers[id];
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", {
      text: newMessage,
      senderId: userId,
      receiverId: id,

      seen: false,
    });
  }
  res.status(StatusCodes.CREATED).json({ message: newMessage });
};

module.exports = {
  getUnreadMessages,
  getMessages,
  markMessagesAsSeen,
  sentMessage,
};
