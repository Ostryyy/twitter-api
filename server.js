require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const tweetRoutes = require("./routes/tweetRoutes");

const app = express();

app.use(express.json());

app.use("api/auth", authRoutes);
app.use("/api/tweets", tweetRoutes);

mongoose
  .connect(`${process.env.MONGO_URI}/twitter-clone`)
  .then(() => {
    console.log("Connected to the DB");
    app.listen(3000, () => console.log("Server running on port 3000"));
  })
  .catch((error) => console.error(error));
