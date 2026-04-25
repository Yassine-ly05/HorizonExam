const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Result = require("../models/Result");
const ExamSession = require("../models/ExamSession");
const DoubleCorrectionRequest = require("../models/DoubleCorrectionRequest");

exports.getDashboardData = async (req, res) => {
  try {
    const adminId = Number(req.params.id);
    if (req.user.id !== adminId) return res.status(403).json({ message: "Forbidden" });
    const admin = await User.findByPk(adminId);
    if (!admin) return res.status(404).json({ message: "Administrator not found" });

    const studentsCount = await User.count({ where: { role: "student" } });
    const teachersCount = await User.count({ where: { role: "teacher" } });
    const adminsCount = await User.count({ where: { role: "admin" } });
    const sessionsCount = await ExamSession.count();

    const pendingGrades = await Result.findAll({
      where: { status: ["Pending", "Validated"] },
      include: [
        { model: User, attributes: ["id", "name", "class"] },
        { model: ExamSession, attributes: ["id", "subject", "exam_type", "exam_date"] },
      ],
      order: [["updatedAt", "DESC"]],
      limit: 20,
    });

    const correctionRequests = await DoubleCorrectionRequest.findAll({
      where: { status: "Pending" },
      include: [
        { model: User, attributes: ["id", "name", "class"] },
        { model: Result, attributes: ["id", "grade", "status"] },
      ],
      order: [["request_date", "ASC"]],
    });

    return res.json({
      admin: { id: admin.id, name: admin.name, email: admin.email },
      summary: {
        studentsCount,
        teachersCount,
        adminsCount,
        sessionsCount,
      },
      pendingGrades: pendingGrades.map((item) => ({
        id: item.id,
        studentName: item.User?.name || "Student",
        studentClass: item.User?.class || "-",
        subject: item.ExamSession?.subject || "-",
        examType: item.ExamSession?.exam_type || "-",
        grade: item.grade,
        status: item.status,
        updatedAt: item.updatedAt,
      })),
      correctionRequests: correctionRequests.map((req) => ({
        id: req.id,
        studentName: req.User?.name || "Student",
        studentClass: req.User?.class || "-",
        grade: req.Result?.grade || "-",
        reason: req.reason,
        status: req.status,
        requestDate: req.request_date,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching admin dashboard data" });
  }
};

exports.validateGrade = async (req, res) => {
  try {
    const result = await Result.findByPk(Number(req.params.id));
    if (!result) return res.status(404).json({ message: "Grade record not found" });
    result.status = "Validated";
    await result.save();
    return res.json({ message: "Grade validated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error validating grade" });
  }
};

exports.publishGrade = async (req, res) => {
  try {
    const result = await Result.findByPk(Number(req.params.id));
    if (!result) return res.status(404).json({ message: "Grade record not found" });
    if (result.status !== "Validated") {
      return res.status(400).json({ message: "Grade must be validated before publication" });
    }
    result.status = "Published";
    await result.save();
    return res.json({ message: "Grade published successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error publishing grade" });
  }
};

exports.processCorrectionRequest = async (req, res) => {
  try {
    const request = await DoubleCorrectionRequest.findByPk(Number(req.params.id));
    if (!request) return res.status(404).json({ message: "Correction request not found" });
    request.status = req.body.decision;
    request.decision_note = req.body.decisionNote || null;
    await request.save();
    return res.json({ message: "Correction request processed", request });
  } catch (error) {
    return res.status(500).json({ message: "Error processing correction request" });
  }
};

exports.getUsers = async (_req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "class", "semester", "createdAt"],
      order: [["createdAt", "DESC"]],
    });
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching users" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const existing = await User.findOne({ where: { email: req.body.email } });
    if (existing) return res.status(400).json({ message: "Email already in use" });
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: passwordHash,
      role: req.body.role,
      class: req.body.class || null,
      semester: req.body.semester || null,
    });
    return res.status(201).json({ message: "User created", user });
  } catch (error) {
    return res.status(500).json({ message: "Error creating user" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    const allowed = ["name", "email", "role", "class", "semester"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });
    if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);
    await user.save();
    return res.json({ message: "User updated", user });
  } catch (error) {
    return res.status(500).json({ message: "Error updating user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await Student.findByPk(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.destroy();
    return res.json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting user" });
  }
};

exports.getSessions = async (_req, res) => {
  try {
    const sessions = await ExamSession.findAll({ order: [["exam_date", "ASC"]] });
    return res.json({ sessions });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching sessions" });
  }
};

exports.createSession = async (req, res) => {
  try {
    const { subject, examType, examDate, teacherId, startTime, endTime, room } = req.body;
    const session = await ExamSession.create({
      subject,
      exam_type: examType,
      exam_date: examDate,
      teacher_id: teacherId,
      start_time: startTime || null,
      end_time: endTime || null,
      room: room || null,
    });
    return res.status(201).json({ message: "Session created", session });
  } catch (error) {
    return res.status(500).json({ message: "Error creating session" });
  }
};
