require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const tweetRoutes = require("./routes/tweetRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors({
  origin: 'http://localhost:3000'
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tweets", tweetRoutes);
app.use("/api/user", userRoutes);

mongoose
  .connect(`${process.env.MONGO_URI}/twitter-clone`)
  .then(() => {
    console.log("Connected to the DB");
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch((error) => console.error(error));
