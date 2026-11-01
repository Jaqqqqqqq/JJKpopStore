const mongoose = require("mongoose");

const artistGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 80,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ArtistGroup", artistGroupSchema, "artists");
