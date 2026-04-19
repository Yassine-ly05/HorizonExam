import { Router } from "express";
import { authRoutes } from "../modules/auth/routes/auth.routes";
import { usersRoutes } from "../modules/users/routes/users.routes";
import { coursesRoutes } from "../modules/courses/routes/courses.routes";
import { examsRoutes } from "../modules/exams/routes/exams.routes";
import { sessionsRoutes } from "../modules/sessions/routes/sessions.routes";
import { gradesRoutes } from "../modules/grades/routes/grades.routes";
import { attendanceRoutes } from "../modules/attendance/routes/attendance.routes";
import { requestsRoutes } from "../modules/requests/routes/requests.routes";
import { notificationsRoutes } from "../modules/notifications/routes/notifications.routes";

export const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/users", usersRoutes);
apiRoutes.use("/courses", coursesRoutes);
apiRoutes.use("/exams", examsRoutes);
apiRoutes.use("/sessions", sessionsRoutes);
apiRoutes.use("/grades", gradesRoutes);
apiRoutes.use("/attendance", attendanceRoutes);
apiRoutes.use("/requests", requestsRoutes);
apiRoutes.use("/notifications", notificationsRoutes);
