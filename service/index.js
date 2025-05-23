const User = require("../models/userModel");

const findUserService = async () => {
  const allUser = await User.find();

  return allUser;
};

module.exports = {
  findUserService,
};
