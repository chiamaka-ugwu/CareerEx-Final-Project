const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./userModel");
const Wallet = require("./walletModel");

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
app.post("/signup", async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // check email and password fields
    if (!email) {
      return res.status(400).json({ message: "Please add your email" });
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
});







// USER LOGIN
app.post("/login", async (req, res) => {
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
});
