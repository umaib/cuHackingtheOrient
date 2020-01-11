var mongoose = require("mongoose");

var personSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ["guest", "cleaning-staff", "cooking-staff", "reception-staff", "reception-night-staff", "unknown"]
  },
  room: {
    type: Number,
    min: 100
  }
});

module.exports = mongoose.model("Person", personSchema);
