const models = require("../models/admin.login");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const signup = async (req, res) => {
  const { Username, password } = req.body;
  try {
    const existingUser = await models.findOne({
      Username: Username,
    });
    if (existingUser) {
      return res.status(400).json("User Already Registered");
    }
    const hashedPassword = await bcrypt.hash(password, 11);

    const result = await models.create({
      Username: Username,
      password: hashedPassword,
    });
    const token = jwt.sign(
      { email: result.email, id: result._id },
      process.env.SECRET_KEY
    );
    res.status(201).json({ user: result, token: token });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "something went wrong" });
  }
};
const login = async (req, res) => {
  const { Username, password } = req.body;
  try {
    const existingUser = await models.findOne({ Username: Username });
    if (!existingUser) {
      return res.status(500).json({ message: "User not found" });
    }
    const matchPassword = await bcrypt.compare(password, existingUser.password);
    if (!matchPassword) {
      return res.status(500).json({ message: "Invalid password" });
    }
    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.SECRET_KEY
    );
    res.status(201).json({ user: existingUser, token: token });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Something went wrong" });
  }
};
module.exports = {
  login,
  signup,
};
