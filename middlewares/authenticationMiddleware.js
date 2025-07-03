const { verifyCookie } = require("../utils/jwt");
const { StatusCodes } = require("http-status-codes");

const authenticationMiddleware = (req, res, next) => {
  try {
    const user = verifyCookie(req, res);

    req.user = user;
    if (!user) {
      return;
    }
    next();
  } catch (error) {
    console.error(error);
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Unauthorized access" });
  }
};
module.exports = authenticationMiddleware;
