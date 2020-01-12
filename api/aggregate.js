const router = require("express").Router();

const Event = require("../model/event");
const Device = require("../model/device");

router.post("/event", (req, res, next) => {
  req.body.stages = req.body.stages || [];
  let q = Event.aggregate(req.body.stages, (err, events) => {
    if (err) return next(err);
    res.send(events);
  });
});

module.exports = router;
