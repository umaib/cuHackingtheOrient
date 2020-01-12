const router = require("express").Router();

const Event = require("../model/event");
const Device = require("../model/device");

router.post("/events", (req, res, next) => {
  console.log(req.body.query);
  handleQuery(Event, req, res, next);
});

router.post("/people", (req, res, next) => {
  handleQuery(Person, req, res, next);
});

router.post("/roomSnapshots", (req, res, next) => {
  handleQuery(RoomSnapshot, req, res, next);
});

function handleQuery(col, req, res, next) {
  req.body.fn = req.body.fn || "find";
  req.body.query = req.body.query || {};
  req.body.projection = req.body.projection || {};
  req.body.options = req.body.options || {};
  let q = Event[req.body.fn](
    req.body.query,
    req.body.projection,
    req.body.options,
    (err, events) => {
      if (err) return next(err);
      res.send(events);
    }
  ).lean(true);
  if (req.body.sort) {
    q.sort(req.body.sort);
  }
}

module.exports = router;
