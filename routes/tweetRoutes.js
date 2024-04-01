const express = require("express");
const router = express.Router();
const Tweet = require("../models/Tweet");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, async (req, res) => {
  try {
    const tweets = await Tweet.find()
      .populate("author", "username _id")
      .populate({
        path: "comments.author",
        select: "username _id",
      })
      .populate({
        path: "originalTweetId",
        populate: [
          { path: "author", select: "username _id" },
          { path: "likes", select: "username _id" },
          { path: "retweets", select: "username _id" },
          {
            path: "comments",
            populate: { path: "author", select: "username _id" },
          },
        ],
      });

    res.status(200).json(tweets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:tweetId", protect, async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.tweetId);

    if (!tweet) {
      return res.status(404).json({ message: "Tweet not found" });
    }

    if (tweet.author.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "User not authorized" });
    }

    await Tweet.findByIdAndDelete(req.params.tweetId);
    res.status(200).json({ message: "Tweet deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    const tweet = await Tweet.create({
      content,
      author: req.user._id,
    });

    res.status(201).json(tweet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating tweet" });
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
    const { content } = req.body;

    const originalTweet = await Tweet.findById(req.params.tweetId);
    if (!originalTweet) {
      return res.status(404).json({ message: "Original tweet not found" });
    }

    const retweet = await Tweet.create({
      content: content ?? "",
      author: req.user._id,
      originalTweetId: originalTweet._id,
    });

    originalTweet.retweets.push(req.user._id);
    await originalTweet.save();

    const populatedRetweet = await Tweet.findById(retweet._id)
      .populate("author", "username")
      .populate("originalTweetId");

    res.status(201).json(populatedRetweet);
  } catch (error) {
    console.error(error);
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
    const tweets = await Tweet.find({ author: userId })
      .populate("author", "username _id")
      .populate({
        path: "comments.author",
        select: "username _id",
      })
      .populate({
        path: "originalTweetId",
        populate: [
          { path: "author", select: "username _id" },
          { path: "likes", select: "username _id" },
          { path: "retweets", select: "username _id" },
          {
            path: "comments",
            populate: { path: "author", select: "username _id" },
          },
        ],
      });
    res.status(200).json(tweets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/feed", protect, async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const tweets = await Tweet.find({ author: { $in: currentUser.following } })
      .populate("author", "username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTweets = await Tweet.countDocuments({
      author: { $in: currentUser.following },
    });
    const totalPages = Math.ceil(totalTweets / limit);

    res.json({
      tweets,
      currentPage: page,
      totalPages,
      totalTweets,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
