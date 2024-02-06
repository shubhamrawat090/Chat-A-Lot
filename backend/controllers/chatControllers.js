const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  // If a chat with this userId exists, we return it. Otherwise, we create a new chat
  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  // We need to find a chat which is
  // 1. not a group chat
  // 2. current user(req.user._id) and requested user(userId) both id's should be present as well
  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    // If such a chat exists then we populate the users array with all the details form the User DB(without the password)
    .populate("users", "-password")
    // Populate the latest message with the message from message db
    .populate("latestMessage");

  // Now in the Message model(for latestMessage) we have a sender and we need to populate that as well.
  // So, we populate it's data from the User DB
  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    // chat exists, send it
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
    };

    try {
      const createdChat = await Chat.create(chatData); // create entry in Chat DB
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      ); // Get the chat with created entry with users populated

      res.status(200).send(fullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

const fetchChats = asyncHandler(async (req, res) => {
  try {
    // Query the chat db and return all the chats which the user id is a part of
    // Populate everything needed - specially group chats and sort everything according to newest to oldest
    Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });

        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please fill all the fields" });
  }

  // Get all the users who are a part of the group
  var users = JSON.parse(req.body.users);

  // atleast 2 users are required to create a group chat
  if (users.length < 2) {
    return res
      .status(400)
      .send({ message: "More than 2 users are required to form a group chat" });
  }

  // Total users in group = all added users + current logged in user
  users.push(req.user._id);

  try {
    // Create the group chat entry in Chat DB
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user._id,
    });

    // fetch and return the chat created
    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      res.status(404);
      throw new Error("Chat not found");
    }

    // Check if userId already exists in the users array
    const userExists = chat.users.some((user) => user.toString() === userId);

    if (userExists) {
      res.status(400);
      throw new Error("User already exists in the chat");
    } else {
      // If userId doesn't exist, update the chat document
      const added = await Chat.findByIdAndUpdate(
        chatId,
        {
          $push: { users: userId },
        },
        { new: true }
      )
        .populate("users", "-password")
        .populate("groupAdmin", "-password");

      res.status(200).json(added);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    { new: true }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!removed) {
    res.status(404);
    throw new Error("Chat not found");
  } else {
    res.status(200).json(removed);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
};
