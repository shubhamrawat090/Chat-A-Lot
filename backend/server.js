const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { chats } = require("./dummyData/data");
const connectDB = require("./config/db");
const colors = require("colors");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectDB();

// NOTE: Load routes or any db queries after calling connect DB function
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

// Middleware - to parse/accept json data
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.use(cors());

app.get("/", (req, res) => {
  res.send("API is running successfully");
});

// All the user routes will start with /api/user
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Our custom created middlewares
app.use(notFound); // if any route url doesn't exist. It will fall on to this notFound middleware
app.use(errorHandler); // If still any other error occurred it will fall on to this middleware

app.listen(PORT, () => {
  console.log(`Server started at ${PORT}`.yellow.bold);
});
