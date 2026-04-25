const sequelize = require('./config/db');  
const User = require('./models/User');
const ExamSession = require('./models/ExamSession');
const Result = require('./models/Result');
const Attendance = require('./models/Attendance');
const Timetable = require('./models/Timetable');
const DoubleCorrectionRequest = require('./models/DoubleCorrectionRequest');
const Notification = require('./models/Notification');
const ExamReport = require('./models/ExamReport');
const bcrypt = require('bcryptjs');

async function syncDatabase() {
  try {
    // Force true will drop tables and recreate them - use only for initial setup or reset
    await sequelize.sync({ force: true });  
    console.log('Database synced successfully.');

    // Seed test users
    const adminPassword = await bcrypt.hash("admin12345", 10);
    const teacherPassword = await bcrypt.hash("teacher12345", 10);
    const studentPassword = await bcrypt.hash("student12345", 10);

    const users = await User.bulkCreate([
      { name: "Admin User", email: "admin@horizon.tn", password: adminPassword, role: "admin" },
      { name: "Teacher User", email: "teacher@horizon.tn", password: teacherPassword, role: "teacher" },
      { name: "Student User", email: "student@horizon.tn", password: studentPassword, role: "student", class: "ING1-A", semester: 1 }
    ]);

    const admin = users[0];
    const teacher = users[1];
    const student = users[2];

    // Seed Exam Session
    const session = await ExamSession.create({
      subject: "Mathematics",
      exam_type: "Exam",
      exam_date: "2026-05-15",
      start_time: "09:00:00",
      end_time: "11:00:00",
      room: "Amphi A",
      teacher_id: teacher.id
    });

    // Seed Result
    await Result.create({
      student_id: student.id,
      exam_session_id: session.id,
      grade: 15.5,
      semester: 1,
      status: "Pending"
    });

    // Seed Attendance
    await Attendance.create({
      student_id: student.id,
      exam_session_id: session.id,
      exam_date: "2026-05-15",
      exam_type: "Exam",
      status: "Present",
      teacher_id: teacher.id
    });

    // Seed Timetable
    await Timetable.create({
      student_id: student.id,
      exam_date: "2026-05-15",
      start_time: "09:00:00",
      end_time: "11:00:00",
      room: "Amphi A",
      subject: "Mathematics",
      exam_type: "Exam"
    });

    // Seed Notification
    await Notification.create({
      student_id: student.id,
      title: "Welcome",
      message: "Welcome to the Horizon Exam platform",
      type: "info"
    });

    console.log('Seed data inserted successfully.');
    process.exit(0);  
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
}

syncDatabase();