const express = require('express');
const { GetCoustomer, createCoustomer, UpdateCoustomer, DeleteCoustomer, GetCoustomerById } = require('../controllers/coustomer.controllers');
const auth = require('../middlewares/auth');
const coustomerRouter = express.Router();

coustomerRouter.get('/coustomer',auth,GetCoustomer);
coustomerRouter.get("/coustomer/:id", auth, GetCoustomerById);
coustomerRouter.post("/coustomer", auth, createCoustomer);
coustomerRouter.patch("/coustomer/:id", auth, UpdateCoustomer);
coustomerRouter.delete("/coustomer/:id", auth, DeleteCoustomer);

module.exports = coustomerRouter;