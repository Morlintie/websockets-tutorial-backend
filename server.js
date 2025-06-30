const express = require("express");
const cloudinary = require("cloudinary").v2;
const http = require("http");
const connectDB = require("./db/connection");

const app = express();
const server = http.createServer(app);
const userRouter = require("./routes/userRouter");

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
