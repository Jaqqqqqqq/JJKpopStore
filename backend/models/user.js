
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"]
  },
  firstName: {
    type: String,
    trim: true,
    default: ""
  },
  lastName: {
    type: String,
    trim: true,
    default: ""
  },
  address: {
    type: String,
    trim: true,
    required: [true, "Please enter your address"]
  },
  phoneNumber: {
    type: String,
    trim: true,
    required: [true, "Please enter your phone number"]
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },

  isActive: {
  type: Boolean,
  default: true,
},
});

module.exports = mongoose.model("User", userSchema);
