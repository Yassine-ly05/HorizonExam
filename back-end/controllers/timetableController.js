const Timetable = require('../config/models/Timetable');

exports.getStudentTimetable = async (req, res) => {
    try {
        const timetable = await Timetable.findAll(); 
      res.status(200).json(timetable);
    } catch (error) {
        res.status(500).json({ message: "Erreur timetable", error });
    }
};