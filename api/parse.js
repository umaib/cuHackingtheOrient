const fs = require("fs");

// const G = require("../config/globals");
const Event = require("../model/event");
const Device = require("../model/device");
const Person = require("../model/person");
const RoomSnapshot = require("../model/roomSnapshot");

const DATA_FILE_NAME = "api/martello-data.json";

async function loadFile() {
  return JSON.parse(await fs.readFileSync(DATA_FILE_NAME));
}

function resetCollections() {
  return new Promise((resolve, reject) => {
    Event.deleteMany({}, err => {
      if (err) return reject(err);
      Device.deleteMany({}, err => {
        if (err) return reject(err);
        Person.deleteMany({}, err => {
          if (err) return reject(err);
          RoomSnapshot.deleteMany({}, err => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
    });
  });
}

async function main() {
  await resetCollections();

  let data = await loadFile();

  let devices = [];
  let people = [];

  let knownPeople = makePeople();
  people = people.concat(knownPeople.map(p => p.name));
  await Person.create(knownPeople);
  knownPeople = null;

  for (const date_str in data) {
    const date_seconds = parseInt(date_str);
    const event_data = data[date_str];

    // console.log("================== data\n\n");
    // console.log(event_data);
    // console.log("\n\n================== data");

    let timestamp = new Date(0);
    timestamp.setUTCSeconds(date_seconds);

    let eventDoc = makeEvent(event_data, timestamp);
    if (eventDoc) {
      await Event.create(eventDoc);
    }

    if (event_data["device"] == "door sensor") {
      let update;
      if (
        ["successful keycard unlock", "unlocked no keycard"].includes(
          event_data["event"]
        )
      ) {
        update = {
          $addToSet: { people: event_data["guest-id"] }
        };
      } else {
        update = {
          $pull: { people: event_data["guest-id"] }
        };
      }
      await RoomSnapshot.updateOne(
        {
          room: event_data["device-id"],
          timestamp: timestamp.getTime()
        },
        update,
        { upsert: true }
      );
    }
    if (event_data["device"] == "access point") {
      let update;
      if (["user connected"].includes(event_data["event"])) {
        update = {
          $addToSet: { people: event_data["guest-id"] }
        };
      } else {
        update = {
          $pull: { people: event_data["guest-id"] }
        };
      }
      await RoomSnapshot.updateOne(
        {
          room: event_data["device-id"],
          timestamp: timestamp.getTime()
        },
        update,
        { upsert: true }
      );
    }
    if (event_data["device"] == "motion sensor") {
      await RoomSnapshot.updateOne(
        {
          room: event_data["device-id"],
          timestamp: timestamp.getTime()
        },
        {
          $addToSet: { people: event_data["guest-id"] }
        },
        { upsert: true }
      );
    }
    if (event_data["device"] == "phone") {
      let update;
      if (["off hook"].includes(event_data["event"])) {
        update = {
          $addToSet: { people: event_data["guest-id"] }
        };
      } else {
        update = {
          $pull: { people: event_data["guest-id"] }
        };
      }
      await RoomSnapshot.updateOne(
        {
          room: event_data["device-id"],
          timestamp: timestamp.getTime()
        },
        update,
        { upsert: true }
      );
    }

    if (
      event_data["guest-id"] != "n/a" &&
      !people.includes(event_data["guest-id"])
    ) {
      people.push(event_data["guest-id"]);
      await Person.updateOne(
        {
          name: event_data["guest-id"]
        },
        {
          role: "unknown"
        },
        { upsert: true }
      );
    }

    if (
      !devices.find(
        d =>
          d.deviceId == event_data["device-id"] &&
          d.deviceType == event_data["device"]
      )
    ) {
      await Device.create({
        deviceId: event_data["device-id"],
        deviceType: event_data["device"]
      });
    }
  }

  console.log(devices);
  console.log(people);
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
  ];
}

function makeEvent(event_data, timestamp) {
  let event = {
    deviceId: event_data["device-id"],
    eventId: event_data["event"],
    timestamp,
    guestId: event_data["guest-id"]
  };

  if (event_data.guestId != "n/a") {
    event.guestId = event_data["guest-id"];
  }

  return event;
}

module.exports = main;
