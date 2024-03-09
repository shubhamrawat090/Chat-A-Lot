const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { chats } = require("./dummyData/data");
const connectDB = require("./config/db");
const colors = require("colors");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");

dotenv.config();
connectDB();

// NOTE: Load routes or any db queries after calling connect DB function
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

// Middleware - to parse/accept json data
app.use(express.json());

app.use(cors());

// All the user routes will start with /api/user
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// ---------------------------- DEPLOYMENT ---------------------------

// THIS CODE BASICALLY RUNS THE BUILT FRONTEND CODE(in dist folder) AT PORT 5000 in localhost:5000

// Present working directory. __dirname is a reserved keyword so we took __dirname1
const __dirname1 = path.resolve();

// Check if the environment is production
if (process.env.NODE_ENV === "production") {
  // Serve static files from the frontend/dist directory
  app.use(express.static(path.join(__dirname1, "/frontend/dist")));

  // For all routes that are not found, serve the index.html file from the frontend/dist directory
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "frontend", "dist", "index.html"));
  });
} else {
  // If not in production mode, respond with a simple message
  app.get("/", (req, res) => {
    res.send("API is Running Successfully");
  });
}

// ---------------------------- DEPLOYMENT ---------------------------

// Our custom created middlewares
app.use(notFound); // if any route url doesn't exist. It will fall on to this notFound middleware
app.use(errorHandler); // If still any other error occurred it will fall on to this middleware

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server started at ${PORT}`.yellow.bold);
});

const io = require("socket.io")(server, {
  pingTimeout: 60000, // 60 seconds of inactivity will result in closing of connection to save bandwidth
  cors: {
    origin: "http://localhost:5000", // Allowing out frontend URL to send requests
  },
});

// This is where out websocket connection logic resides.
io.on("connection", (socket) => {
  console.log("connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id); // We create a room for that particular user only
    console.log(userData._id);
    socket.emit("connected");
  });

  // This is an event for 1-1/group conversation when a chat is clicked and the conversation is opened
  socket.on("join chat", (room) => {
    // We get the roomID from the frontend(Probably _id of the chat) which uniquely determines the entire chat
    // We create a room via this ID for that user
    console.log("User Joined Room: " + room);
    socket.join(room);
  });

  // This socket is for handling the typing of user 1 to user 2. This means when client 1 starts typing then it emits it to this "typing" event/socket and the server sends the "Typing" OR "Stop Typing" indication to client 2(or other clients if it is a group chat)
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  // This handles the sending of message via websockets and is triggered from the client side after the backend request is completed for sending the message
  socket.on("new message", (newMessageReceived) => {
    var chat = newMessageReceived.chat;

    // For testing purpose, if there are no users then we will store a log of that in the backend
    if (!chat.users) return console.log("chat.users not defined");

    // If a new message is received the we send it to all the users in that chat except the sender
    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;

      // In the room with the user id which we created in "setup" we send this message so that each user can receive it.
      // On the client side, each user is listening to this "message received" event and will append this message once received
      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  // Cleanup of sockets
  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
