const express = require("express");
const router = require("./Router.js/routes");
const mongoose = require("mongoose");
const coustomerRouter = require("./Router.js/coustomeRoutes");
const cors = require('cors')
require("dotenv").config();
const app = express();
app.use(express.json());
app.use(cors());

app.use("/", router);
app.use("/",coustomerRouter);

const port = process.env.PORT || 5000;
mongoose.set("strictQuery", true);
mongoose
  .connect(process.env.DATA_URL)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
