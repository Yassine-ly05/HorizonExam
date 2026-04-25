const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "horizonexam-dev-secret";

exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log("Login attempt:", { email, role });
    const user = await User.findOne({ where: { email, role } });
    if (!user) {
      console.log("User not found for:", { email, role });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatches = user.password.startsWith("$2")
      ? await bcrypt.compare(password, user.password)
      : user.password === password;

    if (!passwordMatches) {
      console.log("Password mismatch for:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
      expiresIn: "8h",
    });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, class: user.class },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "role", "class", "semester"],
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};
