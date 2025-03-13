const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  createUser,
  deleteUser,
  updateUser,
} = require("../controllers/userController");

// Signup / Create User
router.post("/signup", createUser);

// Get all users
router.get("/users", getAllUsers);

// Delete a user by ID
router.delete("/users/:id", deleteUser);

// Update a user by ID (Optional)
router.put("/users/:id", updateUser);

module.exports = router;
