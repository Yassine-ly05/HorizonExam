const User = require("../models/User");
const Result = require("../models/Result");
const Attendance = require("../models/Attendance");
const ExamSession = require("../models/ExamSession");
const Timetable = require("../models/Timetable");
const Notification = require("../models/Notification");
const DoubleCorrectionRequest = require("../models/DoubleCorrectionRequest");

const CORRECTION_DEADLINE_DAYS = Number(process.env.CORRECTION_DEADLINE_DAYS || 7);

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

exports.getDashboardData = async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    if (req.user.id !== studentId) return res.status(403).json({ message: "Forbidden" });

    const student = await User.findByPk(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const grades = await Result.findAll({
      where: { student_id: studentId, status: "Published" },
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
      status: item.status || "Published",
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

    const finalStatus = calculateFinalStatus(gradeRows);

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
