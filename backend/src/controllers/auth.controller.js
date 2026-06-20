const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const { validationResult } = require('express-validator');
const { logActivity } = require('../utils/audit');

exports.register = async (req, res, next) => {
  try {
    console.log("=================================");
    console.log("REGISTER REQUEST RECEIVED");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Headers:", req.headers);
    console.log("IP Address:", req.ip);
    console.log("Request Body (sanitized):", {
      fullName: req.body.fullName,
      email: req.body.email,
      password: req.body.password ? '[PROVIDED]' : '[MISSING]'
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMsg = errors.array().map(e => e.msg).join(', ');
      console.warn("REGISTER VALIDATION FAILED:", errorMsg);
      return res.status(400).json({ message: errorMsg });
    }

    const { fullName, email, password } = req.body;
    console.log("Checking if user already exists for Email:", email);
    
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({ where: { email } });
    } catch (dbError) {
      console.error("REGISTER DATABASE CONNECTION/QUERY ERROR:", dbError);
      throw dbError;
    }

    if (existingUser) {
      console.log("REGISTER FAILED: Email already exists:", email);
      return res.status(400).json({ message: 'Email already exists' });
    }

    console.log("Hashing password...");
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (bcryptError) {
      console.error("REGISTER PASSWORD HASH ERROR:", bcryptError);
      throw bcryptError;
    }

    console.log("Creating new user record...");
    let user;
    try {
      user = await prisma.user.create({
        data: { fullName, email, password: hashedPassword },
      });
    } catch (dbError) {
      console.error("REGISTER DATABASE INSERT ERROR:", dbError);
      throw dbError;
    }

    console.log("User successfully created. ID:", user.id);

    try {
      await logActivity(user.id, 'Register', 'User registered a new account');
    } catch (auditError) {
      console.error("REGISTER AUDIT LOGGING ERROR (non-blocking):", auditError);
    }

    console.log("Generating JWT Token...");
    let token;
    try {
      token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    } catch (jwtError) {
      console.error("REGISTER JWT GENERATION ERROR:", jwtError);
      throw jwtError;
    }

    console.log("REGISTER SUCCESS");
    res.status(201).json({ token, user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch (error) {
    console.error("REGISTER PROCESS EXCEPTION:", error);
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    console.log("=================================");
    console.log("LOGIN REQUEST RECEIVED");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Headers:", req.headers);
    console.log("IP Address:", req.ip);
    console.log("Request Body:", {
      email: req.body.email,
      password: req.body.password ? '[PROVIDED]' : '[MISSING]'
    });

    const { email, password } = req.body;
    console.log("Searching user for Email:", email);

    let user;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (dbError) {
      console.error("LOGIN DATABASE CONNECTION/QUERY ERROR:", dbError);
      throw dbError;
    }

    console.log("User Found in Database:", !!user);

    if (!user) {
      console.log("LOGIN FAILED: User not found for email:", email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log("Comparing passwords via bcrypt...");
    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error("LOGIN PASSWORD COMPARISON ERROR:", bcryptError);
      throw bcryptError;
    }

    console.log("Password verification match result:", isMatch);

    if (!isMatch) {
      console.log("LOGIN FAILED: Password mismatch for email:", email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    try {
      await logActivity(user.id, 'Login', 'User successfully logged in');
    } catch (auditError) {
      console.error("LOGIN AUDIT LOGGING ERROR (non-blocking):", auditError);
    }

    console.log("Generating JWT Token...");
    let token;
    try {
      token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    } catch (jwtError) {
      console.error("LOGIN JWT GENERATION ERROR:", jwtError);
      throw jwtError;
    }

    console.log("LOGIN SUCCESS for User ID:", user.id);
    res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch (error) {
    console.error("LOGIN PROCESS EXCEPTION:", error);
    next(error);
  }
};

exports.logout = async (req, res) => {
  try {
    console.log("=================================");
    console.log("LOGOUT REQUEST RECEIVED");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Headers:", req.headers);
    console.log("IP Address:", req.ip);

    if (req.user) {
      console.log("Logging out User ID:", req.user.id);
      try {
        await logActivity(req.user.id, 'Logout', 'User logged out');
      } catch (auditError) {
        console.error("LOGOUT AUDIT LOGGING ERROR (non-blocking):", auditError);
      }
    } else {
      console.log("LOGOUT: No active session / anonymous request");
    }

    console.log("LOGOUT SUCCESS");
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error("LOGOUT PROCESS EXCEPTION:", error);
    res.status(500).json({ message: 'Internal Server Error during logout' });
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(logs);
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;
    const userId = req.user.id;

    // Check if email already in use by another user
    if (email) {
      const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } }
      });
      if (existing) {
        return res.status(400).json({ message: 'Email is already in use by another user' });
      }
    }

    const dataToUpdate = {};
    if (fullName) dataToUpdate.fullName = fullName;
    if (email) dataToUpdate.email = email;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    });

    await logActivity(userId, 'Update Profile', 'User updated profile information');

    res.json({
      message: 'Profile updated successfully',
      user: { id: updatedUser.id, fullName: updatedUser.fullName, email: updatedUser.email }
    });
  } catch (error) {
    next(error);
  }
};
