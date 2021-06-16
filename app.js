const express = require("express");
const {
  send404,
  handlingServerErrors,
  handlingPSQLErrors,
  handlingCustomErrors,
} = require("./errors");
const apiRouter = require("./routes/api-router");

const app = express();

app.use(express.json());

app.use("/api", apiRouter);

app.use(send404);

app.use(handlingCustomErrors);
app.use(handlingPSQLErrors);
app.use(handlingServerErrors);

module.exports = app;