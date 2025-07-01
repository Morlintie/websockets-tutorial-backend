const express = require("express");
const cloudinary = require("cloudinary").v2;
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./db/connection");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

const userRouter = require("./routes/userRouter");
const messageRouter = require("./routes/messageRouter");

app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "4mb" }));
app.use(
  cloudinary.config({
    could_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
  })
);

app.use("/user", userRouter);
app.use("/messages", messageRouter);

let onlineUsers = {};
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) {
    onlineUsers[userId] = socket.id;
  }
  io.emit("onlineUsers", onlineUsers);

  socket.on("disconnect", () => {
    delete onlineUsers[userId];
    io.emit("onlineUsers", onlineUsers);
  });
});

const connection = async () => {
  try {
    await connectDB();
    server.listen(3000, () => {
      console.log("Server is running on port 3000");
    });
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
};

connection();

module.exports = { io, onlineUsers };
