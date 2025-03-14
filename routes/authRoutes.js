const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { collegeName, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      collegeName,
      username,
      password: hashedPassword,
    });
    await newUser.save();
    res.json({ success: true, message: "User registered successfully!" });
  } catch (error) {
    console.error("❌ Signup Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid Username or Password" });
  }

  req.session.username = user.username;
  req.session.collegeName = user.collegeName;

  // ✅ Debugging Session
  console.log("Session After Login:", req.session);

  req.session.save((err) => {
    if (err) {
      console.error("Session Save Error:", err);
      return res.status(500).json({ error: "Session not saved" });
    }
    res.json({ success: true, redirect: "/studentform" });
  });
});


router.get("/user-info", (req, res) => {
  if (!req.session.username) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json({ collegeName: req.session.collegeName });
});

router.get("/logout", (req, res) => {
  req.session.destroy(() =>
    res.json({ success: true, message: "Logged out successfully" })
  );
});

module.exports = router;
