var mongoose = require("mongoose");

var roomSnapshotSchema = mongoose.Schema({
  room: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Number,
    required: true,
    index: true
  },
  people: {
    type: [String],
    default: []
  }
});

module.exports = mongoose.model("RoomSnapshot", roomSnapshotSchema);
