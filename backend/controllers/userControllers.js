const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, pic } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please enter all the fields.");
  }

  // check user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists.");
  }

  // Create a new user
  const user = await User.create({
    name,
    email,
    password,
    pic,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Failed to create the user.");
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // find if user exists
  const user = await User.findOne({ email });

  // matchPassword is called to the user which we got from DB and it is defined in the userModel
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      pic: user.pic,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid Email or Password.");
  }
});

// /api/user?search=jane
const allUsers = asyncHandler(async (req, res) => {
  // if req.query.search exists: make a mongodb OR operation where name, email are matched via regex(case insensitive)
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  // First match the users by the regex expression then give me all the results which do not match the current user
  const users = await User.find({ _id: { $ne: req.user._id } })
    .select("-password") // Don't need to send the password
    .find(keyword);

  res.send(users);
});

// Non-default exports are sent in an object { }
module.exports = { registerUser, authUser, allUsers };
