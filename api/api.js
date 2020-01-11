const router = require("express").Router();
const fs = require("fs");

const Event = require("../model/event");
const Device = require("../model/device");

const parseMain = require("./parse");

router.get("/parse", (req, res, next) => {
  parseMain()
    .then(() => {
      Event.find({}, (err, events) => {
        if (err) return next(err);
        res.send(events);
      });
    })
    .catch(next);
});

router.get("/james", (req, res, next) => {
  Event.find({ deviceId: 250 }, (err, events) => {
    if (err) return next(err);
    res.send(events);
  }).sort({ timestamp: -1 });
});

module.exports = router;