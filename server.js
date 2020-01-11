const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const mongoose = require("mongoose");

const G = require("./config/globals");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use("/angular", express.static("./angular"));
app.use("/css", express.static("./css"));
app.use("/html", express.static("./html"));
app.use("/model", express.static("./model"));
app.use("/modules", express.static("./node_modules"));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true
  })
);

app.use("/api", require("./api/api"));

app.route("/*").get((req, res) => {
  var path = req.path.substr(1);
  if (path.includes("/")) {
    path = path.substr(0, path.indexOf("/"));
  }
  fs.exists("./html/app.client.stage." + path + ".html", exists => {
    if (exists) {
      res.sendFile("app.client.router.html", {
        root: "./html"
      });
    } else {
      res.sendFile("app.client.landing.html", { root: "./html" });
    }
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  try {
    G.errorResponse(err.status || 500, err.message, err.stack.split("\n"), res);
  } catch (error) {
    G.errorResponse(err.status || 500, err.message, err, res);
  }
});

// --------------------------------------------------

// ensure database connection is established before handling requests
mongoose.set("useFindAndModify", false);
mongoose
  .connect("mongodb+srv://user:userpassword@cluster0-ueovv.azure.mongodb.net/test?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to MongoDB database");
    console.log("Starting server...");
    app.listen(8080, () => {
      console.log("Binder server launched on port 8080");
    });
  })
  .catch(err => console.error("[Fatal] Failed to connect to database", err));
