var mongoose = require("mongoose");

var doorSensorSchema = mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  guestId: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model("DoorSensor", doorSensorSchema);
