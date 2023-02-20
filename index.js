const express = require("express");
const router = require("./Router.js/routes");
const coustomerRouter = require("./Router.js/coustomeRoutes");
const cors = require('cors');
const connect = require("./Db");
require("dotenv").config();
const app = express();
app.use(express.json());
app.use(cors());
app.get('/', (req, res) => {
  res.send("Gold Finance App Server is Live")
})

app.use("/", router);
app.use("/",coustomerRouter);

const port = process.env.PORT || 5000;
  connect()
  .then(() => {
    console.log(listening)
  })
  .catch((err) => {
    console.log(err);
  });
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
  