const mongoose = require("mongoose");

const MaleEventLock = new mongoose.Schema({
  collegeName: {
    type: String,
    required: true,
    unique: true,
  },
  eventsLocked: {
    "100M Race-Male": {
      type: Boolean,
      default: false,
    },
    "200M Race-Male": {
      type: Boolean,
      default: false,
    },
    "400M Race-Male": {
      type: Boolean,
      default: false,
    },
    "800M Race-Male": {
      type: Boolean,
      default: false,
    },
    "1500M Race-Male": {
      type: Boolean,
      default: false,
    },
    "5000M Race-Male": {
      type: Boolean,
      default: false,
    },
    "10000M Race-Male": {
      type: Boolean,
      default: false,
    },
    "110M Hurdles-Male": {
      type: Boolean,
      default: false,
    },
    "400M Hurdles-Male": {
      type: Boolean,
      default: false,
    },
    "Long Jump-Male": {
      type: Boolean,
      default: false,
    },
    "Triple Jump-Male": {
      type: Boolean,
      default: false,
    },
    "High Jump-Male": {
      type: Boolean,
      default: false,
    },
    "Shot Put-Male": {
      type: Boolean,
      default: false,
    },
    "Discus Throw-Male": {
      type: Boolean,
      default: false,
    },
    "Javelin Throw-Male": {
      type: Boolean,
      default: false,
    },
    "Hammer Throw-Male": {
      type: Boolean,
      default: false,
    },
    "100M Race-Female": {
      type: Boolean,
      default: false,
    },
    "200M Race-Female": {
      type: Boolean,
      default: false,
    },
    "400M Race-Female": {
      type: Boolean,
      default: false,
    },
    "800M Race-Female": {
      type: Boolean,
      default: false,
    },
    "1500M Race-Female": {
      type: Boolean,
      default: false,
    },
    "3000M Race-Female": {
      type: Boolean,
      default: false,
    },
    "100M Hurdles-Female": {
      type: Boolean,
      default: false,
    },
    "400M Hurdles-Female": {
      type: Boolean,
      default: false,
    },
    "Long Jump-Female": {
      type: Boolean,
      default: false,
    },
    "Triple Jump-Female": {
      type: Boolean,
      default: false,
    },
    "High Jump-Female": {
      type: Boolean,
      default: false,
    },
    "Shot Put-Female": {
      type: Boolean,
      default: false,
    },
    "Discus Throw-Female": {
      type: Boolean,
      default: false,
    },
    "Javelin Throw-Female": {
      type: Boolean,
      default: false,
    },
  },
});

module.exports = mongoose.model("MaleEventLock", MaleEventLock);