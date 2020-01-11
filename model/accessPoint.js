var mongoose = require("mongoose");

var accessPointSchema = mongoose.Schema({
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

module.exports = mongoose.model("AccessPoint", accessPointSchema);
