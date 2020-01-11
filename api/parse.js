const fs = require("fs");
const mongoose = require("mongoose");

const Event = require("../model/event");
const AccessPoint = require("../model/accessPoint");
const DoorSensor = require("../model/doorSensor");

const DATA_FILE_NAME = "./martello-data.json";

async function loadFile() {
  await fs.readFileSync(DATA_FILE_NAME);
}

async function main() {
  let data = await loadFile();
  let events = [];
  let accessPoints = [];
  let doorSensors = [];
  let people = makePeople();

  for (let date_str in data) {
    const date_seconds = parseInt(date_str);
    const event_data = data[date_seconds];

    let date = new Date();
    date.setUTCMilliseconds(date_seconds * 1000);

    events.push(makeEvent(event_data));

    if (event_data.guest_id != "n/a" && people.findIndex(g => g.guest_id == event_data.guest_id) < 0) {
      people.push({
        name: event_data.guest_id,
        role: "unknown"
      });
    }

    switch (event_data.device) {
      case "accesss point":
        if (accessPoints.findIndex(ap => ap.device_id == event_data.device_id) < 0) {
          accessPoints.push(makeAccessPoint(event_data));
        }
        break;
      case "door sensor":
        if (doorSensors.findIndex(ds => ds.device_id == event_data.device_id) < 0) {
          doorSensors.push(makeDoorSensor(event_data));
        }
        break;
    }

    Event.create()
  }

  let session = await beginMongooseSession();
  
  Event.deleteMany({}).session(session);
  AccessPoint.deleteMany({}).session(session);
  DoorSensor.deleteMany({}).session(session);

  Event.create(events, {session});
  AccessPoint.create(accessPoints, {session});
  DoorSensor.create(doorSensors, {session});

  await session.commitTransaction();
}

function makePeople() {
  return [
    {
      name: "Veronica",
      role: "guest",
      room: 210
    },
    {
      name: "Jason",
      role: "guest",
      room: 241
    },
    {
      name: "Thomas",
      role: "guest",
      room: 248
    },
    {
      name: "Rob",
      role: "guest",
      room: 231
    },
    {
      name: "Kristina",
      role: "guest",
      room: 235
    },
    {
      name: "Marc-Andre",
      role: "cleaning-staff"
    },
    {
      name: "Dave",
      role: "cooking-staff"
    },
    {
      name: "Salina",
      role: "reception-staff"
    },
    {
      name: "Harrison",
      role: "reception-night-staff"
    }
  ]
}

function makeEvent(event_data) {}

function makeAccessPoint(event_data) {}

function makeDoorSensor(event_data) {}

/**
 * @returns {Promise<mongoose.ClientSession>}
 */
function beginMongooseSession() {
  return new Promise((resolve, reject) => {
    mongoose
      .startSession()
      .then(session => {
        session.startTransaction();
        resolve(session);
      })
      .catch(reject);
  });
}

module.exports = main;