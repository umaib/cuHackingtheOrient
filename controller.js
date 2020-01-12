// main ctrl
app.controller("mainCtrl", function($scope, $rootScope, $http, $interval) {
  let context = ($scope.context = {
    timestamp: null,
    room: null,
    person: null,
    timeInHtml: null,
    time: "",
    delayTask: null,
    switch: (timestamp, room, person, delay = 0) => {
      $interval.cancel(context.delayTask);
      context.delayTask = $interval(() => {
        console.log("got context switch request");
        context.timestamp = timestamp || context.timestamp;
        context.room = room ? room.toString() : context.room;
        context.person = person || context.person;
        Promise.all([people.refresh(), activity.refresh(), timebar.refresh()])
          .then(() => {
            console.log("Context switched", context.timestamp, activity.log);
            search.visible = false;
            let time = dateToTime(context.timestamp);
            context.time = `${time.hours}:${time.minutes}:${time.seconds}`
            $scope.$apply();
          })
          .catch(err => console.error(err));
      }, delay, 1);
    },
    refresh: () => {
      return new Promise((resolve, reject) => {
        doQuery(
          "events",
          "find",
          { guestId: { $exists: true } },
          null,
          null,
          { timestamp: 1 },
          1
        )
          .then(([event]) => {
            if (!event) return reject("no events");
            context.timestamp = event.timestamp;
            if (
              [
                "successful keycard unlock",
                "unlocked no keycard",
                "door closed"
              ].includes(event.eventId)
            ) {
              context.room = event.deviceId;
            } else context.room = null;
            context.person = event.guestId;
            resolve();
          })
          .catch(reject);
      });
    }
  });
  

  let search = ($scope.search = {
    query: "",
    visible: false,
    changeTask: null,
    error: false,
    result: [],
    close: () => (search.visible = false),
    onChange: () => {
      $interval.cancel(search.changeTask);
      if (search.query != "") {
        search.changeTask = $interval(search.search, 500, 1);
      }
    },
    search: () => {
      if (search.query == "") return;
      search.error = false;
      search.result = [];
      console.log("Searching...");
      let regex = `[a-z]*${regexEscape(search.query.trim())}[a-z]*`;
      doQuery(
        "events",
        "find",
        {
          $or: [
            { deviceId: { $regex: regex, $options: "i" } },
            { eventId: { $regex: regex, $options: "i" } },
            { guestId: { $regex: regex, $options: "i" } }
          ]
        },
        null,
        null,
        { timestamp: 1 },
        50
      )
        .then(events => {
          search.result = events.map(ev => {
            let time = dateToTime(new Date(ev.timestamp));
            return {
              ...ev,
              formattedTimestamp: `${time.simpleHours}:${time.minutes}:${
                time.seconds
              } ${time.isAm ? "AM" : "PM"}`
            };
          });
          search.visible = true;
          $scope.$apply();
        })
        .catch(err => {
          search.error = true;
          console.error(err);
        });
    }
  });

  let people = ($scope.people = {
    NO_PEOPLE: "<none>",
    guestNames: "",
    staffNames: "",
    unknownNames: "",
    refresh: () => {
      return new Promise((resolve, reject) => {
        doQuery(
          "roomSnapshots",
          "find",
          {
            room: context.room,
            timestamp: context.timestamp
          },
          { people: 1 }
        )
          .then(snapshots => {
            doQuery(
              "people",
              "find",
              {
                name: {
                  $in: snapshots.reduce(
                    (acc, cur) => (acc = acc.concat(cur.people)),
                    []
                  )
                }
              },
              { room: 0 }
            )
              .then(_people => {
                let guests = [];
                let staff = [];
                let unknowns = [];
                _people.forEach(person => {
                  if (person.role == "guest") {
                    guests.push(person.name);
                  } else if (person.role.endsWith("staff")) {
                    staff.push(person.name);
                  } else {
                    unknowns.push(person.name);
                  }
                });
                people.guestNames =
                  guests.length == 0 ? people.NO_PEOPLE : guests.join(", ");
                people.staffNames =
                  staff.length == 0 ? people.NO_PEOPLE : staff.join(", ");
                people.unknownNames =
                  unknowns.length == 0 ? people.NO_PEOPLE : unknowns.join(", ");
                resolve();
              })
              .catch(reject);
          })
          .catch(reject);
      });
    }
  });

  let activity = ($scope.activity = {
    log: [],
    refresh: () => {
      return new Promise((resolve, reject) => {
        doQuery(
          "events",
          "find",
          { deviceId: context.room, timestamp: context.timestamp },
          { eventId: 1, guestId: 1 },
          null,
          { timestamp: 1 }
        )
          .then(events => {
            activity.log = events;
            resolve();
          })
          .catch(reject);
      });
    }
  });

  let timebar = ($scope.timebar = {
    options: [],
    refresh: () => {
      return new Promise((resolve, reject) => {
        doQuery("events", "find", null, {timestamp: 1}, null, {timestamp:1})
        .then(events => {
          timebar.options = events.map(ev => ev.timestamp);
          $scope.$apply();
        })
        .catch(reject);
      });
    }
  });

  context
    .refresh()
    .then(() => {
      Promise.all([people.refresh(), activity.refresh(), timebar.refresh()])
        .then(() => console.log("View loaded"))
        .catch(err => console.error(err));
    })
    .catch(err => console.error(err));

  function doQuery(col, fn, query, projection, options, sort, limit) {
    return new Promise((resolve, reject) =>
      $http
        .post(`http://localhost:8080/api/query/${col}`, {
          fn,
          query,
          projection,
          options,
          sort,
          limit
        })
        .then(({ data }) => resolve(data))
        .catch(reject)
    );
  }
  function doAggregate(col, stages) {
    return new Promise((resolve, reject) =>
      $http
        .post(`http://localhost:8080/api/aggregate/${col}`, {
          stages
        })
        .then(({ data }) => resolve(data))
        .catch(reject)
    );
  }
  function dateToTime(date) {
    let pad = (num, size) => ("000" + num).slice(size * -1);
    let hours = date.getHours();
    return {
      hours: pad(hours, 2),
      minutes: pad(date.getMinutes(), 2),
      seconds: pad(date.getSeconds(), 2),
      ms: pad(date.getMilliseconds(), 3),
      simpleHours: hours % 12,
      isAm: !(hours > 12 || hours == 0)
    };
  }
  /**
   * Escapes all special RegExp characters from the string
   * @param {string} s
   */
  function regexEscape(s) {
    if (!RegExp.escape) {
      RegExp.escape = s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    }
    return RegExp.escape(s);
  }
});
