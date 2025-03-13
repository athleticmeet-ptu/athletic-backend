const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    collegeName: String,
    username: { type: String, unique: true, required: true },
    password: String
});

module.exports = mongoose.model('User', userSchema);

