const sequelize = require('./config/db');  
const Student = require('./config/models/Student');
const ExamSession = require('./config/models/ExamSession');
const Result = require('./config/models/Result');
const Attendance = require('./config/models/Attendance');
const Timetable = require('./config/models/Timetable');
const DoubleCorrectionRequest = require('./config/models/DoubleCorrectionRequest');
const Notification = require('./config/models/Notification');

async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });  
    console.log('All models were synchronized successfully.');
    process.exit(0);  
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
}

syncDatabase();