const express = require("express");
const { authorization } = require("../middleware");
const {
  handleAddMoney,
  handleSendMoney,
  handleGetWalletBalance,
  handleGetPastTransactions,
} = require("../controllers");

const router = express.Router();

// ADD MONEY TO WALLET
router.post("/add-money", authorization, handleAddMoney);

// SEND MONEY BETWEEN WALLETS
router.post("/send-money", authorization, handleSendMoney);

// GET WALLET BALANCE
router.get("/wallet-balance", authorization, handleGetWalletBalance);

// GET ALL PAST TRANSACTIONS
router.get("/transactions", authorization, handleGetPastTransactions);

module.exports = router;
