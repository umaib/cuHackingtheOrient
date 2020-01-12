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
      context.delayTask = $interval(
        () => {
          console.log("got context switch request");
          context.timestamp = timestamp || context.timestamp;
          context.room = room ? room.toString() : context.room;
          context.person = person || context.person;
          Promise.all([people.refresh(), activity.refresh()])
            .then(() => {
              timebar.value = timebar.frames.findIndex(t => t == timestamp);

              console.log("Context switched", context.timestamp, activity.log);
              search.visible = false;
              let date = new Date(0);
              date.setUTCMilliseconds(context.timestamp);
              let time = dateToTime(date);
              context.time = `${time.simpleHours}:${time.minutes}:${
                time.seconds
              } ${time.isAm ? "AM" : "PM"} ${DAYS_OF_WEEK[date.getDay()]}`;
              console.log(context.time);
              $scope.$apply();
            })
            .catch(err => console.error(err));
        },
        delay,
        1
      );
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
    close: () => {
      search.visible = false;
      search.query = "";
    },
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
            let date = new Date(ev.timestamp);
            let time = dateToTime(date);
            return {
              ...ev,
              formattedTimestamp: `${time.simpleHours}:${time.minutes}:${
                time.seconds
              } ${time.isAm ? "AM" : "PM"} ${DAYS_OF_WEEK[date.getDay()]}`
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
    NO_PEOPLE: "",
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
        let q = {};
        if (context.room) q.deviceId = context.room;
        if (context.timestamp) q.timestamp = context.timestamp;
        doQuery(
          "events",
          "find",
          q,
          { deviceId: 1, eventId: 1, guestId: 1 },
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
    value: 0,
    frames: [],
    playTask: null,
    listener: v => {
      context.switch(timebar.frames[v], null, null, 0);
    },
    refresh: v => {
      return new Promise((resolve, reject) => {
        $interval.cancel(timebar.playTask);
        doQuery("events", "find", null, { timestamp: 1 }, null, {
          timestamp: 1
        })
          .then(events => {
            timebar.frames = events.map(ev => ev.timestamp);
            timebar.frames.unshift(1578193200000);
            timebar.value = v || timebar.frames[0];
            // timebar.playTask = $interval(() => {
            //   if (timebar.value >= timebar.frames.length -1) {
            //     timebar.value = 0;
            //   } else timebar.value++;
            //   timebar.listener(timebar.value);
            // }, 200);
            $scope.$apply();
            resolve();
          })
          .catch(reject);
      });
    }
  });

  timeListener = timebar.listener;

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
  const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
});

var timeListener = () => {};
