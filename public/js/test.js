// test ctrl
app.controller("testCtrl", function($scope, $rootScope, $http) {
  let events = ($scope.events = {
    deviceId: "",
    eventId: "",
    guestId: "",
    result: null,
    error: null,
    search: () => {
      let query = {};
      if (events.deviceId) query.deviceId = events.deviceId;
      if (events.eventId) query.eventId = events.eventId;
      if (events.guestId) query.guestId = events.guestId;
      events.result = null;
      events.error = null;
      $http
        .post("http://localhost:8080/api/query/events", {
          fn: "find",
          query,
          projection: {
            _id: 0
          },
          sort: {
            timestamp: 1
          }
        })
        .then(
          ({ data }) =>
            (events.result = data.map(ev => {
              return `${ev.deviceId}    |    ${ev.eventId}    |    ${
                ev.guestId
              }    |    ${new Date(ev.timestamp).toTimeString()}`;
            }))
        )
        .catch(err => (events.error = err));
    }
  });
});
