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
    eliminationRequests: [],
    governance: null,
    users: [],
    sessions: [],
    classes: [],
    subjects: [],
    rooms: [],
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
  const [classForm, setClassForm] = useState({ name: "" });
  const [subjectForm, setSubjectForm] = useState({ name: "" });
  const [roomForm, setRoomForm] = useState({ name: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [editingSession, setEditingSession] = useState(null);

  const loadData = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const [payload, usersData, sessionsData, classesData, subjectsData, roomsData] = await Promise.all([
        apiRequest(`/api/admin/dashboard-data/${user.id}`),
        apiRequest("/api/admin/users"),
        apiRequest("/api/admin/sessions"),
        apiRequest("/api/admin/classes"),
        apiRequest("/api/admin/subjects"),
        apiRequest("/api/admin/rooms"),
      ]);
      setData({
        admin: payload.admin || null,
        summary: payload.summary || data.summary,
        pendingGrades: payload.pendingGrades || [],
        correctionRequests: payload.correctionRequests || [],
        eliminationRequests: payload.eliminationRequests || [],
        governance: payload.governance || null,
        users: usersData.users || [],
        sessions: sessionsData.sessions || [],
        classes: classesData.classes || [],
        subjects: subjectsData.subjects || [],
        rooms: roomsData.rooms || [],
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

  const handleEliminationDecision = async (requestId, decision) => {
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest(`/api/admin/elimination-requests/${requestId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, decisionNote: `Decision set to ${decision} by administration` }),
      });
      setNotice(payload.message || "Elimination request updated");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not process elimination request");
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
          class: userForm.role === "student" || userForm.role === "teacher" ? userForm.class : null,
          semester: userForm.role === "student" ? Number(userForm.semester) : null,
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

  const startEditUser = (u) => {
    setEditingUser({
      id: u.id,
      name: u.name || "",
      email: u.email || "",
      role: u.role || "student",
      class: u.class || "",
      semester: u.semester ? String(u.semester) : "1",
      password: "",
    });
    setNotice("");
    setError("");
  };

  const cancelEditUser = () => {
    setEditingUser(null);
  };

  const saveEditUser = async (event) => {
    event.preventDefault();
    if (!editingUser?.id) return;
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
          class: editingUser.role === "student" || editingUser.role === "teacher" ? editingUser.class : null,
          semester: editingUser.role === "student" ? Number(editingUser.semester) : null,
          ...(editingUser.password ? { password: editingUser.password } : {}),
        }),
      });
      setNotice(payload.message || "User updated");
      setEditingUser(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Could not update user");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest(`/api/admin/users/${id}`, { method: "DELETE" });
      setNotice(payload.message || "User deleted");
      if (editingUser?.id === id) setEditingUser(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Could not delete user");
    }
  };

  const createClass = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const name = String(classForm.name || "").trim();
      if (!name) {
        setError("Class name is required");
        return;
      }
      const payload = await apiRequest("/api/admin/classes", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setNotice(payload.message || "Class created");
      setClassForm({ name: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Could not create class");
    }
  };

  const deleteClass = async (id) => {
    if (!window.confirm("Delete this class? Students in this class will be unassigned.")) return;
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest(`/api/admin/classes/${id}`, { method: "DELETE" });
      setNotice(payload.message || "Class deleted");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not delete class");
    }
  };

  const createSubject = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const name = String(subjectForm.name || "").trim();
      if (!name) {
        setError("Subject name is required");
        return;
      }
      const payload = await apiRequest("/api/admin/subjects", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setNotice(payload.message || "Subject created");
      setSubjectForm({ name: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Could not create subject");
    }
  };

  const deleteSubject = async (id) => {
    if (!window.confirm("Delete this subject? Teachers using it will be unassigned.")) return;
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest(`/api/admin/subjects/${id}`, { method: "DELETE" });
      setNotice(payload.message || "Subject deleted");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not delete subject");
    }
  };

  const createRoom = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    try {
      const name = String(roomForm.name || "").trim();
      if (!name) {
        setError("Room name is required");
        return;
      }
      const payload = await apiRequest("/api/admin/rooms", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setNotice(payload.message || "Room created");
      setRoomForm({ name: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Could not create room");
    }
  };

  const deleteRoom = async (id) => {
    if (!window.confirm("Delete this room? Sessions using it will be unassigned.")) return;
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest(`/api/admin/rooms/${id}`, { method: "DELETE" });
      setNotice(payload.message || "Room deleted");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not delete room");
    }
  };

  const startEditSession = (s) => {
    setEditingSession({
      id: s.id,
      subject: s.subject || "",
      examType: s.examType || "CC",
      examDate: s.examDate || "",
      startTime: s.startTime || "",
      endTime: s.endTime || "",
      room: s.room || "",
      teacherId: s.teacherId ? String(s.teacherId) : "",
    });
    setNotice("");
    setError("");
  };

  const cancelEditSession = () => {
    setEditingSession(null);
  };

  const saveEditSession = async (event) => {
    event.preventDefault();
    if (!editingSession?.id) return;
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest(`/api/admin/sessions/${editingSession.id}`, {
        method: "PUT",
        body: JSON.stringify({
          subject: editingSession.subject,
          examType: editingSession.examType,
          examDate: editingSession.examDate,
          startTime: editingSession.startTime || null,
          endTime: editingSession.endTime || null,
          room: editingSession.room,
          teacherId: Number(editingSession.teacherId),
        }),
      });
      setNotice(payload.message || "Session updated");
      setEditingSession(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Could not update session");
    }
  };

  const deleteSession = async (id) => {
    if (!window.confirm("Delete this exam session? Related grades and attendance will be removed.")) return;
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest(`/api/admin/sessions/${id}`, { method: "DELETE" });
      setNotice(payload.message || "Session deleted");
      if (editingSession?.id === id) setEditingSession(null);
      await loadData();
    } catch (err) {
      setError(err.message || "Could not delete session");
    }
  };

  const teachers = data.users.filter((item) => item.role === "teacher");

  const isDashboard = location.pathname === "/admin" || location.pathname === "/admin/";
  const isUsers = location.pathname.includes("/users");
  const isSessions = location.pathname.includes("/sessions");
  const isClasses = location.pathname.includes("/classes");
  const isSubjects = location.pathname.includes("/subjects");
  const isRooms = location.pathname.includes("/rooms");
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

          <section className="hx-panel">
            <div className="hx-panel-header">
              <h3>Elimination Requests</h3>
            </div>
            <div className="hx-table-container">
              <table className="hx-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Session</th>
                    <th>Teacher</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.eliminationRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="hx-table-empty">No requests.</td>
                    </tr>
                  ) : (
                    data.eliminationRequests.map((req) => (
                      <tr key={req.id}>
                        <td>{req.studentName}</td>
                        <td>{req.studentClass}</td>
                        <td>
                          <strong>{req.subject}</strong>
                          <div className="hx-text-muted">{req.examType} · {req.examDate}</div>
                        </td>
                        <td>{req.teacherName}</td>
                        <td>{req.reason}</td>
                        <td>
                          <div className="hx-table-actions">
                            <button onClick={() => handleEliminationDecision(req.id, "Approved")} className="hx-button hx-btn-sm hx-btn-success">Approve</button>
                            <button onClick={() => handleEliminationDecision(req.id, "Rejected")} className="hx-button hx-btn-sm hx-btn-danger">Reject</button>
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
                  <label className="hx-label">Password</label>
                  <input type="password" className="hx-input" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required minLength={8} />
                </div>
              </div>
              <div className="hx-form-row">
                <div className="hx-form-group">
                  <label className="hx-label">Class / Subject</label>
                  {userForm.role === "student" ? (
                    <select className="hx-select" value={userForm.class} onChange={(e) => setUserForm({ ...userForm, class: e.target.value })} required>
                      <option value="">Select</option>
                      {data.classes.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  ) : userForm.role === "teacher" ? (
                    <select className="hx-select" value={userForm.class} onChange={(e) => setUserForm({ ...userForm, class: e.target.value })} required>
                      <option value="">Select</option>
                      {data.subjects.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input type="text" className="hx-input" value={userForm.class} onChange={(e) => setUserForm({ ...userForm, class: e.target.value })} disabled />
                  )}
                </div>
                <div className="hx-form-group">
                  <label className="hx-label">Semester (for students)</label>
                  <select className="hx-select" value={userForm.semester} onChange={(e) => setUserForm({ ...userForm, semester: e.target.value })} disabled={userForm.role !== "student"}>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="hx-button">Create User</button>
            </form>
          </div>
          {editingUser ? (
            <div className="hx-panel-body" style={{ borderTop: "1px solid var(--hx-border)" }}>
              <h4 style={{ marginTop: 0 }}>Edit User</h4>
              <form className="hx-form" onSubmit={saveEditUser}>
                <div className="hx-form-row">
                  <div className="hx-form-group">
                    <label className="hx-label">Full Name</label>
                    <input type="text" className="hx-input" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} required />
                  </div>
                  <div className="hx-form-group">
                    <label className="hx-label">Email</label>
                    <input type="email" className="hx-input" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} required />
                  </div>
                </div>
                <div className="hx-form-row">
                  <div className="hx-form-group">
                    <label className="hx-label">Role</label>
                    <select className="hx-select" value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  <div className="hx-form-group">
                    <label className="hx-label">New Password (optional)</label>
                    <input type="password" className="hx-input" value={editingUser.password} onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} minLength={8} />
                  </div>
                </div>
                <div className="hx-form-row">
                  <div className="hx-form-group">
                    <label className="hx-label">Class / Subject</label>
                    {editingUser.role === "student" ? (
                      <select className="hx-select" value={editingUser.class} onChange={(e) => setEditingUser({ ...editingUser, class: e.target.value })} required>
                        <option value="">Select</option>
                        {data.classes.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    ) : editingUser.role === "teacher" ? (
                      <select className="hx-select" value={editingUser.class} onChange={(e) => setEditingUser({ ...editingUser, class: e.target.value })} required>
                        <option value="">Select</option>
                        {data.subjects.map((s) => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" className="hx-input" value={editingUser.class} onChange={(e) => setEditingUser({ ...editingUser, class: e.target.value })} disabled />
                    )}
                  </div>
                  <div className="hx-form-group">
                    <label className="hx-label">Semester (for students)</label>
                    <select className="hx-select" value={editingUser.semester} onChange={(e) => setEditingUser({ ...editingUser, semester: e.target.value })} disabled={editingUser.role !== "student"}>
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                    </select>
                  </div>
                </div>
                <div className="hx-table-actions">
                  <button type="submit" className="hx-button hx-btn-sm hx-btn-success">Save</button>
                  <button type="button" className="hx-button hx-btn-sm" onClick={cancelEditUser}>Cancel</button>
                </div>
              </form>
            </div>
          ) : null}
          <div className="hx-table-container" style={{ marginTop: '24px', borderTop: '1px solid var(--hx-border)' }}>
            <table className="hx-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Class</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td><span className={`hx-badge ${u.role === 'admin' ? 'hx-badge-danger' : u.role === 'teacher' ? 'hx-badge-info' : 'hx-badge-success'}`}>{u.role}</span></td>
                    <td>{u.class || '-'}</td>
                    <td>
                      <div className="hx-table-actions">
                        <button onClick={() => startEditUser(u)} className="hx-button hx-btn-sm">Edit</button>
                        <button onClick={() => deleteUser(u.id)} className="hx-button hx-btn-sm hx-btn-danger">Delete</button>
                      </div>
                    </td>
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
                  <select className="hx-select" value={sessionForm.subject} onChange={(e) => setSessionForm({ ...sessionForm, subject: e.target.value })} required>
                    <option value="">Select</option>
                    {data.subjects.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
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
                  <label className="hx-label">Type</label>
                  <select className="hx-select" value={sessionForm.examType} onChange={(e) => setSessionForm({ ...sessionForm, examType: e.target.value })} required>
                    <option value="Exam">Exam</option>
                    <option value="DS">DS</option>
                    <option value="CC">CC</option>
                    <option value="Remedial">Remedial</option>
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
                  <select className="hx-select" value={sessionForm.room} onChange={(e) => setSessionForm({ ...sessionForm, room: e.target.value })} required>
                    <option value="">Select</option>
                    {data.rooms.map((r) => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="hx-form-row">
                <div className="hx-form-group">
                  <label className="hx-label">Start Time</label>
                  <input type="time" className="hx-input" value={sessionForm.startTime} onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })} />
                </div>
                <div className="hx-form-group">
                  <label className="hx-label">End Time</label>
                  <input type="time" className="hx-input" value={sessionForm.endTime} onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="hx-button">Create Session</button>
            </form>
          </div>
          {editingSession ? (
            <div className="hx-panel-body" style={{ borderTop: "1px solid var(--hx-border)" }}>
              <h4 style={{ marginTop: 0 }}>Edit Session</h4>
              <form className="hx-form" onSubmit={saveEditSession}>
                <div className="hx-form-row">
                  <div className="hx-form-group">
                    <label className="hx-label">Subject</label>
                    <select className="hx-select" value={editingSession.subject} onChange={(e) => setEditingSession({ ...editingSession, subject: e.target.value })} required>
                      <option value="">Select</option>
                      {data.subjects.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hx-form-group">
                    <label className="hx-label">Teacher</label>
                    <select className="hx-select" value={editingSession.teacherId} onChange={(e) => setEditingSession({ ...editingSession, teacherId: e.target.value })} required>
                      <option value="">Select</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="hx-form-row">
                  <div className="hx-form-group">
                    <label className="hx-label">Type</label>
                    <select className="hx-select" value={editingSession.examType} onChange={(e) => setEditingSession({ ...editingSession, examType: e.target.value })}>
                      <option value="Exam">Exam</option>
                      <option value="DS">DS</option>
                      <option value="CC">CC</option>
                      <option value="Remedial">Remedial</option>
                    </select>
                  </div>
                  <div className="hx-form-group">
                    <label className="hx-label">Date</label>
                    <input type="date" className="hx-input" value={editingSession.examDate} onChange={(e) => setEditingSession({ ...editingSession, examDate: e.target.value })} required />
                  </div>
                </div>
                <div className="hx-form-row">
                  <div className="hx-form-group">
                    <label className="hx-label">Start Time</label>
                    <input type="time" className="hx-input" value={editingSession.startTime} onChange={(e) => setEditingSession({ ...editingSession, startTime: e.target.value })} />
                  </div>
                  <div className="hx-form-group">
                    <label className="hx-label">End Time</label>
                    <input type="time" className="hx-input" value={editingSession.endTime} onChange={(e) => setEditingSession({ ...editingSession, endTime: e.target.value })} />
                  </div>
                </div>
                <div className="hx-form-row">
                  <div className="hx-form-group">
                    <label className="hx-label">Room</label>
                    <select className="hx-select" value={editingSession.room} onChange={(e) => setEditingSession({ ...editingSession, room: e.target.value })} required>
                      <option value="">Select</option>
                      {data.rooms.map((r) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="hx-table-actions">
                  <button type="submit" className="hx-button hx-btn-sm hx-btn-success">Save</button>
                  <button type="button" className="hx-button hx-btn-sm" onClick={cancelEditSession}>Cancel</button>
                </div>
              </form>
            </div>
          ) : null}
          <div className="hx-table-container" style={{ marginTop: '24px', borderTop: '1px solid var(--hx-border)' }}>
            <table className="hx-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Room</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.subject}</strong></td>
                    <td>{s.examType}</td>
                    <td>{s.examDate}</td>
                    <td>{s.room}</td>
                    <td>
                      <div className="hx-table-actions">
                        <button onClick={() => startEditSession(s)} className="hx-button hx-btn-sm">Edit</button>
                        <button onClick={() => deleteSession(s.id)} className="hx-button hx-btn-sm hx-btn-danger">Delete</button>
                      </div>
                    </td>
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

      {isClasses && (
        <section className="hx-panel">
          <div className="hx-panel-header">
            <h3>Manage Classes</h3>
          </div>
          <div className="hx-panel-body">
            <form className="hx-form" onSubmit={createClass}>
              <div className="hx-form-row">
                <div className="hx-form-group" style={{ flex: 1 }}>
                  <label className="hx-label">Class Name</label>
                  <input className="hx-input" value={classForm.name} onChange={(e) => setClassForm({ name: e.target.value })} required />
                </div>
                <div className="hx-form-group" style={{ alignSelf: "end" }}>
                  <button type="submit" className="hx-button hx-btn-sm">Add Class</button>
                </div>
              </div>
            </form>

            <div className="hx-table-container" style={{ marginTop: 12 }}>
              <table className="hx-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.classes.length === 0 ? (
                    <tr><td colSpan="2" className="hx-table-empty">No classes.</td></tr>
                  ) : (
                    data.classes.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td>
                          <div className="hx-table-actions">
                            <button onClick={() => deleteClass(c.id)} className="hx-button hx-btn-sm hx-btn-danger">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {isSubjects && (
        <section className="hx-panel">
          <div className="hx-panel-header">
            <h3>Manage Subjects</h3>
          </div>
          <div className="hx-panel-body">
            <form className="hx-form" onSubmit={createSubject}>
              <div className="hx-form-row">
                <div className="hx-form-group" style={{ flex: 1 }}>
                  <label className="hx-label">Subject Name</label>
                  <input className="hx-input" value={subjectForm.name} onChange={(e) => setSubjectForm({ name: e.target.value })} required />
                </div>
                <div className="hx-form-group" style={{ alignSelf: "end" }}>
                  <button type="submit" className="hx-button hx-btn-sm">Add Subject</button>
                </div>
              </div>
            </form>

            <div className="hx-table-container" style={{ marginTop: 12 }}>
              <table className="hx-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subjects.length === 0 ? (
                    <tr><td colSpan="2" className="hx-table-empty">No subjects.</td></tr>
                  ) : (
                    data.subjects.map((s) => (
                      <tr key={s.id}>
                        <td><strong>{s.name}</strong></td>
                        <td>
                          <div className="hx-table-actions">
                            <button onClick={() => deleteSubject(s.id)} className="hx-button hx-btn-sm hx-btn-danger">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {isRooms && (
        <section className="hx-panel">
          <div className="hx-panel-header">
            <h3>Manage Rooms</h3>
          </div>
          <div className="hx-panel-body">
            <form className="hx-form" onSubmit={createRoom}>
              <div className="hx-form-row">
                <div className="hx-form-group" style={{ flex: 1 }}>
                  <label className="hx-label">Room Name</label>
                  <input className="hx-input" value={roomForm.name} onChange={(e) => setRoomForm({ name: e.target.value })} required />
                </div>
                <div className="hx-form-group" style={{ alignSelf: "end" }}>
                  <button type="submit" className="hx-button hx-btn-sm">Add Room</button>
                </div>
              </div>
            </form>

            <div className="hx-table-container" style={{ marginTop: 12 }}>
              <table className="hx-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rooms.length === 0 ? (
                    <tr><td colSpan="2" className="hx-table-empty">No rooms.</td></tr>
                  ) : (
                    data.rooms.map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.name}</strong></td>
                        <td>
                          <div className="hx-table-actions">
                            <button onClick={() => deleteRoom(r.id)} className="hx-button hx-btn-sm hx-btn-danger">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
