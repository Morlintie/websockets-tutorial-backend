const { createServer } = require("http");
const express = require("express");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

let scores = [];
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  socket.on("score", (data) => {
    scores = [...scores, data];

    socket.emit("scores", scores);
  });
});

httpServer.listen(3000, () => {
  console.log("Server is running on port 3000");
});
