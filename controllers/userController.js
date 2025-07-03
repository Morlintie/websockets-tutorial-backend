const User = require("../models/User");
const Token = require("../models/Token");
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../errors");
const cloudinary = require("cloudinary").v2;
const { StatusCodes } = require("http-status-codes");
const { createCookie } = require("../utils");
const crypto = require("crypto");

const signupUser = async (req, res) => {
  try {
    const { fullName, email, password, bio } = req.body;

    if (!fullName || !email || !password) {
      throw new BadRequestError("Please provide all values");
    }

    const user = await User.create({
      fullName,
      email,
      password,
      bio: bio || "Hey there! I'm using quickchat.",
    });

    res.status(StatusCodes.CREATED).json({ user });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode).json({
      error: error.message || "Internal Serve Error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError("Please provide all data");
    }
    const user = await User.findOne({ email }).select();
    if (!user) {
      throw new NotFoundError("User not found");
    }
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new BadRequestError("Invalid credentials");
    }
    let token = await Token.findOne({ user: user._id });
    if (!token) {
      const prevToken = crypto.randomBytes(64).toString("hex");
      token = await Token.create({
        user: user._id,
        token: prevToken,
      });
    }
    createCookie(user, token.token, res);

    res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
};

const showUser = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findOne({ _id: userId }).select("-password -__v");
    if (!user) {
      throw new NotFoundError("User not found");
    }
    res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    console.log("hit the update user endpoint");
    console.log(req.body);
    const { userId } = req.user;
    const fullName = req?.body?.fullName;
    const bio = req?.body?.bio;
    const profilePic = req?.files?.profilePic;
    const updateObject = { fullName, profilePic: "", bio };
    console.log(profilePic);

    if (profilePic) {
      const result = await cloudinary.uploader.upload(profilePic.tempFilePath, {
        folder: "quickchat/profilePics",
        use_filename: true,
      });
      updateObject.profilePic = result.secure_url;
    }

    Object.keys(updateObject).forEach((key) => {
      if (
        updateObject[key] === undefined ||
        updateObject[key] === "" ||
        updateObject[key] === null
      ) {
        delete updateObject[key];
      }
    });

    const user = await User.findOneAndUpdate({ _id: userId }, updateObject, {
      new: true,
      runValidators: true,
    }).select("-password -__v");

    if (!user) {
      throw new NotFoundError("User not found");
    }

    let token = await Token.findOne({ user: user._id });
    if (!token) {
      const prevToken = crypto.randomBytes(64).toString("hex");
      token = await Token.create({
        user: user._id,
        token: prevToken,
      });
    }
    createCookie(user, token.token, res);

    res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message || "Internal Server Error",
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const token = await Token.findOne({ user: userId });
    if (!token) {
      throw new UnauthorizedError("You are not logged in");
    }
    await Token.findOneAndDelete({ user: userId });

    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      signed: true,
      expires: new Date(Date.now()),
    });
    res.cookie("accessToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      signed: true,
      expires: new Date(Date.now()),
    });
    res.status(StatusCodes.OK).json({ msg: "User logged out successfully" });
  } catch (error) {
    res.status(error.statusCode).json({
      error: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  signupUser,
  loginUser,
  showUser,
  updateUser,
  logoutUser,
};
