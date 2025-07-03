const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      validation: {
        validator: async function (v) {
          const user = await this.constructor.findOne({ email: v });
          return !user;
        },
        message: "Email already exists",
      },
      validation: {
        validator: function (v) {
          return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
        },
        message: "Invalid email format",
      },
    },
    password: { type: String, required: true, minlength: 6 },
    profilePic: { type: String },
    bio: {
      type: String,
      maxLength: 500,
      default: "Hey there! I'm using quickchat.",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      console.error("Error hashing password:", error);
    }
  }
});

userSchema.pre("findOneAndUpdate", async function () {
  if (this.getUpdate().password) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.getUpdate().password = await bcrypt.hash(
        this.getUpdate().password,
        salt
      );
    } catch (error) {
      console.error("Error hashing password:", error);
    }
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);

    return isMatch;
  } catch (error) {
    console.error("Error comparing password:", error);
  }
};

const User = mongoose.model("User", userSchema);

module.exports = User;
