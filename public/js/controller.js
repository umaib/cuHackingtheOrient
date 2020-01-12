// main ctrl
app.controller("mainCtrl", function($scope, $rootScope, $http) {
  let context = ($scope.context = {
    timestamp: null,
    room: "",
    person: "",
    refresh: () => {
      return new Promise((resolve, reject) => {});
    }
  });

  let search = ($scope.search = {
    query: "",
    search: () => {}
  });

  let people = ($scope.people = {
    NO_PEOPLE: "< none >",
    guestNames: "",
    staffNames: "",
    unknownNames: "",
    refresh: () => {
      return new Promise((resolve, reject) => {
        doAggregate("events", [
          {$match: {
            deviceId: context.room,
            eventId: {$in: ["successful keycard unlock", "unlocked no keycard"]},
            timestamp: {$lte: context.timestamp}
          }},
          {}
        ], (err, events) => {})
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
});
