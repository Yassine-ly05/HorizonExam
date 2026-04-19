const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Attendance = require('../models/Attendance');

// Route bech njibou el a3ded mta3 el telmidh
router.get('/dashboard-data/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const grades = await Result.findAll({ where: { Student_id: studentId } });
    const absences = await Attendance.findAll({ where: { Student_id: studentId } });
    
    res.json({ grades, absences });
  } catch (error) {
    res.status(500).json({ message: "Erreur data", error });
  }
});

module.exports = router;