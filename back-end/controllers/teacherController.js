const User = require("../models/User");
const Result = require("../models/Result");
const Attendance = require("../models/Attendance");
const ExamSession = require("../models/ExamSession");
const ExamReport = require("../models/ExamReport");

exports.getDashboardData = async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    if (req.user.id !== teacherId) return res.status(403).json({ message: "Forbidden" });
    const teacher = await User.findByPk(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const sessions = await ExamSession.findAll({
      where: { teacher_id: teacherId },
      order: [["exam_date", "ASC"]],
    });

    const grades = await Result.findAll({
      include: [
        { model: ExamSession, attributes: ["subject", "exam_type"], where: { teacher_id: teacherId } },
        { model: User, attributes: ["id", "name", "email", "class"] },
      ],
      order: [["updatedAt", "DESC"]],
      limit: 20,
    });

    const students = await User.findAll({
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
        studentName: item.User?.name || "Student",
        studentClass: item.User?.class || "-",
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
};

exports.submitGrade = async (req, res) => {
  try {
    const { studentId, examSessionId, semester, grade } = req.body;
    const examSession = await ExamSession.findOne({
      where: { id: Number(examSessionId), teacher_id: Number(req.user.id) },
    });
    if (!examSession) return res.status(403).json({ message: "Session not assigned to this teacher" });

    const student = await User.findOne({
      where: { id: Number(studentId), role: "student" },
    });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const [result, created] = await Result.findOrCreate({
      where: {
        student_id: Number(studentId),
        exam_session_id: Number(examSessionId),
      },
      defaults: {
        student_id: Number(studentId),
        exam_session_id: Number(examSessionId),
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
};

exports.submitAttendance = async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(500).json({ message: "Error saving attendance" });
  }
};

exports.submitReport = async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(500).json({ message: "Error submitting report" });
  }
};
