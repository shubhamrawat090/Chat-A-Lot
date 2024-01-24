const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { chats } = require("./dummyData/data");

const app = express();
dotenv.config();

const PORT = process.env.PORT || 5000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("API is running successfully");
});

app.get("/api/chat", (req, res) => {
  res.send(chats);
});

app.get("/api/chat/:id", (req, res) => {
  const { id } = req.params;
  const singleChat = chats.find((chat) => chat._id === id);
  if (singleChat) {
    res.send(singleChat);
  } else {
    res.send("No matching chat found.....");
  }
});

app.listen(PORT, () => {
  console.log(`Server started at ${PORT}`);
});
