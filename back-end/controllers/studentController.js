const Result = require('../models/Result');
const Student = require('../models/Student');
exports.getResults = async (req, res) => {
    try {
        const { studentId } = req.params;
        const results = await Result.findAll({ 
            where: { Student_id: studentId } 
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: "Mochkla fil a3ded", error });
    }
};