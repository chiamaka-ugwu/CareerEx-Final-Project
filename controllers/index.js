const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Wallet = require("../models/walletModel");
const Transaction = require("../models/transactionModel");
const { findUserService } = require("../service");
const { validEmail, sendForgotPasswordEmail } = require("../sendMail");

// get all users
const handleGetAllUsers = async (req, res) => {
  console.log(req.user);

  // check if user is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  const allUser = await findUserService();

  res.status(200).json({
    message: "Successful",
    allUser,
  });
};

// sign up
const handleUserRegistration = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // check email and password fields
    if (!email) {
      return res.status(400).json({ message: "Please add your email" });
    }

    if (!validEmail(email)) {
      return res.status(400).json({ message: "Incorrect email format" });
    }

    if (!password) {
      return res.status(400).json({ message: "Please enter password" });
    }

    // check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // password validation
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one letter and one number",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // create new user
    const newUser = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
    });

    await newUser.save();

    // create wallet
    const wallet = new Wallet({
      userId: newUser._id,
      balance: 0,
    });

    await wallet.save();

    // send email

    res.status(201).json({
      message: "User created successfully",
      newUser: {
        email,
        firstName,
        lastName,
        phone,
        walletId: wallet._id,
        balance: wallet.balance,
        currency: wallet.currency,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// login
const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check email and password fields
    if (!email) {
      return res.status(400).json({ message: "Please add your email" });
    }

    if (!password) {
      return res.status(400).json({ message: "Please enter password" });
    }

    // check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User account does not exist" });
    }

    // check password
    const isMatch = await bcrypt.compare(password, user?.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect email or password" });
    }

    // generate JWT token
    const accessToken = jwt.sign({ id: user?._id }, process.env.ACCESS_TOKEN, {
      expiresIn: "5m",
    });

    const refreshToken = jwt.sign(
      { id: user?._id },
      process.env.REFRESH_TOKEN,
      {
        expiresIn: "30d",
      }
    );

    // find user wallet
    const wallet = await Wallet.findOne({ userId: user?._id });

    if (!wallet) {
      return res.status(400).json({ message: "Wallet not found" });
    }

    //login user
    res.status(200).json({
      message: "User login successful",
      accessToken,
      user: {
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
        phone: user?.phone,
        walletId: wallet?._id,
        balance: wallet?.balance,
        currency: wallet?.currency,
      },
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// forgot password
const handleForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // check email field
    if (!email) {
      return res.status(400).json({ message: "Please add your email" });
    }

    // check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User account does not exist" });
    }

    // Send the user an email with their token
    const accessToken = await jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN,
      {
        expiresIn: "1h",
      }
    );

    // send email with  token
    await sendForgotPasswordEmail(email, accessToken);

    // Send OTP

    res.status(200).json({
      message: "Email sent successfully",
      accessToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// reset password
const handleResetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    // check password field
    if (!password) {
      return res.status(400).json({ message: "Please enter new password" });
    }
    // check if user exists
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: "User account not found!" });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {}
};

// MILESTONE 2: MONEY TRANSFERS LOGIC
// add money to wallet
const handleAddMoney = async (req, res) => {
  try {
    const { userId, amount } = req.body;

    // check user and amount fields
    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // find user wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // add money
    wallet.balance += amount;
    await wallet.save();

    // create transaction
    const transaction = new Transaction({
      sender: userId,
      receiver: userId,
      amount,
      transactionType: "credit",
      status: "completed",
    });
    await transaction.save();

    // update wallet transactions
    wallet.transactions.push(transaction._id);
    await wallet.save();

    res.status(200).json({
      message: "Money added successfully",
      balance: wallet.balance,
      currency: wallet.currency,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// send money between wallets
const handleSendMoney = async (req, res) => {
  try {
    const { senderId, receiverId, amount } = req.body;

    // Validate input
    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ message: "Please provide sender and receiver" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Please enter valid amount" });
    }

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: "Sender and receiver cannot be the same" });
    }

    // Find sender and receiver wallets
    const senderWallet = await Wallet.findOne({ userId: senderId });
    if (!senderWallet) {
      return res.status(404).json({ message: "Sender wallet not found" });
    }

    const receiverWallet = await Wallet.findOne({ userId: receiverId });
    if (!receiverWallet) {
      return res.status(404).json({ message: "Receiver wallet not found" });
    }

    // Validate balance before transfer
    if (senderWallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Deduct amount from sender's wallet and add to receiver's wallet
    senderWallet.balance -= amount;
    receiverWallet.balance += amount;

    // await senderWallet.save();
    // await receiverWallet.save();

    // Create debit transaction for sender
    const senderTransaction = new Transaction({
      sender: senderId,
      receiver: receiverId,
      amount,
      transactionType: "debit",
      status: "completed",
    });
    await senderTransaction.save();

    // update sender wallet transactions
    senderWallet.transactions.push(senderTransaction._id);
    await senderWallet.save();

    // Create credit transaction for receiver
    const receiverTransaction = new Transaction({
      sender: senderId,
      receiver: receiverId,
      amount,
      transactionType: "credit",
      status: "completed",
    });

    await receiverTransaction.save();

    // update receiver wallet transactions
    receiverWallet.transactions.push(receiverTransaction._id);
    await receiverWallet.save();

    res.status(200).json({
      message: "Money sent successfully",
      senderBalance: senderWallet.balance,
      receiverBalance: receiverWallet.balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MILESTONE 3
// get wallet balance
const handleGetWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;

    // check userId field
    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // find user wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.status(200).json({
      message: "Wallet balance retrieved successfully",
      balance: wallet.balance,
      currency: wallet.currency,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get past transactions
const handleGetPastTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    // check userId field
    if (!userId) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    // find user wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // get transactions
    const transactions = await Transaction.find({
      $or: [{ sender: userId }, { receiver: userId }],
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Transactions retrieved successfully",
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  handleGetAllUsers,
  handleUserRegistration,
  handleLogin,
  handleForgotPassword,
  handleResetPassword,
  handleAddMoney,
  handleSendMoney,
  handleGetWalletBalance,
  handleGetPastTransactions,
};
