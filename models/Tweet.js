const mongoose = require("mongoose");

const tweetSchema = new mongoose.Schema({
  content: { type: String, maxlength: 280 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  retweets: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      content: String,
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  originalTweetId: { type: mongoose.Schema.Types.ObjectId, ref: "Tweet" },
});

module.exports = mongoose.model("Tweet", tweetSchema);

