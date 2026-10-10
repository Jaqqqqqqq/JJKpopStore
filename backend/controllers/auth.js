
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { name, firstName, lastName, address, phoneNumber, email, password } = req.body;
    const fullName = `${firstName || ""} ${lastName || ""}`.trim() || name?.trim();

    if (!fullName || !address || !phoneNumber || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide first name, last name, address, phone number, email, and password"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: fullName,
      firstName: firstName?.trim() || fullName.split(" ")[0],
      lastName: lastName?.trim() || fullName.split(" ").slice(1).join(" "),
      address: address.trim(),
      phoneNumber: phoneNumber.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to register user"
    });
  }
};

// Log in a user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password +role");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (user.isActive === false) {
  return res.status(403).json({
    success: false,
    message: "Your account has been deactivated. Please contact the administrator.",
  });
}

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "jj-kpop-development-secret-change-before-deploy",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to log in"
    });
  }
};


