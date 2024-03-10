const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

router.get("/search", async (req, res) => {
  const { q } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    });
    const pages = Math.ceil(total / limit);

    res.json({ data: users, total, pages, currentPage: page });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/updateProfile", protect, async (req, res) => {
  try {
    const { username, email, bio } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      user.username = username || user.username;
      user.email = email || user.email;
      user.bio = bio || user.bio;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio,
        followersCount: updatedUser.followersCount,
        followingCount: updatedUser.followingCount,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/changePassword", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user && (await user.comparePassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: "Password updated successfully" });
    } else {
      res
        .status(400)
        .json({ message: "Current password is wrong or user not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id/follow", protect, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow.followers.includes(req.user._id)) {
      userToFollow.followers.push(req.user._id);
      userToFollow.followersCount += 1;
      await userToFollow.save();

      currentUser.following.push(req.params.id);
      currentUser.followingCount += 1;
      await currentUser.save();

      res
        .status(200)
        .json({ message: `You are now following ${userToFollow.username}` });
    } else {
      res.status(400).json({ message: "You're already following this user" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id/unfollow", protect, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (userToUnfollow.followers.includes(req.user._id)) {
      userToUnfollow.followers.pull(req.user._id);
      userToUnfollow.followersCount -= 1;
      await userToUnfollow.save();

      currentUser.following.pull(req.params.id);
      currentUser.followingCount -= 1;
      await currentUser.save();

      res
        .status(200)
        .json({
          message: `You have stopped following ${userToUnfollow.username}`,
        });
    } else {
      res.status(400).json({ message: "You're not following this user" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
