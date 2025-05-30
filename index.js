const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const {
  validateRegister,
  authorization,
  validateLogin,
} = require("./middleware");
const {
  handleUserRegistration,
  handleGetAllUsers,
  handleLogin,
  handleAddMoney,
  handleSendMoney,
  handleResetPassword,
  handleForgotPassword,
  handleGetWalletBalance,
  handleGetPastTransactions,
} = require("./controllers");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URL).then(() => {
  console.log("MongoDB connected...");
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

// USER SIGN UP
app.post("/sign-up", validateRegister, handleUserRegistration);

// USER LOGIN
app.post("/login", validateLogin, handleLogin);

// GET ALL USERS
app.get("/all-users", authorization, handleGetAllUsers);

// FORGOT PASSWORD
app.post("/forgot-password", handleForgotPassword);

// RESET PASSWORD
app.post("/reset-password", authorization, handleResetPassword);

// Milestone 2: Money Transfers

// 1.Add money transfer logic between wallets.

// ADD MONEY TO WALLET
app.post("/add-money", authorization, handleAddMoney);

// SEND MONEY BETWEEN WALLETS
app.post("/send-money", authorization, handleSendMoney);


// Milestone 3
// GET WALLET BALANCE
app.get("/wallet-balance", authorization, handleGetWalletBalance);

// GET ALL PAST TRANSACTIONS
app.get("/transactions", authorization, handleGetPastTransactions);
