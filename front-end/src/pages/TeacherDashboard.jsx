import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import HorizonLogo from "../Horizon.png";
import { getCurrentUser, logout } from "../services/auth";
import { apiRequest } from "../services/apiClient";

export function TeacherDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState({
    teacher: null,
    summary: { assignedSessions: 0, gradesSubmitted: 0 },
    sessions: [],
    students: [],
    recentGrades: [],
    governance: null,
  });
  const [formState, setFormState] = useState({
    studentId: "",
    examSessionId: "",
    semester: "1",
    grade: "",
  });
  const [attendanceForm, setAttendanceForm] = useState({
    studentId: "",
    examSessionId: "",
    status: "Present",
  });
  const [reportForm, setReportForm] = useState({
    examSessionId: "",
    reportText: "",
  });

  const loadData = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const json = await apiRequest(`/api/teacher/dashboard-data/${user.id}`);
      setData({
        teacher: json.teacher || null,
        summary: json.summary || { assignedSessions: 0, gradesSubmitted: 0 },
        sessions: json.sessions || [],
        students: json.students || [],
        recentGrades: json.recentGrades || [],
        governance: json.governance || null,
      });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const studentsById = useMemo(() => {
    const map = new Map();
    data.students.forEach((student) => map.set(String(student.id), student));
    return map;
  }, [data.students]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSubmitGrade = async (event) => {
    event.preventDefault();
    setNotice("");
    setError("");

    try {
      const payload = await apiRequest("/api/teacher/grades", {
        method: "POST",
        body: JSON.stringify({
          studentId: Number(formState.studentId),
          examSessionId: Number(formState.examSessionId),
          semester: Number(formState.semester),
          grade: Number(formState.grade),
        }),
      });

      setNotice(payload.message || "Grade submitted");
      setFormState((prev) => ({ ...prev, grade: "" }));
      await loadData();
    } catch (err) {
      setError(err.message || "Could not submit grade");
    }
  };

  const handleSubmitAttendance = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest("/api/teacher/attendance", {
        method: "POST",
        body: JSON.stringify({
          studentId: Number(attendanceForm.studentId),
          examSessionId: Number(attendanceForm.examSessionId),
          status: attendanceForm.status,
        }),
      });
      setNotice(payload.message || "Attendance saved");
    } catch (err) {
      setError(err.message || "Could not save attendance");
    }
  };

  const handleSubmitReport = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest("/api/teacher/reports", {
        method: "POST",
        body: JSON.stringify({
          examSessionId: Number(reportForm.examSessionId),
          reportText: reportForm.reportText,
        }),
      });
      setNotice(payload.message || "Report submitted");
      setReportForm((prev) => ({ ...prev, reportText: "" }));
    } catch (err) {
      setError(err.message || "Could not submit report");
    }
  };

  return (
    <div className="hx-student-page">
      <div className="hx-student-shell">
        <header className="hx-student-topbar">
          <div className="hx-student-brand">
            <img src={HorizonLogo} alt="Horizon" className="hx-student-logo" />
            <div>
              <p className="hx-student-product">HorizonExam</p>
              <h1>Teacher Dashboard</h1>
            </div>
          </div>
          <div className="hx-student-user">
            <div className="hx-avatar">{user?.name?.charAt(0) || "T"}</div>
            <div>
              <p className="hx-student-name">{data.teacher?.name || "Teacher"}</p>
              <p className="hx-student-meta">{data.teacher?.email || ""}</p>
            </div>
            <button onClick={handleLogout} className="hx-student-logout">
              Logout
            </button>
          </div>
        </header>

        {error ? <p className="hx-student-error">{error}</p> : null}
        {notice ? <p className="hx-student-success">{notice}</p> : null}

        <section className="hx-student-stats">
          <article className="hx-student-card">
            <p>Assigned Sessions</p>
            <strong>{data.summary.assignedSessions}</strong>
          </article>
          <article className="hx-student-card">
            <p>Grades Submitted</p>
            <strong>{data.summary.gradesSubmitted}</strong>
          </article>
          <article className="hx-student-card">
            <p>Student Records</p>
            <strong>{data.students.length}</strong>
          </article>
          <article className="hx-student-card">
            <p>Status</p>
            <strong className="hx-badge-success">Active Teaching</strong>
          </article>
        </section>

        {data.governance ? (
          <section className="hx-student-governance">
            <h2>Teacher Workflow</h2>
            <p>{data.governance.teacherCan}</p>
            <p>{data.governance.adminValidation}</p>
          </section>
        ) : null}

        <section className="hx-student-grid">
          <article className="hx-student-panel">
            <div className="hx-student-panel-title">
              <h2>Enter / Update Grade</h2>
              <span>Teacher can edit only assigned sessions</span>
            </div>
            <form className="hx-form hx-teacher-form" onSubmit={handleSubmitGrade}>
              <div className="hx-field">
                <label className="hx-label" htmlFor="studentId">
                  Student
                </label>
                <select
                  id="studentId"
                  className="hx-select"
                  value={formState.studentId}
                  onChange={(e) => setFormState((prev) => ({ ...prev, studentId: e.target.value }))}
                  required
                >
                  <option value="">Select student</option>
                  {data.students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.class || "-"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="hx-field">
                <label className="hx-label" htmlFor="examSessionId">
                  Exam Session
                </label>
                <select
                  id="examSessionId"
                  className="hx-select"
                  value={formState.examSessionId}
                  onChange={(e) => setFormState((prev) => ({ ...prev, examSessionId: e.target.value }))}
                  required
                >
                  <option value="">Select session</option>
                  {data.sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.subject} - {session.examType} ({session.date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="hx-teacher-form-row">
                <div className="hx-field">
                  <label className="hx-label" htmlFor="semester">
                    Semester
                  </label>
                  <select
                    id="semester"
                    className="hx-select"
                    value={formState.semester}
                    onChange={(e) => setFormState((prev) => ({ ...prev, semester: e.target.value }))}
                    required
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>

                <div className="hx-field">
                  <label className="hx-label" htmlFor="grade">
                    Grade (/20)
                  </label>
                  <input
                    id="grade"
                    type="number"
                    min="0"
                    max="20"
                    step="0.25"
                    className="hx-input"
                    value={formState.grade}
                    onChange={(e) => setFormState((prev) => ({ ...prev, grade: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="hx-button" disabled={isLoading}>
                Submit Grade
              </button>
            </form>
          </article>

          <article className="hx-student-panel">
            <div className="hx-student-panel-title">
              <h2>Assigned Sessions</h2>
              <span>Supervision and exams</span>
            </div>
            <ul className="hx-notification-list">
              {data.sessions.length === 0 ? (
                <li className="hx-student-empty">{isLoading ? "Loading..." : "No sessions assigned."}</li>
              ) : (
                data.sessions.map((session) => (
                  <li key={session.id} className="hx-note-item hx-note-info">
                    <p>
                      {session.subject} - {session.examType}
                    </p>
                    <span>
                      {session.date} | {session.startTime || "-"} - {session.endTime || "-"} | Room {session.room || "-"}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </article>

          <article className="hx-student-panel">
            <div className="hx-student-panel-title">
              <h2>Submit Attendance</h2>
              <span>Present/Absent per student and session</span>
            </div>
            <form className="hx-form hx-teacher-form" onSubmit={handleSubmitAttendance}>
              <div className="hx-field">
                <label className="hx-label" htmlFor="attendanceStudentId">
                  Student
                </label>
                <select
                  id="attendanceStudentId"
                  className="hx-select"
                  value={attendanceForm.studentId}
                  onChange={(event) =>
                    setAttendanceForm((prev) => ({ ...prev, studentId: event.target.value }))
                  }
                  required
                >
                  <option value="">Select student</option>
                  {data.students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="hx-teacher-form-row">
                <div className="hx-field">
                  <label className="hx-label" htmlFor="attendanceSessionId">
                    Exam Session
                  </label>
                  <select
                    id="attendanceSessionId"
                    className="hx-select"
                    value={attendanceForm.examSessionId}
                    onChange={(event) =>
                      setAttendanceForm((prev) => ({ ...prev, examSessionId: event.target.value }))
                    }
                    required
                  >
                    <option value="">Select session</option>
                    {data.sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.subject} ({session.examType})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hx-field">
                  <label className="hx-label" htmlFor="attendanceStatus">
                    Status
                  </label>
                  <select
                    id="attendanceStatus"
                    className="hx-select"
                    value={attendanceForm.status}
                    onChange={(event) =>
                      setAttendanceForm((prev) => ({ ...prev, status: event.target.value }))
                    }
                    required
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="hx-button">
                Save Attendance
              </button>
            </form>
          </article>
        </section>

        <section className="hx-student-panel">
          <div className="hx-student-panel-title">
            <h2>Submit Exam Report</h2>
            <span>Official report for exam session archive</span>
          </div>
          <form className="hx-form hx-teacher-form" onSubmit={handleSubmitReport}>
            <div className="hx-field">
              <label className="hx-label" htmlFor="reportSessionId">
                Exam Session
              </label>
              <select
                id="reportSessionId"
                className="hx-select"
                value={reportForm.examSessionId}
                onChange={(event) =>
                  setReportForm((prev) => ({ ...prev, examSessionId: event.target.value }))
                }
                required
              >
                <option value="">Select session</option>
                {data.sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.subject} ({session.examType})
                  </option>
                ))}
              </select>
            </div>
            <div className="hx-field">
              <label className="hx-label" htmlFor="reportText">
                Report text
              </label>
              <textarea
                id="reportText"
                className="hx-input"
                rows="4"
                value={reportForm.reportText}
                onChange={(event) =>
                  setReportForm((prev) => ({ ...prev, reportText: event.target.value }))
                }
                required
              />
            </div>
            <button type="submit" className="hx-button">
              Submit Report
            </button>
          </form>
        </section>

        <section className="hx-student-panel">
          <div className="hx-student-panel-title">
            <h2>Recent Grade Activity</h2>
            <span>Latest submissions and updates</span>
          </div>
          <div className="hx-student-table-wrap">
            <table className="hx-student-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Semester</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentGrades.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="hx-student-empty">
                      {isLoading ? "Loading..." : "No grades submitted yet."}
                    </td>
                  </tr>
                ) : (
                  data.recentGrades.map((gradeItem) => (
                    <tr key={gradeItem.id}>
                      <td>{gradeItem.studentName}</td>
                      <td>{gradeItem.studentClass || studentsById.get(String(gradeItem.studentId))?.class || "-"}</td>
                      <td>{gradeItem.subject}</td>
                      <td>{gradeItem.examType}</td>
                      <td>{gradeItem.semester}</td>
                      <td>
                        <strong>{gradeItem.grade} / 20</strong>
                      </td>
                      <td>{gradeItem.status || "Pending"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

