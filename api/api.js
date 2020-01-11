const router = require("express").Router();

const Event = require("../model/event");
const AccessPoint = require("../model/accessPoint");
const DoorSensor = require("../model/doorSensor");

const parseMain = require("./parse");

router.get("/parse", (req, res, next) => {
  parseMain().then(() => {
    Event.find({}, (err, events) => {
      if (err) return next(err);
      console.log(events);
    })
  }).catch(next)
});

module.exports = router;