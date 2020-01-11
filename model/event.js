var mongoose = require("mongoose");

var eventSchema = mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  eventId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Number,
    required: true,
    index: true
  },
  guestId: {
    type: String
  }
});

module.exports = mongoose.model("Event", eventSchema);
