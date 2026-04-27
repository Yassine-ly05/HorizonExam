const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const User = require("../models/User");
const Result = require("../models/Result");
const Attendance = require("../models/Attendance");
const ExamSession = require("../models/ExamSession");
const DoubleCorrectionRequest = require("../models/DoubleCorrectionRequest");
const ExamReport = require("../models/ExamReport");
const EliminationRequest = require("../models/EliminationRequest");
const ClassGroup = require("../models/ClassGroup");
const Subject = require("../models/Subject");
const Room = require("../models/Room");

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
    const pendingCount = await Result.count({ where: { status: "Pending" } });
    const validatedCount = await Result.count({ where: { status: "Validated" } });
    const publishedCount = await Result.count({ where: { status: "Published" } });

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
        { model: Result, attributes: ["id", "grade", "status"], include: [{ model: ExamSession, attributes: ["subject"] }] },
      ],
      order: [["request_date", "ASC"]],
    });

    const eliminationRequests = await EliminationRequest.findAll({
      where: { status: "Pending" },
      include: [
        { model: User, as: "Student", attributes: ["id", "name", "class"] },
        { model: User, as: "Teacher", attributes: ["id", "name", "email"] },
        { model: ExamSession, attributes: ["id", "subject", "exam_type", "exam_date"] },
      ],
      order: [["request_date", "ASC"]],
      limit: 20,
    });

    return res.json({
      admin: { id: admin.id, name: admin.name, email: admin.email },
      summary: {
        studentsCount,
        teachersCount,
        adminsCount,
        sessionsCount,
        pendingCount,
        validatedCount,
        publishedCount,
      },
      pendingGrades: pendingGrades.map((item) => ({
        id: item.id,
        studentName: item.User?.name || "Student",
        studentClass: item.User?.class || "-",
        subject: item.ExamSession?.subject || "-",
        examType: item.ExamSession?.exam_type || "-",
        examDate: item.ExamSession?.exam_date || "-",
        grade: item.grade,
        status: item.status,
        updatedAt: item.updatedAt,
      })),
      correctionRequests: correctionRequests.map((req) => ({
        id: req.id,
        studentName: req.User?.name || "Student",
        studentClass: req.User?.class || "-",
        subject: req.Result?.ExamSession?.subject || "-",
        grade: req.Result?.grade || "-",
        reason: req.reason,
        status: req.status,
        requestDate: req.request_date,
      })),
      eliminationRequests: eliminationRequests.map((item) => ({
        id: item.id,
        studentName: item.Student?.name || "Student",
        studentClass: item.Student?.class || "-",
        teacherName: item.Teacher?.name || "Teacher",
        subject: item.ExamSession?.subject || "-",
        examType: item.ExamSession?.exam_type || "-",
        examDate: item.ExamSession?.exam_date || "-",
        reason: item.reason,
        status: item.status,
        requestDate: item.request_date,
      })),
      governance: {
        workflow:
          "Teachers submit grades. Administration validates and publishes. Students can request double correction after publication.",
      },
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
    const decision = req.body.decision === "Approved" ? "Accepted" : req.body.decision;
    request.status = decision;
    request.decision_note = req.body.decisionNote || null;
    await request.save();
    return res.json({ message: "Correction request processed", request });
  } catch (error) {
    return res.status(500).json({ message: "Error processing correction request" });
  }
};

exports.processEliminationRequest = async (req, res) => {
  try {
    const request = await EliminationRequest.findByPk(Number(req.params.id));
    if (!request) return res.status(404).json({ message: "Elimination request not found" });
    const decision = req.body.decision === "Approved" ? "Accepted" : req.body.decision;
    request.status = decision;
    request.decision_note = req.body.decisionNote || null;
    await request.save();
    return res.json({ message: "Elimination request processed", request });
  } catch (_error) {
    return res.status(500).json({ message: "Error processing elimination request" });
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
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    if (req.body.role === "student") {
      const className = String(req.body.class || "").trim();
      if (!className) return res.status(400).json({ message: "Student class is required" });
      const classExists = await ClassGroup.findOne({ where: { name: className } });
      if (!classExists) return res.status(400).json({ message: "Class does not exist" });
    }

    if (req.body.role === "teacher") {
      const subjectName = String(req.body.class || "").trim();
      if (!subjectName) return res.status(400).json({ message: "Teacher subject is required" });
      const subjectExists = await Subject.findOne({ where: { name: subjectName } });
      if (!subjectExists) return res.status(400).json({ message: "Subject does not exist" });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await User.create({
      name: req.body.name,
      email: normalizedEmail,
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

    const nextRole = req.body.role !== undefined ? req.body.role : user.role;
    const nextClass = req.body.class !== undefined ? req.body.class : user.class;
    if (nextRole === "student") {
      const className = String(nextClass || "").trim();
      if (!className) return res.status(400).json({ message: "Student class is required" });
      const classExists = await ClassGroup.findOne({ where: { name: className } });
      if (!classExists) return res.status(400).json({ message: "Class does not exist" });
    }

    if (nextRole === "teacher") {
      const subjectName = String(nextClass || "").trim();
      if (!subjectName) return res.status(400).json({ message: "Teacher subject is required" });
      const subjectExists = await Subject.findOne({ where: { name: subjectName } });
      if (!subjectExists) return res.status(400).json({ message: "Subject does not exist" });
    }

    const allowed = ["name", "email", "role", "class", "semester"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });
    if (req.body.email !== undefined) user.email = String(req.body.email || "").trim().toLowerCase();
    if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);
    await user.save();
    return res.json({ message: "User updated", user });
  } catch (error) {
    return res.status(500).json({ message: "Error updating user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    await user.destroy();
    return res.json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting user" });
  }
};

exports.getClasses = async (_req, res) => {
  try {
    const classes = await ClassGroup.findAll({ order: [["name", "ASC"]] });
    return res.json({
      classes: classes.map((c) => ({ id: c.id, name: c.name })),
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error fetching classes" });
  }
};

exports.createClass = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Class name is required" });

    const existing = await ClassGroup.findOne({ where: { name } });
    if (existing) return res.status(400).json({ message: "Class already exists" });

    const created = await ClassGroup.create({ name });
    return res.status(201).json({ message: "Class created", class: { id: created.id, name: created.name } });
  } catch (_error) {
    return res.status(500).json({ message: "Error creating class" });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const classId = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Class name is required" });

    const classGroup = await ClassGroup.findByPk(classId);
    if (!classGroup) return res.status(404).json({ message: "Class not found" });

    const existing = await ClassGroup.findOne({ where: { name, id: { [Op.ne]: classId } } });
    if (existing) return res.status(400).json({ message: "Class already exists" });

    const oldName = classGroup.name;
    classGroup.name = name;
    await classGroup.save();

    await User.update({ class: name }, { where: { role: "student", class: oldName } });

    return res.json({ message: "Class updated", class: { id: classGroup.id, name: classGroup.name } });
  } catch (_error) {
    return res.status(500).json({ message: "Error updating class" });
  }
};

exports.deleteClass = async (req, res) => {
  try {
    const classId = Number(req.params.id);
    const classGroup = await ClassGroup.findByPk(classId);
    if (!classGroup) return res.status(404).json({ message: "Class not found" });

    await User.update({ class: null }, { where: { role: "student", class: classGroup.name } });
    await classGroup.destroy();
    return res.json({ message: "Class deleted" });
  } catch (_error) {
    return res.status(500).json({ message: "Error deleting class" });
  }
};

exports.getSubjects = async (_req, res) => {
  try {
    const subjects = await Subject.findAll({ order: [["name", "ASC"]] });
    return res.json({
      subjects: subjects.map((s) => ({ id: s.id, name: s.name })),
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error fetching subjects" });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Subject name is required" });

    const existing = await Subject.findOne({ where: { name } });
    if (existing) return res.status(400).json({ message: "Subject already exists" });

    const created = await Subject.create({ name });
    return res.status(201).json({ message: "Subject created", subject: { id: created.id, name: created.name } });
  } catch (_error) {
    return res.status(500).json({ message: "Error creating subject" });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const subjectId = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Subject name is required" });

    const subject = await Subject.findByPk(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const existing = await Subject.findOne({ where: { name, id: { [Op.ne]: subjectId } } });
    if (existing) return res.status(400).json({ message: "Subject already exists" });

    const oldName = subject.name;
    subject.name = name;
    await subject.save();

    await ExamSession.update({ subject: name }, { where: { subject: oldName } });
    await User.update({ class: name }, { where: { role: "teacher", class: oldName } });

    return res.json({ message: "Subject updated", subject: { id: subject.id, name: subject.name } });
  } catch (_error) {
    return res.status(500).json({ message: "Error updating subject" });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const subjectId = Number(req.params.id);
    const subject = await Subject.findByPk(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    await User.update({ class: null }, { where: { role: "teacher", class: subject.name } });
    await subject.destroy();
    return res.json({ message: "Subject deleted" });
  } catch (_error) {
    return res.status(500).json({ message: "Error deleting subject" });
  }
};

exports.getRooms = async (_req, res) => {
  try {
    const rooms = await Room.findAll({ order: [["name", "ASC"]] });
    return res.json({
      rooms: rooms.map((r) => ({ id: r.id, name: r.name })),
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error fetching rooms" });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Room name is required" });

    const existing = await Room.findOne({ where: { name } });
    if (existing) return res.status(400).json({ message: "Room already exists" });

    const created = await Room.create({ name });
    return res.status(201).json({ message: "Room created", room: { id: created.id, name: created.name } });
  } catch (_error) {
    return res.status(500).json({ message: "Error creating room" });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Room name is required" });

    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const existing = await Room.findOne({ where: { name, id: { [Op.ne]: roomId } } });
    if (existing) return res.status(400).json({ message: "Room already exists" });

    const oldName = room.name;
    room.name = name;
    await room.save();

    await ExamSession.update({ room: name }, { where: { room: oldName } });

    return res.json({ message: "Room updated", room: { id: room.id, name: room.name } });
  } catch (_error) {
    return res.status(500).json({ message: "Error updating room" });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const roomId = Number(req.params.id);
    const room = await Room.findByPk(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    await ExamSession.update({ room: null }, { where: { room: room.name } });
    await room.destroy();
    return res.json({ message: "Room deleted" });
  } catch (_error) {
    return res.status(500).json({ message: "Error deleting room" });
  }
};

exports.getSessions = async (_req, res) => {
  try {
    const sessions = await ExamSession.findAll({ order: [["exam_date", "ASC"]] });
    return res.json({
      sessions: sessions.map((item) => ({
        id: item.id,
        subject: item.subject,
        examType: item.exam_type,
        examDate: item.exam_date,
        startTime: item.start_time,
        endTime: item.end_time,
        room: item.room,
        teacherId: item.teacher_id,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching sessions" });
  }
};

exports.createSession = async (req, res) => {
  try {
    const { subject, examType, examDate, teacherId, startTime, endTime, room } = req.body;
    const subjectName = String(subject || "").trim();
    const subjectExists = await Subject.findOne({ where: { name: subjectName } });
    if (!subjectExists) return res.status(400).json({ message: "Subject does not exist" });
    const roomName = String(room || "").trim();
    const roomExists = await Room.findOne({ where: { name: roomName } });
    if (!roomExists) return res.status(400).json({ message: "Room does not exist" });
    const session = await ExamSession.create({
      subject: subjectName,
      exam_type: examType,
      exam_date: examDate,
      teacher_id: teacherId,
      start_time: startTime || null,
      end_time: endTime || null,
      room: roomName,
    });
    return res.status(201).json({ message: "Session created", session });
  } catch (error) {
    return res.status(500).json({ message: "Error creating session" });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const session = await ExamSession.findByPk(Number(req.params.id));
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (req.body.subject !== undefined) {
      const subjectName = String(req.body.subject || "").trim();
      const subjectExists = await Subject.findOne({ where: { name: subjectName } });
      if (!subjectExists) return res.status(400).json({ message: "Subject does not exist" });
      session.subject = subjectName;
    }
    if (req.body.examType !== undefined) session.exam_type = req.body.examType;
    if (req.body.examDate !== undefined) session.exam_date = req.body.examDate;
    if (req.body.teacherId !== undefined) session.teacher_id = req.body.teacherId;
    if (req.body.startTime !== undefined) session.start_time = req.body.startTime || null;
    if (req.body.endTime !== undefined) session.end_time = req.body.endTime || null;
    if (req.body.room !== undefined) {
      const roomName = String(req.body.room || "").trim();
      const roomExists = await Room.findOne({ where: { name: roomName } });
      if (!roomExists) return res.status(400).json({ message: "Room does not exist" });
      session.room = roomName;
    }

    await session.save();
    return res.json({ message: "Session updated", session });
  } catch (error) {
    return res.status(500).json({ message: "Error updating session" });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const session = await ExamSession.findByPk(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const results = await Result.findAll({ where: { exam_session_id: id }, attributes: ["id"] });
    const resultIds = results.map((r) => r.id);
    if (resultIds.length > 0) {
      await DoubleCorrectionRequest.destroy({ where: { result_id: { [Op.in]: resultIds } } });
    }
    await Result.destroy({ where: { exam_session_id: id } });
    await Attendance.destroy({ where: { exam_session_id: id } });
    await ExamReport.destroy({ where: { exam_session_id: id } });
    await EliminationRequest.destroy({ where: { exam_session_id: id } });

    await session.destroy();
    return res.json({ message: "Session deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting session" });
  }
};
