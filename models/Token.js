const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  token: { type: String, required: true },
});

const Token = mongoose.model("Token", tokenSchema);
module.exports = Token;
