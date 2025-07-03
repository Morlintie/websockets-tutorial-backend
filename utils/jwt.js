const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const createCookie = (user, token, res) => {
  const refreshToken = jwt.sign({ ...user, token }, process.env.JWT_SECRET);
  const accessToken = jwt.sign({ user }, process.env.JWT_SECRET);

  const refreshTokenExpiry = 1000 * 60 * 60 * 24 * 30;

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + refreshTokenExpiry),
    signed: true,
  });

  const accessTokenExpiry = 1000 * 60 * 15;
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + accessTokenExpiry),
    signed: true,
  });
};

const verifyCookie = (req, res) => {
  const { accessToken, refreshToken } = req.signedCookies;

  if (accessToken) {
    try {
      const user = jwt.verify(accessToken, process.env.JWT_SECRET);

      const reqUser = {
        userId: user?.user._id,
        fullName: user?.user.fullName,
        email: user?.user.email,
      };

      return reqUser;
    } catch (error) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Unauthorized access, please login again" });
    }
  }
  if (refreshToken) {
    try {
      const user = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const reqUser = {
        userId: user?.user._id,
        fullName: user?.user.fullName,
        email: user?.user.email,
      };

      createCookie(reqUser, user.refreshToken, res);
      return reqUser;
    } catch (error) {
      res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Unauthorized access, please login again" });
    }
  }
};

module.exports = { createCookie, verifyCookie };
