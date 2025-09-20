const router = require("express").Router();
const upload = require("../config/upload");
const { AdminRegister } = require("../controllers/AdminController");

router.post("/register", upload.single("profilePic"), AdminRegister);

module.exports = router;