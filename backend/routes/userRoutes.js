const express = require("express");
const {
  registerUser,
  authUser,
  allUsers,
} = require("../controllers/userControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Different ways to writing routes
router.route("/").post(registerUser).get(protect, allUsers); // Here you can chain multiple routes like .post().get()
router.post("/login", authUser); // Here chaining is NOT POSSIBLE

module.exports = router;
