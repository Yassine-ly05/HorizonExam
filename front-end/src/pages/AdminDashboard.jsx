import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HorizonLogo from "../Horizon.png";
import { getCurrentUser, logout } from "../services/auth";
import { apiRequest } from "../services/apiClient";

export function AdminDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState({
    admin: null,
    summary: {
      studentsCount: 0,
      teachersCount: 0,
      adminsCount: 0,
      sessionsCount: 0,
      pendingCount: 0,
      validatedCount: 0,
      publishedCount: 0,
    },
    pendingGrades: [],
    correctionRequests: [],
    governance: null,
    users: [],
    sessions: [],
  });
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "student", class: "", semester: "1" });
  const [sessionForm, setSessionForm] = useState({
    subject: "",
    examType: "CC",
    examDate: "",
    startTime: "",
    endTime: "",
    room: "",
    teacherId: "",
  });

  const loadData = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const [payload, usersData, sessionsData] = await Promise.all([
        apiRequest(`/api/admin/dashboard-data/${user.id}`),
        apiRequest("/api/admin/users"),
        apiRequest("/api/admin/sessions"),
      ]);
      setData({
        admin: payload.admin || null,
        summary: payload.summary || data.summary,
        pendingGrades: payload.pendingGrades || [],
        correctionRequests: payload.correctionRequests || [],
        governance: payload.governance || null,
        users: usersData.users || [],
        sessions: sessionsData.sessions || [],
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

  const handleAction = async (gradeId, action) => {
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest(`/api/admin/grades/${gradeId}/${action}`, {
        method: "POST",
      });
      setNotice(payload.message || "Action completed");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not process request");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCorrectionDecision = async (requestId, decision) => {
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest(`/api/admin/correction-requests/${requestId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, decisionNote: `Decision set to ${decision} by administration` }),
      });
      setNotice(payload.message || "Correction request updated");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not process correction request");
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          password: userForm.password,
          role: userForm.role,
          class: userForm.class,
          semester: Number(userForm.semester),
        }),
      });
      setNotice(payload.message || "User created");
      setUserForm({ name: "", email: "", password: "", role: "student", class: "", semester: "1" });
      await loadData();
    } catch (err) {
      setError(err.message || "Could not create user");
    }
  };

  const handleCreateSession = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest("/api/admin/sessions", {
        method: "POST",
        body: JSON.stringify({
          ...sessionForm,
          teacherId: Number(sessionForm.teacherId),
        }),
      });
      setNotice(payload.message || "Session created");
      setSessionForm({
        subject: "",
        examType: "CC",
        examDate: "",
        startTime: "",
        endTime: "",
        room: "",
        teacherId: "",
      });
      await loadData();
    } catch (err) {
      setError(err.message || "Could not create session");
    }
  };

  const teachers = data.users.filter((item) => item.role === "teacher");

  return (
    <div className="hx-student-page">
      <div className="hx-student-shell">
        <header className="hx-student-topbar">
          <div className="hx-student-brand">
            <img src={HorizonLogo} alt="Horizon" className="hx-student-logo" />
            <div>
              <p className="hx-student-product">HorizonExam</p>
              <h1>Administrator Dashboard</h1>
            </div>
          </div>
          <div className="hx-student-user">
            <div className="hx-avatar">{user?.name?.charAt(0) || "A"}</div>
            <div>
              <p className="hx-student-name">{data.admin?.name || "Administrator"}</p>
              <p className="hx-student-meta">{data.admin?.email || ""}</p>
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
            <p>Students</p>
            <strong>{data.summary.studentsCount}</strong>
          </article>
          <article className="hx-student-card">
            <p>Teachers</p>
            <strong>{data.summary.teachersCount}</strong>
          </article>
          <article className="hx-student-card">
            <p>Exam Sessions</p>
            <strong>{data.summary.sessionsCount}</strong>
          </article>
          <article className="hx-student-card">
            <p>Pending Grades</p>
            <strong className="hx-badge-warning">{data.summary.pendingCount}</strong>
          </article>
          <article className="hx-student-card">
            <p>Validated</p>
            <strong>{data.summary.validatedCount}</strong>
          </article>
          <article className="hx-student-card">
            <p>Published</p>
            <strong className="hx-badge-success">{data.summary.publishedCount}</strong>
          </article>
        </section>

        {data.governance ? (
          <section className="hx-student-governance">
            <h2>Governance Workflow</h2>
            <p>{data.governance.workflow}</p>
          </section>
        ) : null}

        <section className="hx-student-panel">
          <div className="hx-student-panel-title">
            <h2>Grade Validation Queue</h2>
            <span>{isLoading ? "Refreshing..." : "Validate then publish each grade"}</span>
          </div>

          <div className="hx-student-table-wrap">
            <table className="hx-student-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Semester</th>
                  <th>Grade</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.pendingGrades.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="hx-student-empty">
                      {isLoading ? "Loading..." : "No pending grades."}
                    </td>
                  </tr>
                ) : (
                  data.pendingGrades.map((item) => (
                    <tr key={item.id}>
                      <td>{item.studentName}</td>
                      <td>{item.studentClass}</td>
                      <td>{item.subject}</td>
                      <td>{item.examType}</td>
                      <td>{item.examDate}</td>
                      <td>{item.semester}</td>
                      <td>
                        <strong>{item.grade} / 20</strong>
                      </td>
                      <td>
                        <div className="hx-admin-actions">
                          <button
                            type="button"
                            className="hx-admin-btn hx-admin-btn-validate"
                            onClick={() => handleAction(item.id, "validate")}
                          >
                            Validate
                          </button>
                          <button
                            type="button"
                            className="hx-admin-btn hx-admin-btn-publish"
                            onClick={() => handleAction(item.id, "publish")}
                          >
                            Publish
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="hx-student-grid">
          <article className="hx-student-panel">
            <div className="hx-student-panel-title">
              <h2>Manage Users</h2>
              <span>Create students, teachers and admins</span>
            </div>
            <form className="hx-form hx-teacher-form" onSubmit={handleCreateUser}>
              <div className="hx-teacher-form-row">
                <div className="hx-field">
                  <label className="hx-label" htmlFor="adminCreateName">Name</label>
                  <input id="adminCreateName" className="hx-input" value={userForm.name} onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))} required />
                </div>
                <div className="hx-field">
                  <label className="hx-label" htmlFor="adminCreateEmail">Email</label>
                  <input id="adminCreateEmail" className="hx-input" type="email" value={userForm.email} onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))} required />
                </div>
              </div>
              <div className="hx-teacher-form-row">
                <div className="hx-field">
                  <label className="hx-label" htmlFor="adminCreatePassword">Password</label>
                  <input id="adminCreatePassword" className="hx-input" type="password" value={userForm.password} onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))} required />
                </div>
                <div className="hx-field">
                  <label className="hx-label" htmlFor="adminCreateRole">Role</label>
                  <select id="adminCreateRole" className="hx-select" value={userForm.role} onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value }))}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="hx-teacher-form-row">
                <div className="hx-field">
                  <label className="hx-label" htmlFor="adminCreateClass">Class</label>
                  <input id="adminCreateClass" className="hx-input" value={userForm.class} onChange={(event) => setUserForm((prev) => ({ ...prev, class: event.target.value }))} />
                </div>
                <div className="hx-field">
                  <label className="hx-label" htmlFor="adminCreateSemester">Semester</label>
                  <input id="adminCreateSemester" className="hx-input" type="number" min="0" max="2" value={userForm.semester} onChange={(event) => setUserForm((prev) => ({ ...prev, semester: event.target.value }))} />
                </div>
              </div>
              <button type="submit" className="hx-button">Create User</button>
            </form>
          </article>

          <article className="hx-student-panel">
            <div className="hx-student-panel-title">
              <h2>Create Exam Session</h2>
              <span>Planning and scheduling foundation</span>
            </div>
            <form className="hx-form hx-teacher-form" onSubmit={handleCreateSession}>
              <div className="hx-field">
                <label className="hx-label" htmlFor="sessionSubject">Subject</label>
                <input id="sessionSubject" className="hx-input" value={sessionForm.subject} onChange={(event) => setSessionForm((prev) => ({ ...prev, subject: event.target.value }))} required />
              </div>
              <div className="hx-teacher-form-row">
                <div className="hx-field">
                  <label className="hx-label" htmlFor="sessionType">Type</label>
                  <select id="sessionType" className="hx-select" value={sessionForm.examType} onChange={(event) => setSessionForm((prev) => ({ ...prev, examType: event.target.value }))}>
                    <option value="Exam">Exam</option>
                    <option value="DS">DS</option>
                    <option value="CC">CC</option>
                    <option value="Remedial">Remedial</option>
                  </select>
                </div>
                <div className="hx-field">
                  <label className="hx-label" htmlFor="sessionDate">Date</label>
                  <input id="sessionDate" className="hx-input" type="date" value={sessionForm.examDate} onChange={(event) => setSessionForm((prev) => ({ ...prev, examDate: event.target.value }))} required />
                </div>
              </div>
              <div className="hx-teacher-form-row">
                <div className="hx-field">
                  <label className="hx-label" htmlFor="sessionStart">Start</label>
                  <input id="sessionStart" className="hx-input" type="time" value={sessionForm.startTime} onChange={(event) => setSessionForm((prev) => ({ ...prev, startTime: event.target.value }))} />
                </div>
                <div className="hx-field">
                  <label className="hx-label" htmlFor="sessionEnd">End</label>
                  <input id="sessionEnd" className="hx-input" type="time" value={sessionForm.endTime} onChange={(event) => setSessionForm((prev) => ({ ...prev, endTime: event.target.value }))} />
                </div>
              </div>
              <div className="hx-teacher-form-row">
                <div className="hx-field">
                  <label className="hx-label" htmlFor="sessionRoom">Room</label>
                  <input id="sessionRoom" className="hx-input" value={sessionForm.room} onChange={(event) => setSessionForm((prev) => ({ ...prev, room: event.target.value }))} />
                </div>
                <div className="hx-field">
                  <label className="hx-label" htmlFor="sessionTeacher">Teacher</label>
                  <select id="sessionTeacher" className="hx-select" value={sessionForm.teacherId} onChange={(event) => setSessionForm((prev) => ({ ...prev, teacherId: event.target.value }))} required>
                    <option value="">Select teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="hx-button">Create Session</button>
            </form>
          </article>
        </section>

        <section className="hx-student-grid">
          <article className="hx-student-panel">
            <div className="hx-student-panel-title">
              <h2>Pending Correction Requests</h2>
              <span>Final decision governance</span>
            </div>
            <ul className="hx-notification-list">
              {data.correctionRequests.length === 0 ? (
                <li className="hx-student-empty">No pending requests.</li>
              ) : (
                data.correctionRequests.map((item) => (
                  <li key={item.id} className="hx-note-item hx-note-warning">
                    <p>{item.studentName} ({item.studentClass}) - grade {item.currentGrade}</p>
                    <span>{item.reason}</span>
                    <div className="hx-admin-actions">
                      <button type="button" className="hx-admin-btn hx-admin-btn-validate" onClick={() => handleCorrectionDecision(item.id, "Accepted")}>Accept</button>
                      <button type="button" className="hx-admin-btn hx-admin-btn-publish" onClick={() => handleCorrectionDecision(item.id, "Rejected")}>Reject</button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </article>

          <article className="hx-student-panel">
            <div className="hx-student-panel-title">
              <h2>Current Users</h2>
              <span>Quick governance overview</span>
            </div>
            <div className="hx-student-table-wrap">
              <table className="hx-student-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Class</th></tr>
                </thead>
                <tbody>
                  {data.users.slice(0, 12).map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.email}</td>
                      <td>{item.role}</td>
                      <td>{item.class || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

