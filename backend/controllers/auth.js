
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const crypto = require("crypto");
const validator = require("validator");
const sendEmail = require("../utils/sendEmail");

function createAppToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "jj-kpop-development-secret-change-before-deploy",
    { expiresIn: "1d" }
  );
}

function getFirebaseAuth() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Firebase Admin credentials are not configured.");
    }
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }
  return getAuth();
}

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

    const token = createAppToken(user);

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

exports.forgotPassword = async (req, res) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }

    const user = await User.findOne({ email }).select("+password");
    // Keep the response identical whether or not this email belongs to an account.
    if (!user || !user.password || user.isActive === false) {
      return res.status(200).json({ success: true, message: "If an account exists for that email, a password reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const resetUrl = `${frontendUrl}/reset-password/${token}`;
    const html = `
      <div style="margin:0;padding:32px 12px;background:#fff6fa;font-family:Arial,Helvetica,sans-serif;color:#352536">
        <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #f0dce5;border-radius:16px;overflow:hidden">
          <div style="padding:24px 30px;background:#321d32;border-bottom:5px solid #ed5791;color:#fff;font-size:21px;font-weight:800">J&amp;J <span style="color:#ff79ad">K-POP</span> &#9825;</div>
          <div style="padding:30px"><p style="margin:0 0 8px;color:#786879">Hello ${String(user.name || "Customer").replace(/[&<>\"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))},</p>
            <h1 style="margin:0 0 12px;font-size:24px">Reset your password</h1>
            <p style="color:#786879;line-height:1.6">Click below to choose a new password for your J&amp;J K-POP account. This link expires in one hour and can only be used once.</p>
            <p style="margin:26px 0"><a href="${resetUrl}" style="display:inline-block;padding:14px 22px;border-radius:24px;background:#ed5791;color:#fff;text-decoration:none;font-weight:700">Change password</a></p>
            <p style="color:#786879;font-size:12px;line-height:1.6">If you did not request a password reset, you can ignore this email.</p>
          </div><div style="padding:16px;text-align:center;background:#321d32;color:#e8d9e4;font-size:11px">J&amp;J K-POP Store</div>
        </div>
      </div>`;

    try {
      await sendEmail({ email: user.email, subject: "Reset your J&J K-POP password", html });
    } catch (emailError) {
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpiresAt = undefined;
      await user.save();
      throw emailError;
    }

    return res.status(200).json({ success: true, message: "If an account exists for that email, a password reset link has been sent." });
  } catch (error) {
    console.error("Password reset email failed:", error.message);
    return res.status(503).json({ success: false, message: "Unable to send a password reset email. Check the SMTP settings and try again." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (typeof token !== "string" || !token || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ success: false, message: "Enter a password with at least 6 characters." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select("+passwordResetTokenHash +passwordResetExpiresAt +password");

    if (!user) {
      return res.status(400).json({ success: false, message: "This password reset link is invalid or has expired. Request a new link." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    return res.status(200).json({ success: true, message: "Password changed successfully. You can now log in." });
  } catch (error) {
    console.error("Password reset failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to change password." });
  }
};

// Verify a Firebase Google ID token and issue the store's normal JWT.
exports.googleLogin = async (req, res) => {
  try {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      return res.status(503).json({
        success: false,
        message: "Firebase Admin settings are missing from backend/.env. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY, then restart the backend.",
      });
    }

    const { idToken } = req.body;
    if (typeof idToken !== "string" || !idToken) {
      return res.status(400).json({ success: false, message: "A Google sign-in token is required." });
    }

    let googleUser;
    try {
      googleUser = await getFirebaseAuth().verifyIdToken(idToken);
    } catch (verificationError) {
      console.error("Firebase ID token verification failed:", verificationError.code || "unknown", verificationError.message);
      const projectMismatch = /incorrect [\"']?(aud|iss)|project id|project-id/i.test(verificationError.message || "");
      return res.status(401).json({
        success: false,
        message: projectMismatch
          ? "Google token belongs to a different Firebase project. Match VITE_FIREBASE_PROJECT_ID and FIREBASE_PROJECT_ID, then restart both apps."
          : "Firebase rejected the Google token. Check the backend service-account key and restart the backend.",
      });
    }

    const email = String(googleUser.email || "").trim().toLowerCase();
    if (!email || googleUser.email_verified !== true || !googleUser.uid) {
      return res.status(401).json({ success: false, message: "Use a verified Google email address." });
    }

    let user = await User.findOne({ email });
    if (user) {
      if (user.googleId && user.googleId !== googleUser.uid) {
        return res.status(409).json({ success: false, message: "This email is linked to a different Google account." });
      }
      if (user.isActive === false) {
        return res.status(403).json({ success: false, message: "Your account has been deactivated. Please contact the administrator." });
      }
      if (!user.googleId) {
        user.googleId = googleUser.uid;
        await user.save();
      }
    } else {
      const displayName = String(googleUser.name || email.split("@")[0]).trim();
      const nameParts = displayName.split(/\s+/);
      user = await User.create({
        name: displayName,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" "),
        email,
        googleId: googleUser.uid,
        address: "",
        phoneNumber: "",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      token: createAppToken(user),
      user: {
        id: user._id,
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
    console.error("Google login error:", error.message);
    const notConfigured = error.message === "Firebase Admin credentials are not configured.";
    return res.status(notConfigured ? 503 : 500).json({
      success: false,
      message: notConfigured
        ? "Google sign-in is not configured on the server yet."
        : "Unable to sign in with Google.",
    });
  }
};


