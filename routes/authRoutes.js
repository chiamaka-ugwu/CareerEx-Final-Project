const express = require("express");
const {
  validateRegister,
  validateLogin,
  authorization,
} = require("../middleware");
const {
  handleUserRegistration,
  handleLogin,
  handleGetAllUsers,
  handleForgotPassword,
  handleResetPassword,
} = require("../controllers");

const router = express.Router();

// SIGN UP
router.post("/sign-up", validateRegister, handleUserRegistration);

// LOGIN
router.post("/login", validateLogin, handleLogin);

// GET ALL USERS
router.get("/all-users", authorization, handleGetAllUsers);

// FORGOT PASSWORD
router.post("/forgot-password", handleForgotPassword);

// RESET PASSWORD
router.post("/reset-password", authorization, handleResetPassword);

module.exports = router;
