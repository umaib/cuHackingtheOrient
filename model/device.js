var mongoose = require("mongoose");

var deviceSchema = mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    required: true,
    enum: ["access point", "door sensor", "motion sensor", "phone"]
  }
});

module.exports = mongoose.model("Device", deviceSchema);
