const express = require("express");
const app = express();

const PORT = 8080;

app.get("/", function (req, res) {
  res.send("Hello World");
});

app.get("/data", function (req, res) {
  res.json({ foo: "bar" });
});

app.get("/rolling", function (req, res) {
  res.send("rolling update");
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
