require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const sequelize = require("./config/db");

// Models (to ensure associations are loaded if any)
require("./models/User");
require("./models/Result");
require("./models/Attendance");
require("./models/ExamSession");
require("./models/Timetable");
require("./models/Notification");
require("./models/DoubleCorrectionRequest");
require("./models/ExamReport");

// Routes
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = Number(process.env.PORT || 5000);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Routes implementation
app.use("/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/health", (req, res) => res.json({ status: "OK", timestamp: new Date() }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Database sync and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");
    
    // In production, you might not want to sync alter: true
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: false });
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

startServer();
