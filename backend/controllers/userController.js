
const User = require("../models/user");
const validator = require("validator");

// Update the logged-in customer's profile.
exports.updateProfile = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const address = typeof req.body.address === "string" ? req.body.address.trim() : "";
    const phoneNumber = typeof req.body.phoneNumber === "string" ? req.body.phoneNumber.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ success: false, message: "Name must be between 2 and 100 characters." });
    }
    if (address.length < 5 || address.length > 200) {
      return res.status(400).json({ success: false, message: "Address must be between 5 and 200 characters." });
    }
    if (!/^\+?[\d\s()-]{7,20}$/.test(phoneNumber)) {
      return res.status(400).json({ success: false, message: "Enter a valid phone number." });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }

    const duplicate = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (duplicate) {
      return res.status(409).json({ success: false, message: "That email address is already in use." });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.isActive === false) {
      return res.status(404).json({ success: false, message: "User account not found." });
    }

    user.name = name;
    user.firstName = name.split(/\s+/)[0];
    user.lastName = name.split(/\s+/).slice(1).join(" ");
    user.address = address;
    user.phoneNumber = phoneNumber;
    user.email = email;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, message: "Unable to update your profile." });
  }
};

// Get all registered users
exports.getAdminUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Activate or deactivate a user
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "A valid account status is required.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Prevent an admin from changing their own account status
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own account status.",
      });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
