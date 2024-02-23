const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

const sendMessage = asyncHandler(async (req, res) => {
  // Things required to send a message:
  // 1. ChatID
  // 2. Actual Message
  // 3. Who is the sender of the message(will get it from middleware - the person who is logged in)
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  // check if it is a valid chat ID by checking if a corresponding chat exists
  const chatExists = await Chat.findById(chatId);
  if (!chatExists) {
    throw new Error("Chat doesn't exist. Please send a valid chatId");
  }

  // This is according to the Message Model
  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    // Create a message entry in DB and return the created object
    var message = await Message.create(newMessage);

    // Populating only the name and pic in the sender column.
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    // Here we are using the User model to populate the chat.users, specifically the name, pic, email
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    // Find the chat by ID and update the latestMessage
    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    console.log(error);
    res.status(400);
    throw new Error(error.message);
  }
});

const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");

    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { sendMessage, allMessages };
