const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const { validationResult } = require('express-validator');
const { logActivity } = require('../utils/audit');

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map(e => e.msg).join(', ') });
    }

    const { fullName, email, password } = req.body;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { fullName, email, password: hashedPassword },
    });

    await logActivity(user.id, 'Register', 'User registered a new account');

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    await logActivity(user.id, 'Login', 'User successfully logged in');

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res) => {
  if (req.user) {
    await logActivity(req.user.id, 'Logout', 'User logged out');
  }
  res.json({ message: 'Logged out successfully' });
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
