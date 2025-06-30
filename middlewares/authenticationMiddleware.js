const { verifyCookie } = require("../utils/jwt");
const { StatusCodes } = require("http-status-codes");

const authenticationMiddleware = (req, res, next) => {
  try {
    const user = verifyCookie(req, res);
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Unauthorized access" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Unauthorized access" });
  }
};
module.exports = authenticationMiddleware;
