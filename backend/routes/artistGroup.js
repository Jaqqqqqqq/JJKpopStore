const express = require("express");
const artistGroupController = require("../controllers/artistGroupController");
const protect = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

router.get("/admin/artists", protect, adminOnly, artistGroupController.getArtistGroups);
router.post("/admin/artists", protect, adminOnly, artistGroupController.createArtistGroup);
router.put("/admin/artists/:id", protect, adminOnly, artistGroupController.updateArtistGroup);
router.delete("/admin/artists/:id", protect, adminOnly, artistGroupController.deleteArtistGroup);

module.exports = router;
