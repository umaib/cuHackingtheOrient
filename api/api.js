const router = require("express").Router();
const fs = require("fs");

const Event = require("../model/event");
const RoomSnapshot = require("../model/roomSnapshot");

const parseMain = require("./parse");

router.use("/query", require("./query"));
router.use("/aggregate", require("./aggregate"));

router.get("/parse", (req, res, next) => {
  parseMain()
    .then(() => {
      RoomSnapshot.find({}, (err, snapshots) => {
        if (err) return next(err);
        res.send(snapshots);
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

router.get("/test", (req, res) => {
  res.render("test", {title: "cuHacking the Orient"});
});

module.exports = router;
