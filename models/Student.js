const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  collegeName: { type: String, required: true }, // Added college name
  event: { type: String, required: true },
  students: {
    student1: {
      name: { type: String, required: true },
      urn: { type: String, required: true, sparse: true },
      idCard: { type: String },
      gmail: { type: String, required: true },
      fatherName: { type: String, required: true },
      age: { type: Number, required: true },
      phoneNumber: { type: String, required: true },
    },
    student2: {
      name: { type: String },
      urn: { type: String, unique: false }, // Can be in multiple events
      idCard: { type: String },
      gmail: { type: String },
      fatherName: { type: String },
      age: { type: Number },
      phoneNumber: { type: String },
    },
  },
});
const Student = mongoose.model("Student", studentSchema);
module.exports = Student;
