// main ctrl
app.controller("mainCtrl", function($scope, $rootScope, $http) {
  let context = ($scope.context = {
    timestamp: null,
    room: null,
    person: null,
    switch: (timestamp, room, person) => {
      console.log("got context switch request");
      context.timestamp = timestamp || context.timestamp;
      context.room = room.toString() || context.room;
      context.person = person || context.person;
      Promise.all([people.refresh(), activity.refresh(), timebar.refresh()])
        .then(() => {
          console.log("Context switched", context.timestamp, activity.log);
          search.visible = false;
          $scope.$apply();
        })
        .catch(err => console.error(err));
    },
    refresh: () => {
      return new Promise((resolve, reject) => {});
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
      let regexes = [];
      search.query
        .trim()
        .split(" ")
        .forEach(q =>
          regexes.push(new RegExp(`[a-z]*${regexEscape(q)}[a-z]*`, "i"))
        );
      doQuery(
        "events",
        "find",
        {
          $or: [
            { deviceId: { $in: regexes } },
            { eventId: { $in: regexes } },
            { guestId: { $in: regexes } }
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
    NO_PEOPLE: "< none >",
    guestNames: "",
    staffNames: "",
    unknownNames: "",
    refresh: () => {
      return new Promise((resolve, reject) => {
        doAggregate(
          "events",
          [
            {
              $match: {
                deviceId: context.room,
                eventId: {
                  $in: ["successful keycard unlock", "unlocked no keycard"]
                },
                timestamp: { $lte: context.timestamp }
              }
            },
            {}
          ],
          (err, events) => {}
        );
        doQuery("people", "find", {
          deviceId: context.room
        });
      });
    }
  });

  let activity = ($scope.activity = {
    log: [],
    refresh: () => {
      return new Promise((resolve, reject) => {});
    }
  });

  let timebar = ($scope.timebar = {
    refresh: () => {
      return new Promise((resolve, reject) => {});
    }
  });

  Promise.all([
    context.refresh(),
    people.refresh(),
    activity.refresh(),
    timebar()
  ])
    .then(() => {})
    .catch(err => {
      console.error(err);
      alert(err);
    });

  function doQuery(col, fn, query, projection, options, callback, sort) {
    $http
      .post(`http://localhost:8080/api/query/${col}`, {
        fn,
        query,
        projection,
        options,
        sort
      })
      .then(({ data }) => callback(false, data))
      .catch(err => callback(err));
  }
  function doAggregate(col, stages, callback) {
    $http
      .post(`http://localhost:8080/api/aggregate/${col}`, {
        stages
      })
      .then(({ data }) => callback(false, data))
      .catch(err => callback(err));
  }
  const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
});
