const express = require("express");
const router = express.Router();
const path = require("path");
const Jersey = require("../models/Jersey"); // Assuming you have this function imported
const RelayStudent = require("../models/RelayStudent");


router.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Admin Login Route
router.post("/adminlogin", (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.USERNAME_ADMIN && password === process.env.PASSWORD) {
    req.session.admin = true;
    req.session.allowSignup = false;

    return res.status(200).json({ success: true, token: "your_jwt_token" });
  }

  res.status(401).json({ error: "Invalid Admin Credentials" });
});

router.get("/admin-dashboard", (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: "Unauthorized. Please log in." });
  }

  res.json({ message: "Welcome to Admin Dashboard!" });
});

router.get("/jersey-numbers", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 1000,
      sortBy = "jerseyNumber", // default sorting
      order = "asc",           // ascending/descending
      collegeName,
      urn,
    } = req.query;

    const query = {};
    if (collegeName) query.collegeName = { $regex: collegeName, $options: "i" };
    if (urn) query.urn = urn;

    const sortOptions = {};
    sortOptions[sortBy] = order === "desc" ? -1 : 1;

    const totalJerseys = await Jersey.countDocuments(query);

    const jerseys = await Jersey.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      jerseys,
      pagination: {
        totalItems: totalJerseys,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalJerseys / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching jersey numbers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/relay", async (req, res) => {
  try {
    const { event, collegeName } = req.query;

    let filter = {};
    if (event) filter.event = event;
    if (collegeName) filter.collegeName = { $regex: collegeName, $options: "i" };

    const teams = await RelayStudent.find(filter);

    res.status(200).json({
      success: true,
      teams,
    });
  } catch (error) {
    console.error("Error fetching relay teams:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching relay teams.",
    });
  }
});

module.exports = router;
