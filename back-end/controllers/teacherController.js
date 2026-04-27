const User = require("../models/User");
const Result = require("../models/Result");
const Attendance = require("../models/Attendance");
const ExamSession = require("../models/ExamSession");
const ExamReport = require("../models/ExamReport");
const EliminationRequest = require("../models/EliminationRequest");

exports.getDashboardData = async (req, res) => {
  try {
    const teacherId = Number(req.params.id);
    if (req.user.id !== teacherId) return res.status(403).json({ message: "Forbidden" });
    const teacher = await User.findByPk(teacherId);
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const teacherSubject = typeof teacher.class === "string" ? teacher.class.trim() : "";

    const sessions = await ExamSession.findAll({
      where: teacherSubject ? { teacher_id: teacherId, subject: teacherSubject } : { teacher_id: teacherId },
      order: [["exam_date", "ASC"]],
    });

    const grades = await Result.findAll({
      include: [
        { model: ExamSession, attributes: ["subject", "exam_type"], where: teacherSubject ? { teacher_id: teacherId, subject: teacherSubject } : { teacher_id: teacherId } },
        { model: User, attributes: ["id", "name", "email", "class"] },
      ],
      order: [["updatedAt", "DESC"]],
      limit: 20,
    });

    const absences = await Attendance.findAll({
      where: { teacher_id: teacherId, status: "Absent" },
      include: [
        { model: User, attributes: ["id", "name", "class"] },
        { model: ExamSession, attributes: ["subject"] },
      ],
      order: [["updatedAt", "DESC"]],
      limit: 20,
    });

    const students = await User.findAll({
      where: { role: "student" },
      attributes: ["id", "name", "email", "class", "semester"],
      order: [["name", "ASC"]],
    });

    const mySessions = sessions.map((item) => ({
      id: item.id,
      subject: item.subject,
      examType: item.exam_type,
      examDate: item.exam_date,
      startTime: item.start_time,
      endTime: item.end_time,
      room: item.room,
    }));

    return res.json({
      teacher: { id: teacher.id, name: teacher.name, email: teacher.email, subject: teacherSubject || null },
      summary: {
        studentsCount: students.length,
        sessionsCount: sessions.length,
        gradesCount: grades.length,
        absencesCount: absences.length,
      },
      students,
      mySessions,
      sessions: mySessions,
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
      recentAbsences: absences.map((item) => ({
        id: item.id,
        studentName: item.User?.name || "Student",
        studentClass: item.User?.class || "-",
        subject: item.ExamSession?.subject || "Session",
        date: item.exam_date,
      })),
      governance: {
        workflow:
          "Entered grades go through an administrative validation cycle before being published to students.",
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Error fetching teacher dashboard data" });
  }
};

exports.submitGrade = async (req, res) => {
  try {
    const { studentId, semester, grade } = req.body;
    const examSessionId = req.body.examSessionId ?? req.body.sessionId;
    if (!examSessionId) return res.status(400).json({ message: "examSessionId is required" });
    const examSession = await ExamSession.findOne({
      where: { id: Number(examSessionId), teacher_id: Number(req.user.id) },
    });
    if (!examSession) return res.status(403).json({ message: "Session not assigned to this teacher" });

    const student = await User.findOne({
      where: { id: Number(studentId), role: "student" },
    });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const parsedSemester = semester === undefined || semester === null || semester === "" ? null : Number(semester);
    const semesterToSave = Number.isNaN(parsedSemester) ? null : parsedSemester ?? null;
    const resolvedSemester = semesterToSave ?? (student.semester === undefined || student.semester === null ? null : Number(student.semester));

    const [result, created] = await Result.findOrCreate({
      where: {
        student_id: Number(studentId),
        exam_session_id: Number(examSessionId),
      },
      defaults: {
        student_id: Number(studentId),
        exam_session_id: Number(examSessionId),
        semester: resolvedSemester,
        grade: Number(grade),
        status: "Pending",
      },
    });

    if (!created) {
      if (result.status === "Published") {
        return res.status(400).json({ message: "Published grades cannot be edited by teachers" });
      }
      result.grade = Number(grade);
      result.semester = resolvedSemester;
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
    const { studentId, status } = req.body;
    const examSessionId = req.body.examSessionId ?? req.body.sessionId;
    if (!examSessionId) return res.status(400).json({ message: "examSessionId is required" });
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

exports.deleteGrade = async (req, res) => {
  try {
    const gradeId = Number(req.params.id);
    const result = await Result.findOne({
      where: { id: gradeId },
      include: [{ model: ExamSession, attributes: ["id", "teacher_id"] }],
    });
    if (!result) return res.status(404).json({ message: "Grade not found" });
    if (result.ExamSession?.teacher_id !== Number(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (result.status === "Published") {
      return res.status(400).json({ message: "Published grades cannot be deleted" });
    }

    await result.destroy();
    return res.json({ message: "Grade deleted" });
  } catch (_error) {
    return res.status(500).json({ message: "Error deleting grade" });
  }
};

exports.deleteAttendance = async (req, res) => {
  try {
    const attendanceId = Number(req.params.id);
    const attendance = await Attendance.findByPk(attendanceId);
    if (!attendance) return res.status(404).json({ message: "Attendance not found" });
    if (Number(attendance.teacher_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await attendance.destroy();
    return res.json({ message: "Attendance deleted" });
  } catch (_error) {
    return res.status(500).json({ message: "Error deleting attendance" });
  }
};

exports.submitEliminationRequest = async (req, res) => {
  try {
    const { studentId, reason } = req.body;
    const examSessionId = req.body.examSessionId ?? req.body.sessionId;
    if (!examSessionId) return res.status(400).json({ message: "examSessionId is required" });

    const session = await ExamSession.findOne({
      where: { id: Number(examSessionId), teacher_id: Number(req.user.id) },
    });
    if (!session) return res.status(403).json({ message: "Session not assigned to this teacher" });

    const student = await User.findOne({ where: { id: Number(studentId), role: "student" } });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const request = await EliminationRequest.create({
      student_id: Number(studentId),
      teacher_id: Number(req.user.id),
      exam_session_id: Number(examSessionId),
      reason,
      status: "Pending",
    });

    return res.status(201).json({ message: "Elimination request submitted", request });
  } catch (_error) {
    return res.status(500).json({ message: "Error submitting elimination request" });
  }
};

exports.submitReport = async (req, res) => {
  try {
    const { reportText } = req.body;
    const examSessionId = req.body.examSessionId ?? req.body.sessionId;
    if (!examSessionId) return res.status(400).json({ message: "examSessionId is required" });
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
