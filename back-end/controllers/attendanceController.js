const Attendance = require('../models/Attendance');

exports.getStudentAttendance = async (req, res) => {
    try {
        const absences = await Attendance.findAll({ 
            where: { Student_id: req.params.studentId } 
        });
        res.status(200).json(absences);
    } catch (error) {
        res.status(500).json({ message: "Erreur attendance", error });
    }
};