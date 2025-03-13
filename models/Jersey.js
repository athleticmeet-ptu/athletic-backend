const mongoose = require('mongoose');

const jerseySchema = new mongoose.Schema({
  urn: { type: String, required: true, unique: true },
  studentName: { type: String, required: true },       // Added student name
  collegeName: { type: String, required: true },       // Added college name
  jerseyNumber: { type: Number, required: true, unique: true }
});

module.exports = mongoose.model('Jersey', jerseySchema);
