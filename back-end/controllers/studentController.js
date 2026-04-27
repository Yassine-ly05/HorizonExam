const User = require("../models/User");
const Result = require("../models/Result");
const Attendance = require("../models/Attendance");
const ExamSession = require("../models/ExamSession");
const Timetable = require("../models/Timetable");
const Notification = require("../models/Notification");
const DoubleCorrectionRequest = require("../models/DoubleCorrectionRequest");
const EliminationRequest = require("../models/EliminationRequest");

const CORRECTION_DEADLINE_DAYS = Number(process.env.CORRECTION_DEADLINE_DAYS || 7);

function calculateFinalStatus(gradeRows, options = {}) {
  const average = (arr) => (arr.length ? arr.reduce((sum, v) => sum + v, 0) / arr.length : 0);
  const normalGrades = gradeRows.filter((g) => g.examType !== "Remedial");
  const semester1Grades = normalGrades
    .filter((g) => Number(g.semester) === 1)
    .map((g) => Number(g.grade || 0));
  const semester2Grades = normalGrades
    .filter((g) => Number(g.semester) === 2)
    .map((g) => Number(g.grade || 0));
  const remedialGrades = gradeRows
    .filter((g) => g.examType === "Remedial")
    .map((g) => Number(g.grade || 0));

  const semester1Average = average(semester1Grades);
  const semester2Average = average(semester2Grades);

  const hasS1 = semester1Grades.length > 0;
  const hasS2 = semester2Grades.length > 0;
  const finalAverage = hasS1 && hasS2 ? (semester1Average + semester2Average) / 2 : hasS1 ? semester1Average : hasS2 ? semester2Average : 0;
  const remedialAverage = average(remedialGrades);

  let finalStatus = "control";
  if (options.isEliminated) finalStatus = "refused";
  else if (finalAverage >= 10) finalStatus = "passed";
  else if (remedialGrades.length > 0) finalStatus = remedialAverage < 10 ? "refused" : "passed";

  return {
    semester1Average: Number(semester1Average.toFixed(2)),
    semester2Average: Number(semester2Average.toFixed(2)),
    finalAverage: Number(finalAverage.toFixed(2)),
    finalStatus,
  };
}

exports.getDashboardData = async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    if (req.user.id !== studentId) return res.status(403).json({ message: "Forbidden" });

    const student = await User.findByPk(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const grades = await Result.findAll({
      where: { student_id: studentId },
      include: [{ model: ExamSession, attributes: ["subject", "exam_type", "exam_date"] }],
      order: [["createdAt", "DESC"]],
      limit: 20,
    });

    const absences = await Attendance.findAll({
      where: { student_id: studentId, status: "Absent" },
      include: [{ model: ExamSession, attributes: ["subject"] }],
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
      examDate: item.ExamSession?.exam_date || null,
      semester: item.semester || "-",
      grade: item.grade,
      status: item.status || "Pending",
    }));

    const sessions = timetable.map((item) => ({
      id: item.id,
      subject: item.subject,
      examType: item.exam_type,
      examDate: item.exam_date,
      startTime: item.start_time,
      endTime: item.end_time,
      room: item.room,
    }));

    const absenceRows = absences.map((item) => ({
      id: item.id,
      subject: item.ExamSession?.subject || "Session",
      date: item.exam_date,
      examType: item.exam_type,
      status: item.status,
    }));

    const publishedGradeRows = gradeRows.filter((g) => g.status === "Published");
    const eliminationCount = await EliminationRequest.count({
      where: { student_id: studentId, status: "Accepted" },
    });
    const finalStatus = calculateFinalStatus(publishedGradeRows, { isEliminated: eliminationCount > 0 });

    return res.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        class: student.class,
      },
      grades: gradeRows,
      absences: absenceRows,
      sessions,
      timetable: sessions,
      summary: {
        average: finalStatus.finalAverage,
        absencesCount: absenceRows.length,
        sessionsCount: sessions.length,
        ...finalStatus,
      },
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
};

exports.getCorrectionRequests = async (req, res) => {
  try {
    const requests = await DoubleCorrectionRequest.findAll({
      where: { student_id: req.user.id },
      include: [{ model: Result, attributes: ["id", "grade", "status"] }],
      order: [["createdAt", "DESC"]],
    });
    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching correction requests" });
  }
};

exports.submitCorrectionRequest = async (req, res) => {
  try {
    const { resultId, reason } = req.body;
    const result = await Result.findOne({
      where: { id: Number(resultId), student_id: req.user.id, status: "Published" },
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
  } catch (error) {
    return res.status(500).json({ message: "Error submitting correction request" });
  }
};
