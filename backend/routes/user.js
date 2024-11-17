const express = require("express");
const router = express.Router();

// controller functions
const { signupUser, loginUser, pingServer } = require("../controllers/userController");

// ping route
router.get("/ping", pingServer);

// login route
router.post("/login", loginUser);

// signup route
router.post("/signup", signupUser);

module.exports = router;

module.exports = router;
