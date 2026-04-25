import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../api/auth";
import { apiRequest } from "../api/client";

export function AdminPage() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
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

  const isDashboard = location.pathname === "/admin" || location.pathname === "/admin/";
  const isUsers = location.pathname.includes("/users");
  const isSessions = location.pathname.includes("/sessions");
  const isSettings = location.pathname.includes("/settings");

  return (
    <>
      {error ? <div className="hx-alert hx-alert-error">{error}</div> : null}
      {notice ? <div className="hx-alert hx-alert-success">{notice}</div> : null}

      {isDashboard && (
        <>
          <div className="hx-stats-grid">
            <article className="hx-stat-card">
              <div className="hx-stat-header">
                <span className="hx-stat-icon">👥</span>
                <span className="hx-stat-label">Students</span>
              </div>
              <div className="hx-stat-value">{data.summary.studentsCount}</div>
            </article>
            <article className="hx-stat-card">
              <div className="hx-stat-header">
                <span className="hx-stat-icon">👨‍🏫</span>
                <span className="hx-stat-label">Teachers</span>
              </div>
              <div className="hx-stat-value">{data.summary.teachersCount}</div>
            </article>
            <article className="hx-stat-card">
              <div className="hx-stat-header">
                <span className="hx-stat-icon">📝</span>
                <span className="hx-stat-label">Sessions</span>
              </div>
              <div className="hx-stat-value">{data.summary.sessionsCount}</div>
            </article>
            <article className="hx-stat-card hx-stat-warning">
              <div className="hx-stat-header">
                <span className="hx-stat-icon">⏳</span>
                <span className="hx-stat-label">Pending</span>
              </div>
              <div className="hx-stat-value">{data.summary.pendingCount}</div>
            </article>
          </div>

          <section className="hx-panel">
            <div className="hx-panel-header">
              <div className="hx-panel-title">
                <h3>Grade Validation Queue</h3>
                <p className="hx-panel-subtitle">{isLoading ? "Refreshing..." : "Validate and publish each grade"}</p>
              </div>
            </div>

            <div className="hx-table-container">
              <table className="hx-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Grade</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pendingGrades.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="hx-table-empty">
                        {isLoading ? "Loading..." : "No pending grades."}
                      </td>
                    </tr>
                  ) : (
                    data.pendingGrades.map((item) => (
                      <tr key={item.id}>
                        <td>{item.studentName}</td>
                        <td>{item.studentClass}</td>
                        <td>{item.subject}</td>
                        <td><span className="hx-badge hx-badge-info">{item.examType}</span></td>
                        <td>{item.examDate}</td>
                        <td><strong className="hx-text-primary">{item.grade}</strong></td>
                        <td>
                          <div className="hx-table-actions">
                            <button onClick={() => handleAction(item.id, "validate")} className="hx-button hx-btn-sm">Validate</button>
                            <button onClick={() => handleAction(item.id, "publish")} className="hx-button hx-btn-sm hx-btn-success">Publish</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="hx-panel">
            <div className="hx-panel-header">
              <h3>Correction Requests</h3>
            </div>
            <div className="hx-table-container">
              <table className="hx-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.correctionRequests.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="hx-table-empty">No requests.</td>
                    </tr>
                  ) : (
                    data.correctionRequests.map((req) => (
                      <tr key={req.id}>
                        <td>{req.studentName}</td>
                        <td>{req.subject}</td>
                        <td>{req.reason}</td>
                        <td>
                          <div className="hx-table-actions">
                            <button onClick={() => handleCorrectionDecision(req.id, "Approved")} className="hx-button hx-btn-sm hx-btn-success">Approve</button>
                            <button onClick={() => handleCorrectionDecision(req.id, "Rejected")} className="hx-button hx-btn-sm hx-btn-danger">Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {isUsers && (
        <section className="hx-panel">
          <div className="hx-panel-header">
            <h3>User Management</h3>
            <p className="hx-panel-subtitle">Add or modify system users</p>
          </div>
          <div className="hx-panel-body">
            <form className="hx-form" onSubmit={handleCreateUser}>
              <div className="hx-form-row">
                <div className="hx-form-group">
                  <label className="hx-label">Full Name</label>
                  <input type="text" className="hx-input" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required />
                </div>
                <div className="hx-form-group">
                  <label className="hx-label">Email</label>
                  <input type="email" className="hx-input" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
                </div>
              </div>
              <div className="hx-form-row">
                <div className="hx-form-group">
                  <label className="hx-label">Role</label>
                  <select className="hx-select" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="hx-form-group">
                  <label className="hx-label">Class (for students)</label>
                  <input type="text" className="hx-input" value={userForm.class} onChange={(e) => setUserForm({ ...userForm, class: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="hx-button">Create User</button>
            </form>
          </div>
          <div className="hx-table-container" style={{ marginTop: '24px', borderTop: '1px solid var(--hx-border)' }}>
            <table className="hx-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Class</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td><span className={`hx-badge ${u.role === 'admin' ? 'hx-badge-danger' : u.role === 'teacher' ? 'hx-badge-info' : 'hx-badge-success'}`}>{u.role}</span></td>
                    <td>{u.class || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isSessions && (
        <section className="hx-panel">
          <div className="hx-panel-header">
            <h3>Exam Sessions</h3>
            <p className="hx-panel-subtitle">Schedule new sessions</p>
          </div>
          <div className="hx-panel-body">
            <form className="hx-form" onSubmit={handleCreateSession}>
              <div className="hx-form-row">
                <div className="hx-form-group">
                  <label className="hx-label">Subject</label>
                  <input type="text" className="hx-input" value={sessionForm.subject} onChange={(e) => setSessionForm({ ...sessionForm, subject: e.target.value })} required />
                </div>
                <div className="hx-form-group">
                  <label className="hx-label">Teacher</label>
                  <select className="hx-select" value={sessionForm.teacherId} onChange={(e) => setSessionForm({ ...sessionForm, teacherId: e.target.value })} required>
                    <option value="">Select</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="hx-form-row">
                <div className="hx-form-group">
                  <label className="hx-label">Date</label>
                  <input type="date" className="hx-input" value={sessionForm.examDate} onChange={(e) => setSessionForm({ ...sessionForm, examDate: e.target.value })} required />
                </div>
                <div className="hx-form-group">
                  <label className="hx-label">Room</label>
                  <input type="text" className="hx-input" value={sessionForm.room} onChange={(e) => setSessionForm({ ...sessionForm, room: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="hx-button">Create Session</button>
            </form>
          </div>
          <div className="hx-table-container" style={{ marginTop: '24px', borderTop: '1px solid var(--hx-border)' }}>
            <table className="hx-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.subject}</strong></td>
                    <td>{s.examType}</td>
                    <td>{s.examDate}</td>
                    <td>{s.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {isSettings && (
        <section className="hx-panel">
          <div className="hx-panel-header">
            <h3>Settings & Governance</h3>
          </div>
          <div className="hx-panel-body">
            {data.governance ? (
              <div className="hx-governance-info">
                <h4>Current Workflow</h4>
                <p>{data.governance.workflow}</p>
              </div>
            ) : <p>No governance settings defined.</p>}
          </div>
        </section>
      )}
    </>
  );
}
