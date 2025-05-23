const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      default: "",
    },
    lastName: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);


const User = mongoose.model("User", userSchema);

module.exports = User;