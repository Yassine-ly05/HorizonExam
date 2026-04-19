import React, { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../services/auth";
import { useNavigate } from "react-router-dom";
import HorizonLogo from "../Horizon.png";
import { apiRequest } from "../services/apiClient";

export function StudentDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [data, setData] = useState({
    grades: [],
    absences: [],
    timetable: [],
    summary: {
      semester1Average: 0,
      semester2Average: 0,
      finalAverage: 0,
      finalStatus: "Pending",
    },
    notifications: [],
    governance: null,
    correctionRequests: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [correctionForm, setCorrectionForm] = useState({ resultId: "", reason: "" });

  useEffect(() => {
    if (!user?.id) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setError("");

    Promise.all([
      apiRequest(`/api/student/dashboard-data/${user.id}`),
      apiRequest("/api/student/correction-requests"),
    ])
      .then(([json, correctionData]) =>
        setData({
          grades: json.grades || [],
          absences: json.absences || [],
          timetable: json.timetable || [],
          summary: json.summary || {
            semester1Average: 0,
            semester2Average: 0,
            finalAverage: 0,
            finalStatus: "Pending",
          },
          notifications: json.notifications || [],
          governance: json.governance || null,
          correctionRequests: correctionData.requests || [],
        }),
      )
      .catch((err) => setError(err.message || "Something went wrong"))
      .finally(() => setIsLoading(false));
  }, [user?.id, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const average =
    data.grades.length > 0
      ? (
          data.grades.reduce((sum, item) => sum + Number(item.grade || 0), 0) /
          data.grades.length
        ).toFixed(2)
      : "0.00";

  const bestGrade =
    data.grades.length > 0
      ? Math.max(...data.grades.map((item) => Number(item.grade || 0))).toFixed(2)
      : "0.00";

  const statusClass =
    data.summary.finalStatus === "Passed"
      ? "hx-badge-success"
      : data.summary.finalStatus.includes("Rejected")
        ? "hx-badge-danger"
        : "hx-badge-warning";

  const handleSubmitCorrection = async (event) => {
    event.preventDefault();
    setNotice("");
    setError("");
    try {
      await apiRequest("/api/student/correction-requests", {
        method: "POST",
        body: JSON.stringify({
          resultId: Number(correctionForm.resultId),
          reason: correctionForm.reason,
        }),
      });
      setNotice("Correction request submitted successfully.");
      setCorrectionForm({ resultId: "", reason: "" });
      const correctionData = await apiRequest("/api/student/correction-requests");
      setData((prev) => ({ ...prev, correctionRequests: correctionData.requests || [] }));
    } catch (err) {
      setError(err.message || "Could not submit correction request");
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
              <h1>Student Dashboard</h1>
            </div>
          </div>
          <div className="hx-student-user">
            <div className="hx-avatar">{user?.name?.charAt(0) || "S"}</div>
            <div>
              <p className="hx-student-name">{user?.name || "Student"}</p>
              <p className="hx-student-meta">ID #{user?.id || "-"}</p>
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
            <p>Average Grade</p>
            <strong>{average} / 20</strong>
          </article>
          <article className="hx-student-card">
            <p>Best Grade</p>
            <strong>{bestGrade} / 20</strong>
          </article>
          <article className="hx-student-card">
            <p>Recorded Grades</p>
            <strong>{data.grades.length}</strong>
          </article>
          <article className="hx-student-card">
            <p>Final Status</p>
            <strong className={statusClass}>{data.summary.finalStatus}</strong>
          </article>
          <article className="hx-student-card">
            <p>Absences</p>
            <strong className="hx-student-danger">{data.absences.length}</strong>
          </article>
        </section>

        {data.governance ? (
          <section className="hx-student-governance">
            <h2>Academic Governance</h2>
            <p>
              <strong>Grade entry owner:</strong> {data.governance.gradeOwner} |{" "}
              <strong>Validation owner:</strong> {data.governance.validationOwner}
            </p>
            <p>
              <strong>Student permissions:</strong> {data.governance.studentAccess}
            </p>
          </section>
        ) : null}

        <section className="hx-student-grid">
          <article className="hx-student-panel">
            <div className="hx-student-panel-title">
              <h2>Recent Grades</h2>
              <span>Academic Year 2025-2026</span>
            </div>
            <div className="hx-student-table-wrap">
              <table className="hx-student-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Semester</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {data.grades.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="hx-student-empty">
                        {isLoading ? "Loading..." : "No grades yet."}
                      </td>
                    </tr>
                  ) : (
                    data.grades.map((g) => (
                      <tr key={g.id}>
                        <td>{g.subject || "Course"}</td>
                        <td>{g.semester || "-"}</td>
                        <td>
                          <strong>{g.grade} / 20</strong>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="hx-student-panel">
            <div className="hx-student-panel-title">
              <h2>Attendance Alerts</h2>
              <span>Recent absence records</span>
            </div>
            <ul className="hx-absence-list">
              {data.absences.length === 0 ? (
                <li className="hx-student-empty">
                  {isLoading ? "Loading..." : "No absences. Great job!"}
                </li>
              ) : (
                data.absences.map((a) => (
                  <li key={a.id} className="hx-absence-item">
                    <div>
                      <p>{a.exam_type || "Exam"}</p>
                      <span>{a.exam_date || "-"}</span>
                    </div>
                    <strong>{a.status}</strong>
                  </li>
                ))
              )}
            </ul>
          </article>
        </section>

        <section className="hx-student-grid">
          <article className="hx-student-panel">
            <div className="hx-student-panel-title">
              <h2>Exam Timetable</h2>
              <span>Date, time, type and room</span>
            </div>
            <div className="hx-student-table-wrap">
              <table className="hx-student-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Time</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {data.timetable.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="hx-student-empty">
                        {isLoading ? "Loading..." : "No timetable published yet."}
                      </td>
                    </tr>
                  ) : (
                    data.timetable.map((item) => (
                      <tr key={item.id}>
                        <td>{item.date || "-"}</td>
                        <td>{item.subject || "-"}</td>
                        <td>{item.examType || "-"}</td>
                        <td>
                          {item.startTime || "-"} - {item.endTime || "-"}
                        </td>
                        <td>{item.room || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="hx-student-panel">
            <div className="hx-student-panel-title">
              <h2>Notifications</h2>
              <span>System and publication updates</span>
            </div>
            <ul className="hx-notification-list">
              {data.notifications.length === 0 ? (
                <li className="hx-student-empty">No notifications.</li>
              ) : (
                data.notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`hx-note-item hx-note-${notification.type || "info"}`}
                  >
                    <p>{notification.title}</p>
                    <span>{notification.message}</span>
                  </li>
                ))
              )}
            </ul>
          </article>
        </section>

        <section className="hx-student-grid">
          <article className="hx-student-panel">
            <div className="hx-student-panel-title">
              <h2>Double Correction Request</h2>
              <span>Available only after publication deadline rules</span>
            </div>
            <form className="hx-form hx-teacher-form" onSubmit={handleSubmitCorrection}>
              <div className="hx-field">
                <label className="hx-label" htmlFor="resultId">
                  Published Grade
                </label>
                <select
                  id="resultId"
                  className="hx-select"
                  value={correctionForm.resultId}
                  onChange={(event) =>
                    setCorrectionForm((prev) => ({ ...prev, resultId: event.target.value }))
                  }
                  required
                >
                  <option value="">Select a grade</option>
                  {data.grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.subject} - {grade.grade}/20 (S{grade.semester})
                    </option>
                  ))}
                </select>
              </div>
              <div className="hx-field">
                <label className="hx-label" htmlFor="reason">
                  Reason
                </label>
                <textarea
                  id="reason"
                  className="hx-input"
                  rows="4"
                  value={correctionForm.reason}
                  onChange={(event) =>
                    setCorrectionForm((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  placeholder="Explain why you are requesting a second correction..."
                  required
                />
              </div>
              <button type="submit" className="hx-button">
                Submit Request
              </button>
            </form>
          </article>

          <article className="hx-student-panel">
            <div className="hx-student-panel-title">
              <h2>Request History</h2>
              <span>Status tracking</span>
            </div>
            <ul className="hx-notification-list">
              {data.correctionRequests.length === 0 ? (
                <li className="hx-student-empty">
                  {isLoading ? "Loading..." : "No correction requests yet."}
                </li>
              ) : (
                data.correctionRequests.map((item) => (
                  <li key={item.id} className="hx-note-item hx-note-info">
                    <p>{item.status} - Result #{item.result_id}</p>
                    <span>{item.reason}</span>
                  </li>
                ))
              )}
            </ul>
          </article>
        </section>
      </div>
    </div>
  );
}