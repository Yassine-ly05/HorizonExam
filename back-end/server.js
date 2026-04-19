const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, param } = require("express-validator");

const sequelize = require("./config/db");
const Student = require("./models/Student");
const Result = require("./models/Result");
const Attendance = require("./models/Attendance");
const ExamSession = require("./models/ExamSession");
const Timetable = require("./models/Timetable");
const Notification = require("./models/Notification");
const DoubleCorrectionRequest = require("./models/DoubleCorrectionRequest");
const ExamReport = require("./models/ExamReport");
const { requireAuth, requireRole } = require("./middlewares/auth");
const { validateRequest } = require("./middlewares/validate");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || "horizonexam-dev-secret";
const CORRECTION_DEADLINE_DAYS = Number(process.env.CORRECTION_DEADLINE_DAYS || 7);

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

function calculateFinalStatus(gradeRows) {
  const average = (arr) => (arr.length ? arr.reduce((sum, v) => sum + v, 0) / arr.length : 0);
  const semester1 = gradeRows.filter((g) => Number(g.semester) === 1).map((g) => Number(g.grade || 0));
  const semester2 = gradeRows.filter((g) => Number(g.semester) === 2).map((g) => Number(g.grade || 0));
  const remedial = gradeRows.filter((g) => g.examType === "Remedial").map((g) => Number(g.grade || 0));
  const semester1Average = average(semester1);
  const semester2Average = average(semester2);
  const finalAverage = (semester1Average + semester2Average) / 2;
  const remedialAverage = average(remedial);

  let finalStatus = "Reported (Remedial Required)";
  if (finalAverage >= 10) finalStatus = "Passed";
  else if (remedial.length > 0 && remedialAverage < 10) finalStatus = "Rejected";

  return {
    semester1Average: Number(semester1Average.toFixed(2)),
    semester2Average: Number(semester2Average.toFixed(2)),
    finalAverage: Number(finalAverage.toFixed(2)),
    finalStatus,
  };
}

app.post(
  "/auth/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isString().notEmpty().withMessage("Password is required"),
    body("role").isIn(["student", "teacher", "admin"]).withMessage("Role is invalid"),
    validateRequest,
  ],
  async (req, res) => {
    try {
      const { email, password, role } = req.body;
      const user = await Student.findOne({ where: { email, role } });
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const passwordMatches = user.password.startsWith("$2")
        ? await bcrypt.compare(password, user.password)
        : user.password === password;

      if (!passwordMatches) {
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
  },
);

app.get("/auth/me", requireAuth, async (req, res) => {
  const user = await Student.findByPk(req.user.id, {
    attributes: ["id", "name", "email", "role", "class", "semester"],
  });
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({ user });
});

app.get("/api/student/dashboard-data/:id", requireAuth, requireRole("student"), async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    if (req.user.id !== studentId) return res.status(403).json({ message: "Forbidden" });

    const student = await Student.findByPk(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const grades = await Result.findAll({
      where: { Student_id: studentId, status: "Published" },
      include: [{ model: ExamSession, attributes: ["subject", "exam_type"] }],
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    const absences = await Attendance.findAll({
      where: { student_id: studentId, status: "Absent" },
      order: [["exam_date", "DESC"]],
    });

    const timetable = await Timetable.findAll({
      where: { student_id: studentId },
      order: [["exam_date", "ASC"]],
      limit: 20,
    });

    const notifications = await Notification.findAll({
      where: { student_id: studentId },
      order: [["createdAt", "DESC"]],
      limit: 12,
    });

    const gradeRows = grades.map((item) => ({
      id: item.id,
      subject: item.ExamSession?.subject || "Course",
      examType: item.ExamSession?.exam_type || "-",
      semester: item.semester || "-",
      grade: item.grade,
    }));

    return res.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        class: student.class,
      },
      grades: gradeRows,
      absences,
      timetable: timetable.map((item) => ({
        id: item.id,
        subject: item.subject,
        examType: item.exam_type,
        date: item.exam_date,
        startTime: item.start_time,
        endTime: item.end_time,
        room: item.room,
      })),
      summary: calculateFinalStatus(gradeRows),
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
      })),
      governance: {
        gradeOwner: "Teacher",
        validationOwner: "Administrator",
        studentAccess: "Read-only consultation",
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error fetching dashboard data" });
  }
});

app.get("/api/student/correction-requests", requireAuth, requireRole("student"), async (req, res) => {
  const requests = await DoubleCorrectionRequest.findAll({
    where: { student_id: req.user.id },
    include: [{ model: Result, attributes: ["id", "grade", "status"] }],
    order: [["createdAt", "DESC"]],
  });
  return res.json({ requests });
});

app.post(
  "/api/student/correction-requests",
  requireAuth,
  requireRole("student"),
  [
    body("resultId").isInt({ min: 1 }).withMessage("Valid resultId is required"),
    body("reason").isLength({ min: 10 }).withMessage("Reason must contain at least 10 characters"),
    validateRequest,
  ],
  async (req, res) => {
    const { resultId, reason } = req.body;
    const result = await Result.findOne({
      where: { id: Number(resultId), Student_id: req.user.id, status: "Published" },
    });
    if (!result) return res.status(404).json({ message: "Published result not found" });

    const daysSincePublication =
      (Date.now() - new Date(result.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublication > CORRECTION_DEADLINE_DAYS) {
      return res.status(400).json({ message: "Correction deadline has passed" });
    }

    const request = await DoubleCorrectionRequest.create({
      student_id: req.user.id,
      result_id: result.id,
      reason,
      status: "Pending",
    });
    return res.status(201).json({ message: "Correction request submitted", request });
  },
);

app.get("/api/teacher/dashboard-data/:id", requireAuth, requireRole("teacher"), async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    if (req.user.id !== teacherId) return res.status(403).json({ message: "Forbidden" });
    const teacher = await Student.findByPk(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const sessions = await ExamSession.findAll({
      where: { teacher_id: teacherId },
      order: [["exam_date", "ASC"]],
    });

    const grades = await Result.findAll({
      include: [
        { model: ExamSession, attributes: ["subject", "exam_type"], where: { teacher_id: teacherId } },
        { model: Student, attributes: ["id", "name", "email", "class"] },
      ],
      order: [["updatedAt", "DESC"]],
      limit: 20,
    });

    const students = await Student.findAll({
      where: { role: "student" },
      attributes: ["id", "name", "email", "class", "semester"],
      order: [["name", "ASC"]],
    });

    return res.json({
      teacher: { id: teacher.id, name: teacher.name, email: teacher.email },
      summary: {
        assignedSessions: sessions.length,
        gradesSubmitted: grades.length,
      },
      sessions: sessions.map((item) => ({
        id: item.id,
        subject: item.subject,
        examType: item.exam_type,
        date: item.exam_date,
        startTime: item.start_time,
        endTime: item.end_time,
        room: item.room,
      })),
      students,
      recentGrades: grades.map((item) => ({
        id: item.id,
        studentName: item.Student?.name || "Student",
        studentClass: item.Student?.class || "-",
        subject: item.ExamSession?.subject || "Course",
        examType: item.ExamSession?.exam_type || "-",
        semester: item.semester || "-",
        grade: item.grade,
        status: item.status,
        updatedAt: item.updatedAt,
      })),
      governance: {
        teacherCan: "Enter and update grades, submit attendance and reports",
        adminValidation: "All published grades require administrative validation",
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error fetching teacher dashboard data" });
  }
});

app.post(
  "/api/teacher/grades",
  requireAuth,
  requireRole("teacher"),
  [
    body("studentId").isInt({ min: 1 }),
    body("examSessionId").isInt({ min: 1 }),
    body("semester").isInt({ min: 1, max: 2 }),
    body("grade").isFloat({ min: 0, max: 20 }),
    validateRequest,
  ],
  async (req, res) => {
    try {
      const { studentId, examSessionId, semester, grade } = req.body;
      const examSession = await ExamSession.findOne({
        where: { id: Number(examSessionId), teacher_id: Number(req.user.id) },
      });
      if (!examSession) return res.status(403).json({ message: "Session not assigned to this teacher" });

      const student = await Student.findOne({
        where: { id: Number(studentId), role: "student" },
      });
      if (!student) return res.status(404).json({ message: "Student not found" });

      const [result, created] = await Result.findOrCreate({
        where: {
          Student_id: Number(studentId),
          ExamSession_id: Number(examSessionId),
        },
        defaults: {
          Student_id: Number(studentId),
          ExamSession_id: Number(examSessionId),
          semester: Number(semester),
          grade: Number(grade),
          status: "Pending",
        },
      });

      if (!created) {
        if (result.status === "Published") {
          return res.status(400).json({ message: "Published grades cannot be edited by teachers" });
        }
        result.grade = Number(grade);
        result.semester = Number(semester);
        result.status = "Pending";
        await result.save();
      }

      return res.json({
        message: created ? "Grade submitted successfully" : "Grade updated successfully",
        result,
      });
    } catch (_error) {
      return res.status(500).json({ message: "Error submitting grade" });
    }
  },
);

app.post(
  "/api/teacher/attendance",
  requireAuth,
  requireRole("teacher"),
  [
    body("studentId").isInt({ min: 1 }),
    body("examSessionId").isInt({ min: 1 }),
    body("status").isIn(["Present", "Absent"]),
    validateRequest,
  ],
  async (req, res) => {
    const { studentId, examSessionId, status } = req.body;
    const session = await ExamSession.findOne({
      where: { id: Number(examSessionId), teacher_id: Number(req.user.id) },
    });
    if (!session) return res.status(403).json({ message: "Session not assigned to this teacher" });

    const [attendance] = await Attendance.findOrCreate({
      where: { student_id: Number(studentId), exam_session_id: Number(examSessionId) },
      defaults: {
        student_id: Number(studentId),
        exam_session_id: Number(examSessionId),
        exam_date: session.exam_date,
        exam_type: session.exam_type,
        status,
        teacher_id: req.user.id,
      },
    });

    if (attendance.status !== status) {
      attendance.status = status;
      await attendance.save();
    }
    return res.json({ message: "Attendance saved successfully", attendance });
  },
);

app.post(
  "/api/teacher/reports",
  requireAuth,
  requireRole("teacher"),
  [
    body("examSessionId").isInt({ min: 1 }),
    body("reportText").isLength({ min: 10 }),
    validateRequest,
  ],
  async (req, res) => {
    const { examSessionId, reportText } = req.body;
    const session = await ExamSession.findOne({
      where: { id: Number(examSessionId), teacher_id: Number(req.user.id) },
    });
    if (!session) return res.status(403).json({ message: "Session not assigned to this teacher" });

    const report = await ExamReport.create({
      exam_session_id: Number(examSessionId),
      teacher_id: req.user.id,
      report_text: reportText,
    });
    return res.status(201).json({ message: "Exam report submitted", report });
  },
);

app.get("/api/admin/dashboard-data/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const adminId = Number(req.params.id);
    if (req.user.id !== adminId) return res.status(403).json({ message: "Forbidden" });
    const admin = await Student.findByPk(adminId);
    if (!admin) return res.status(404).json({ message: "Administrator not found" });

    const studentsCount = await Student.count({ where: { role: "student" } });
    const teachersCount = await Student.count({ where: { role: "teacher" } });
    const adminsCount = await Student.count({ where: { role: "admin" } });
    const sessionsCount = await ExamSession.count();

    const pendingGrades = await Result.findAll({
      where: { status: ["Pending", "Validated"] },
      include: [
        { model: Student, attributes: ["id", "name", "class"] },
        { model: ExamSession, attributes: ["id", "subject", "exam_type", "exam_date"] },
      ],
      order: [["updatedAt", "DESC"]],
      limit: 20,
    });

    const correctionRequests = await DoubleCorrectionRequest.findAll({
      where: { status: "Pending" },
      include: [
        { model: Student, attributes: ["id", "name", "class"] },
        { model: Result, attributes: ["id", "grade", "status"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    return res.json({
      admin: { id: admin.id, name: admin.name, email: admin.email },
      summary: {
        studentsCount,
        teachersCount,
        adminsCount,
        sessionsCount,
        pendingCount: pendingGrades.filter((g) => g.status === "Pending").length,
        validatedCount: pendingGrades.filter((g) => g.status === "Validated").length,
        publishedCount: await Result.count({ where: { status: "Published" } }),
      },
      pendingGrades: pendingGrades.map((item) => ({
        id: item.id,
        studentName: item.Student?.name || "Student",
        studentClass: item.Student?.class || "-",
        subject: item.ExamSession?.subject || "Course",
        examType: item.ExamSession?.exam_type || "-",
        examDate: item.ExamSession?.exam_date || "-",
        semester: item.semester || "-",
        grade: item.grade,
        status: item.status,
      })),
      correctionRequests: correctionRequests.map((item) => ({
        id: item.id,
        studentName: item.Student?.name || "Student",
        studentClass: item.Student?.class || "-",
        resultId: item.result_id,
        currentGrade: item.Result?.grade ?? "-",
        reason: item.reason,
        status: item.status,
        createdAt: item.createdAt,
      })),
      governance: {
        workflow: "Teacher submits grades -> Admin validates -> Admin publishes -> Student can consult.",
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error fetching admin dashboard data" });
  }
});

app.post(
  "/api/admin/grades/:id/validate",
  requireAuth,
  requireRole("admin"),
  [param("id").isInt({ min: 1 }), validateRequest],
  async (req, res) => {
    const result = await Result.findByPk(Number(req.params.id));
    if (!result) return res.status(404).json({ message: "Grade record not found" });
    result.status = "Validated";
    await result.save();
    return res.json({ message: "Grade validated successfully" });
  },
);

app.post(
  "/api/admin/grades/:id/publish",
  requireAuth,
  requireRole("admin"),
  [param("id").isInt({ min: 1 }), validateRequest],
  async (req, res) => {
    const result = await Result.findByPk(Number(req.params.id));
    if (!result) return res.status(404).json({ message: "Grade record not found" });
    if (result.status !== "Validated") {
      return res.status(400).json({ message: "Grade must be validated before publication" });
    }
    result.status = "Published";
    await result.save();
    return res.json({ message: "Grade published successfully" });
  },
);

app.post(
  "/api/admin/correction-requests/:id/decision",
  requireAuth,
  requireRole("admin"),
  [
    param("id").isInt({ min: 1 }),
    body("decision").isIn(["Accepted", "Rejected"]),
    body("decisionNote").optional().isLength({ min: 3 }),
    validateRequest,
  ],
  async (req, res) => {
    const request = await DoubleCorrectionRequest.findByPk(Number(req.params.id));
    if (!request) return res.status(404).json({ message: "Correction request not found" });
    request.status = req.body.decision;
    request.decision_note = req.body.decisionNote || null;
    await request.save();
    return res.json({ message: "Correction request processed", request });
  },
);

app.get("/api/admin/users", requireAuth, requireRole("admin"), async (_req, res) => {
  const users = await Student.findAll({
    attributes: ["id", "name", "email", "role", "class", "semester", "createdAt"],
    order: [["createdAt", "DESC"]],
  });
  return res.json({ users });
});

app.post(
  "/api/admin/users",
  requireAuth,
  requireRole("admin"),
  [
    body("name").isLength({ min: 3 }),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
    body("role").isIn(["student", "teacher", "admin"]),
    validateRequest,
  ],
  async (req, res) => {
    const existing = await Student.findOne({ where: { email: req.body.email } });
    if (existing) return res.status(400).json({ message: "Email already in use" });
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await Student.create({
      name: req.body.name,
      email: req.body.email,
      password: passwordHash,
      role: req.body.role,
      class: req.body.class || null,
      semester: req.body.semester || null,
    });
    return res.status(201).json({ message: "User created", user });
  },
);

app.put(
  "/api/admin/users/:id",
  requireAuth,
  requireRole("admin"),
  [param("id").isInt({ min: 1 }), validateRequest],
  async (req, res) => {
    const user = await Student.findByPk(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    const allowed = ["name", "email", "role", "class", "semester"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });
    if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);
    await user.save();
    return res.json({ message: "User updated", user });
  },
);

app.delete("/api/admin/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const user = await Student.findByPk(Number(req.params.id));
  if (!user) return res.status(404).json({ message: "User not found" });
  await user.destroy();
  return res.json({ message: "User deleted" });
});

app.get("/api/admin/sessions", requireAuth, requireRole("admin"), async (_req, res) => {
  const sessions = await ExamSession.findAll({ order: [["exam_date", "ASC"]] });
  return res.json({ sessions });
});

app.post(
  "/api/admin/sessions",
  requireAuth,
  requireRole("admin"),
  [
    body("subject").isLength({ min: 2 }),
    body("examType").isIn(["Exam", "DS", "CC", "Remedial"]),
    body("examDate").isISO8601(),
    body("teacherId").isInt({ min: 1 }),
    validateRequest,
  ],
  async (req, res) => {
    const session = await ExamSession.create({
      subject: req.body.subject,
      exam_type: req.body.examType,
      exam_date: req.body.examDate,
      start_time: req.body.startTime || null,
      end_time: req.body.endTime || null,
      room: req.body.room || null,
      teacher_id: req.body.teacherId,
    });
    return res.status(201).json({ message: "Session created", session });
  },
);

app.post(
  "/api/admin/notifications",
  requireAuth,
  requireRole("admin"),
  [
    body("studentId").isInt({ min: 1 }),
    body("title").isLength({ min: 3 }),
    body("message").isLength({ min: 5 }),
    body("type").optional().isIn(["info", "success", "warning"]),
    validateRequest,
  ],
  async (req, res) => {
    const notification = await Notification.create({
      student_id: Number(req.body.studentId),
      title: req.body.title,
      message: req.body.message,
      type: req.body.type || "info",
    });
    return res.status(201).json({ message: "Notification sent", notification });
  },
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

async function seedUser({ email, name, password, role, className, semester }) {
  const existing = await Student.findOne({ where: { email } });
  if (existing) return existing;
  return Student.create({
    email,
    name,
    password: await bcrypt.hash(password, 10),
    role,
    class: className,
    semester,
  });
}

sequelize
  .sync({ alter: true })
  .then(async () => {
    const demoStudent = await seedUser({
      email: "student@horizon.edu",
      name: "Demo Student",
      password: "student123",
      role: "student",
      className: "2A",
      semester: 2,
    });
    const demoTeacher = await seedUser({
      email: "teacher@horizon.edu",
      name: "Demo Teacher",
      password: "teacher123",
      role: "teacher",
      className: "Faculty",
      semester: 0,
    });
    await seedUser({
      email: "admin@horizon.edu",
      name: "Demo Admin",
      password: "admin123",
      role: "admin",
      className: "Examination Office",
      semester: 0,
    });

    const [session1] = await ExamSession.findOrCreate({
      where: {
        subject: "Mathematics",
        exam_type: "CC",
        exam_date: "2026-04-20",
        teacher_id: demoTeacher.id,
      },
      defaults: {
        subject: "Mathematics",
        exam_type: "CC",
        exam_date: "2026-04-20",
        start_time: "09:00:00",
        end_time: "10:30:00",
        room: "B201",
        teacher_id: demoTeacher.id,
      },
    });

    await Timetable.findOrCreate({
      where: { student_id: demoStudent.id, exam_date: "2026-04-20", subject: "Mathematics" },
      defaults: {
        student_id: demoStudent.id,
        exam_date: "2026-04-20",
        start_time: "09:00:00",
        end_time: "10:30:00",
        room: "B201",
        subject: "Mathematics",
        exam_type: "CC",
      },
    });

    await Result.findOrCreate({
      where: {
        Student_id: demoStudent.id,
        ExamSession_id: session1.id,
      },
      defaults: {
        Student_id: demoStudent.id,
        ExamSession_id: session1.id,
        semester: 2,
        grade: 14.5,
        status: "Published",
      },
    });

    await Notification.findOrCreate({
      where: {
        student_id: demoStudent.id,
        title: "Welcome to HorizonExam",
      },
      defaults: {
        student_id: demoStudent.id,
        title: "Welcome to HorizonExam",
        message: "Your student portal is active. Published grades will appear here.",
        type: "info",
      },
    });

    console.log("✅ MySQL Connected");
    app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("❌ Database connection failed:", error.message);
  });