const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontrollers');
const auth = require('../middlewares/middleware')

router.post('/signup', authController.signup);
router.post('/login', authController.login);

module.exports = router;
