import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(userId) {
  return jwt.sign({}, process.env.JSON_SECRET, {
    subject: userId,
    expiresIn: "7d",
  });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

router.post("/signup", async (req, res, next) => {
  const { name, dateOfBirth, email, password } = req.body ?? {};

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 80
  ) {
    return res
      .status(400)
      .json({ message: "Full name must be between 2 and 80 characters." });
  }

  if (
    typeof dateOfBirth !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
    Number.isNaN(Date.parse(`${dateOfBirth}T00:00:00.000Z`)) ||
    new Date(`${dateOfBirth}T00:00:00.000Z`).toISOString().slice(0, 10) !==
      dateOfBirth ||
    dateOfBirth > new Date().toISOString().slice(0, 10)
  ) {
    return res.status(400).json({ message: "Enter a valid date of birth." });
  }

  if (
    typeof email !== "string" ||
    email.trim().length > 254 ||
    !emailPattern.test(email.trim())
  ) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return res
      .status(400)
      .json({ message: "Password must be between 8 and 128 characters." });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.exists({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      dateOfBirth: new Date(`${dateOfBirth}T00:00:00.000Z`),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
    });

    return res.status(201).json({
      token: createToken(user.id),
      user: publicUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    !emailPattern.test(email.trim()) ||
    typeof password !== "string" ||
    password.length === 0 ||
    password.length > 128
  ) {
    return res.status(400).json({ message: "Enter a valid email and password." });
  }

  try {
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash");

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    return res.json({
      token: createToken(user.id),
      user: publicUser(user),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
