var mongoose = require("mongoose");

var roomSnapshotSchema = mongoose.Schema({
  room: {
    type: String,
    required: true,
    unique: true
  },
  timestamp: {
    type: Number,
    required: true
  },
  people: {
    type: Array,
    default: []
  }
});

module.exports = mongoose.model("RoomSnapshot", roomSnapshotSchema);
