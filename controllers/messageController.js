const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");

const Message = require("../models/Message");
const User = require("../models/User");
const cloudinary = require("cloudinary").v2;

const getUnreadMessages = async (req, res) => {
  try {
    const { userId } = req.user;
    const users = await User.find({ _id: { $ne: userId } }).select(
      "-password -__v"
    );

    const unreadMessages = users.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });
      console.log("messages", messages);
      return {
        [user._id]: messages.length,
      };
    });

    const unreadMessagesResults = await Promise.all(unreadMessages);

    res.set("Cache-Control", "no-store");
    console.log("unreadMessagesResults", unreadMessagesResults);
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

    await Message.updateMany(
      {
        $or: [
          { senderId: userId, receiverId: id },
          { senderId: id, receiverId: userId },
        ],
      },
      { seen: true }
    );
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: id },
        { senderId: id, receiverId: userId },
      ],
    }).sort("createdAt");

    res.set("Cache-Control", "no-store");
    res.status(StatusCodes.OK).json({
      messages: messages || [],
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

const sentMessage = async (req, res, io, onlineUsers) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;
    const message = req?.body?.message;

    const image = req?.files?.image;
    if (!id) {
      throw new BadRequestError("Please provide user id");
    }
    if (message) {
      if (message === "") {
        throw new BadRequestError("Message cannot be empty");
      }
    }

    const user = await User.findOne({ _id: id });
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (image) {
      const result = await cloudinary.uploader.upload(image.tempFilePath, {
        folder: "quickchat/messages",
        use_filename: true,
      });
      const newMessage = await Message.create({
        senderId: userId,
        receiverId: id,
        message: message || "",
        image: result.secure_url,
      });

      const receiverSocketId = onlineUsers[id];
      if (receiverSocketId) {
        console.log("newMessage", newMessage);
        io.to(receiverSocketId).emit("newMessage", newMessage);
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
      console.log(receiverSocketId);
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    res.status(StatusCodes.CREATED).json({ message: newMessage });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getUnreadMessages,
  getMessages,
  markMessagesAsSeen,
  sentMessage,
};
