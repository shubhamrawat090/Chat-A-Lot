const express = require("express");
const { registerUser, authUser } = require("../controllers/userControllers");

const router = express.Router();

// Different ways to writing routes
router.route("/").post(registerUser); // Here you can chain multiple routes like .post().get()
router.post("/login", authUser); // Here chaining is NOT POSSIBLE

module.exports = router;
