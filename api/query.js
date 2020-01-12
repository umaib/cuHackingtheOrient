const router = require("express").Router();

const Event = require("../model/event");
const Person = require("../model/person");
const RoomSnapshot = require("../model/roomSnapshot");

router.post("/events", (req, res, next) => {
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
  let q = col[req.body.fn](
    req.body.query,
    req.body.projection,
    req.body.options,
    (err, events) => {
      if (err) return next(err);
      res.send(events);
    }
  ).lean(true);
  if (req.body.sort) {
    q = q.sort(req.body.sort);
  }
  if (req.body.limit) {
    q = q.limit(req.body.limit);
  }
}

module.exports = router;
