const express = require("express");
const app = express();

const PORT = 8080;

app.get("/", function (req, res) {
  res.send("Hello World");
});

app.get("/data", function (req, res) {
  res.json({ foo: "bar" });
});

// below path not working, returns undefined
app.use(express.urlencoded({ extended: true }));

app.post("/foo", function (req, res) {
  let body = req.body;
  console.log(body.foo);
  res.send(body.foo);
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
