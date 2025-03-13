const User = require("../models/User");
const bcrypt = require("bcrypt");

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}); // Exclude passwords in the response
    res.json(users);
  } catch (error) {
    console.error("❌ Get Users Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create a user
const createUser = async (req, res) => {
  try {
    const { collegeName, username, password } = req.body;

    // Check for duplicate username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists!" });
    }

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
};

// Delete a user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }

    res.json({ success: true, message: "User deleted successfully!" });
  } catch (error) {
    console.error("❌ Delete User Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update a user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { collegeName, username, password } = req.body;

    let updateFields = { collegeName, username };

    // Optional: Check if username already exists for another user
    const existingUser = await User.findOne({ username, _id: { $ne: id } });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists!" });
    }

    if (password && password.trim() !== "") {
      updateFields.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateFields, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found!" });
    }

    res.json({
      success: true,
      message: "User updated successfully!",
      updatedUser,
    });
  } catch (error) {
    console.error("❌ Update User Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  deleteUser,
  updateUser,
};
