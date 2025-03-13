const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: String,
  urn: String,
  gmail: String,
  fatherName: String,
  age: Number,
  phoneNumber: String,
  image: String, // Cloudinary image URL
});

const relayStudentSchema = new mongoose.Schema({
  collegeName: { type: String, required: true },
  event: { type: String, required: true }, // 4x100m or 4x40a0m
  students: [studentSchema], // array of 4 students
});

module.exports = mongoose.model("RelayStudent", relayStudentSchema);

