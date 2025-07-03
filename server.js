const express = require("express");
const cloudinary = require("cloudinary").v2;
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./db/connection");
const userRouter = require("./routes/userRouter");
const messageRouter = require("./routes/messageRouter");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

const app = express();
const server = http.createServer(app);
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

let onlineUsers = {};
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
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

app.set("io", io);
app.set("onlineUsers", onlineUsers);

app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "4mb" }));

app.use(cookieParser(process.env.JWT_SECRET));
app.use(morgan("tiny"));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME, // Correct the typo: 'could_name' -> 'cloud_name'
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

app.use("/api/user", userRouter);
app.use("/api/messages", messageRouter);

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
