const mongoose = require('mongoose');

const relayLockSchema = new mongoose.Schema({
  collegeName: {
    type: String,
    required: true,
    unique: true
  },
  eventsLocked: {
    "4x100m Relay": {
      type: Boolean,
      default: false
    },
    "4x400m Relay": {
      type: Boolean,
      default: false
    },
    "4x100m Relay Female": {
      type: Boolean,
      default: false
    },
    "4x400m Relay Female": {
      type: Boolean,
      default: false
    }
  }
});

module.exports = mongoose.model('RelayLock', relayLockSchema);

