const express = require("express");
const router = express.Router();
const {
  signupUser,
  loginUser,
  showUser,
  updateUser,
  logoutUser,
} = require("../controllers/userController");
const authenticationMiddleware = require("../middlewares/authenticationMiddleware");

router.post("/register", signupUser);
router.post("/login", loginUser);
router.patch("/update", authenticationMiddleware, updateUser);
router.get("/show", authenticationMiddleware, showUser);
router.get("/logout", authenticationMiddleware, logoutUser);

module.exports = router;
