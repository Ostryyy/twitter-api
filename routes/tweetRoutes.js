const express = require("express");
const router = express.Router();
const Tweet = require("../models/Tweet");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, async (req, res) => {
  try {
    const { content } = req.body;
    const tweet = await Tweet.create({
      content,
      author: req.user._id,
    });
    res.status(201).json(tweet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/:tweetId/like", protect, async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.tweetId);
    if (tweet.likes.includes(req.user._id)) {
      tweet.likes.pull(req.user._id);
    } else {
      tweet.likes.push(req.user._id);
    }
    await tweet.save();
    res.json(tweet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/:tweetId/retweet", protect, async (req, res) => {
  try {
    const originalTweet = await Tweet.findById(req.params.tweetId);
    const retweet = await Tweet.create({
      content: originalTweet.content,
      author: req.user._id,
    });
    res.json(retweet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/:tweetId/comment", protect, async (req, res) => {
  try {
    const { content } = req.body;
    const tweet = await Tweet.findById(req.params.tweetId);
    tweet.comments.push({
      content,
      author: req.user._id,
    });
    await tweet.save();
    res.json(tweet);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const tweets = await Tweet.find().populate("author", "username");
    res.status(200).json(tweets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/search", async (req, res) => {
  const { q } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const tweets = await Tweet.find({ content: { $regex: q, $options: "i" } })
      .populate("author", "username")
      .skip(skip)
      .limit(limit);

    const total = await Tweet.countDocuments({
      content: { $regex: q, $options: "i" },
    });
    const pages = Math.ceil(total / limit);

    res.json({ data: tweets, total, pages, currentPage: page });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const tweets = await Tweet.find({ author: userId }).populate(
      "author",
      "username"
    );
    res.status(200).json(tweets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
