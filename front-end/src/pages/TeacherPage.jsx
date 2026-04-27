import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../api/auth";
import { apiRequest } from "../api/client";

export function TeacherPage() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState({
    teacher: null,
    summary: {
      studentsCount: 0,
      sessionsCount: 0,
      gradesCount: 0,
      absencesCount: 0,
    },
    students: [],
    mySessions: [],
    recentGrades: [],
    recentAbsences: [],
    governance: null,
  });

  const [gradeForm, setGradeForm] = useState({
    studentId: "",
    sessionId: "",
    grade: "",
  });

  const [absenceForm, setAbsenceForm] = useState({
    studentId: "",
    sessionId: "",
  });
  const [eliminationForm, setEliminationForm] = useState({
    studentId: "",
    sessionId: "",
    reason: "",
  });

  const loadData = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const payload = await apiRequest(`/api/teacher/dashboard-data/${user.id}`);
      setData({
        teacher: payload.teacher || null,
        summary: payload.summary || data.summary,
        students: payload.students || [],
        mySessions: payload.mySessions || [],
        recentGrades: payload.recentGrades || [],
        recentAbsences: payload.recentAbsences || [],
        governance: payload.governance || null,
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

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest("/api/teacher/grades", {
        method: "POST",
        body: JSON.stringify({
          studentId: Number(gradeForm.studentId),
          sessionId: Number(gradeForm.sessionId),
          grade: Number(gradeForm.grade),
        }),
      });
      setNotice(payload.message || "Grade saved successfully");
      setGradeForm({ studentId: "", sessionId: "", grade: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Error during saving");
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (!gradeForm.sessionId && data.mySessions[0]) {
      setGradeForm((prev) => ({ ...prev, sessionId: String(data.mySessions[0].id) }));
    }
  }, [isLoading, data.mySessions, gradeForm.sessionId]);

  useEffect(() => {
    if (isLoading) return;
    if (!absenceForm.sessionId && data.mySessions[0]) {
      setAbsenceForm((prev) => ({ ...prev, sessionId: String(data.mySessions[0].id) }));
    }
  }, [isLoading, data.mySessions, absenceForm.sessionId]);

  useEffect(() => {
    if (isLoading) return;
    if (!eliminationForm.sessionId && data.mySessions[0]) {
      setEliminationForm((prev) => ({ ...prev, sessionId: String(data.mySessions[0].id) }));
    }
  }, [isLoading, data.mySessions, eliminationForm.sessionId]);

  const handleAbsenceSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest("/api/teacher/absences", {
        method: "POST",
        body: JSON.stringify({
          studentId: Number(absenceForm.studentId),
          sessionId: Number(absenceForm.sessionId),
          status: "Absent",
        }),
      });
      setNotice(payload.message || "Absence recorded");
      setAbsenceForm({ studentId: "", sessionId: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Error during saving");
    }
  };

  const handleEliminationSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest("/api/teacher/eliminations", {
        method: "POST",
        body: JSON.stringify({
          studentId: Number(eliminationForm.studentId),
          sessionId: Number(eliminationForm.sessionId),
          reason: eliminationForm.reason,
        }),
      });
      setNotice(payload.message || "Elimination request submitted");
      setEliminationForm({ studentId: "", sessionId: "", reason: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Could not submit elimination request");
    }
  };

  const deleteGrade = async (id) => {
    if (!window.confirm("Delete this grade?")) return;
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest(`/api/teacher/grades/${id}`, { method: "DELETE" });
      setNotice(payload.message || "Grade deleted");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not delete grade");
    }
  };

  const deleteAttendance = async (id) => {
    if (!window.confirm("Delete this absence record?")) return;
    setError("");
    setNotice("");
    try {
      const payload = await apiRequest(`/api/teacher/attendance/${id}`, { method: "DELETE" });
      setNotice(payload.message || "Attendance deleted");
      await loadData();
    } catch (err) {
      setError(err.message || "Could not delete attendance");
    }
  };

  const isDashboard = location.pathname === "/teacher" || location.pathname === "/teacher/";
  const isGrades = location.pathname.includes("/grades");
  const isAttendance = location.pathname.includes("/attendance");
  const isReports = location.pathname.includes("/reports");

  return (
    <>
      {error ? <div className="hx-alert hx-alert-error">{error}</div> : null}
      {notice ? <div className="hx-alert hx-alert-success">{notice}</div> : null}

      {isDashboard && (
        <div className="hx-stats-grid">
          <article className="hx-stat-card">
            <div className="hx-stat-header">
              <span className="hx-stat-icon">👨‍🎓</span>
              <span className="hx-stat-label">My Students</span>
            </div>
            <div className="hx-stat-value">{data.summary.studentsCount}</div>
          </article>
          <article className="hx-stat-card">
            <div className="hx-stat-header">
              <span className="hx-stat-icon">📚</span>
              <span className="hx-stat-label">My Sessions</span>
            </div>
            <div className="hx-stat-value">{data.summary.sessionsCount}</div>
          </article>
          <article className="hx-stat-card hx-stat-success">
            <div className="hx-stat-header">
              <span className="hx-stat-icon">📝</span>
              <span className="hx-stat-label">Grades Entered</span>
            </div>
            <div className="hx-stat-value">{data.summary.gradesCount}</div>
          </article>
          <article className="hx-stat-card hx-stat-danger">
            <div className="hx-stat-header">
              <span className="hx-stat-icon">🚫</span>
              <span className="hx-stat-label">Absences</span>
            </div>
            <div className="hx-stat-value">{data.summary.absencesCount}</div>
          </article>
        </div>
      )}

      {(isDashboard || isGrades) && (
        <section className="hx-panel">
          <div className="hx-panel-header">
            <h3>Grade Entry</h3>
            <p className="hx-panel-subtitle">Record exam results</p>
          </div>
          <div className="hx-panel-body">
            <form className="hx-form" onSubmit={handleGradeSubmit}>
              <div className="hx-form-row">
                <div className="hx-form-group">
                  <label className="hx-label">Student</label>
                  <select className="hx-select" value={gradeForm.studentId} onChange={(e) => setGradeForm({ ...gradeForm, studentId: e.target.value })} required>
                    <option value="">Select</option>
                    {data.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                  </select>
                </div>
                <div className="hx-form-group">
                  <label className="hx-label">Session</label>
                  <select className="hx-select" value={gradeForm.sessionId} onChange={(e) => setGradeForm({ ...gradeForm, sessionId: e.target.value })} required>
                    <option value="">Select</option>
                    {data.mySessions.map(s => <option key={s.id} value={s.id}>{s.subject} • {s.examType} • {s.examDate}</option>)}
                  </select>
                </div>
              </div>
              <div className="hx-form-row">
                <div className="hx-form-group">
                  <label className="hx-label">Grade</label>
                  <input type="number" step="0.25" min="0" max="20" className="hx-input" value={gradeForm.grade} onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })} required />
                </div>
              </div>
              <button type="submit" className="hx-button">Save Grade</button>
            </form>
          </div>
          {(isDashboard || isGrades) && (
            <div className="hx-table-container" style={{ marginTop: '24px', borderTop: '1px solid var(--hx-border)' }}>
              <table className="hx-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Grade</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentGrades.length === 0 ? (
                    <tr><td colSpan="5" className="hx-table-empty">No recent grades.</td></tr>
                  ) : (
                    data.recentGrades.map(g => (
                      <tr key={g.id}>
                        <td>{g.studentName}</td>
                        <td>{g.subject}</td>
                        <td><strong className="hx-text-primary">{g.grade}</strong></td>
                        <td><span className={`hx-badge ${g.status === 'Published' ? 'hx-badge-success' : 'hx-badge-warning'}`}>{g.status}</span></td>
                        <td>
                          <div className="hx-table-actions">
                            <button onClick={() => deleteGrade(g.id)} className="hx-button hx-btn-sm hx-btn-danger" disabled={g.status === "Published"}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {(isDashboard || isAttendance) && (
        <section className="hx-panel">
          <div className="hx-panel-header">
            <h3>Attendance Management</h3>
          </div>
          <div className="hx-panel-body">
            <form className="hx-form" onSubmit={handleAbsenceSubmit}>
              <div className="hx-form-row">
                <div className="hx-form-group">
                  <label className="hx-label">Student</label>
                  <select className="hx-select" value={absenceForm.studentId} onChange={(e) => setAbsenceForm({ ...absenceForm, studentId: e.target.value })} required>
                    <option value="">Select</option>
                    {data.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                  </select>
                </div>
                <div className="hx-form-group">
                  <label className="hx-label">Session</label>
                  <select className="hx-select" value={absenceForm.sessionId} onChange={(e) => setAbsenceForm({ ...absenceForm, sessionId: e.target.value })} required>
                    <option value="">Select</option>
                    {data.mySessions.map(s => <option key={s.id} value={s.id}>{s.subject} - {s.examDate}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="hx-btn hx-btn-danger">Mark as absent</button>
            </form>
          </div>
          {isDashboard && (
            <div className="hx-table-container" style={{ marginTop: '24px', borderTop: '1px solid var(--hx-border)' }}>
              <table className="hx-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentAbsences.length === 0 ? (
                    <tr><td colSpan="4" className="hx-table-empty">No recent absences.</td></tr>
                  ) : (
                    data.recentAbsences.map(a => (
                      <tr key={a.id}>
                        <td>{a.studentName}</td>
                        <td>{a.subject}</td>
                        <td>{a.date}</td>
                        <td>
                          <div className="hx-table-actions">
                            <button onClick={() => deleteAttendance(a.id)} className="hx-button hx-btn-sm hx-btn-danger">
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {isReports && (
        <section className="hx-panel">
          <div className="hx-panel-header">
            <h3>Reports & Governance</h3>
          </div>
          <div className="hx-panel-body">
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginTop: 0 }}>Elimination Request</h4>
              <form className="hx-form" onSubmit={handleEliminationSubmit}>
                <div className="hx-form-row">
                  <div className="hx-form-group">
                    <label className="hx-label">Student</label>
                    <select className="hx-select" value={eliminationForm.studentId} onChange={(e) => setEliminationForm({ ...eliminationForm, studentId: e.target.value })} required>
                      <option value="">Select</option>
                      {data.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                    </select>
                  </div>
                  <div className="hx-form-group">
                    <label className="hx-label">Session</label>
                    <select className="hx-select" value={eliminationForm.sessionId} onChange={(e) => setEliminationForm({ ...eliminationForm, sessionId: e.target.value })} required>
                      <option value="">Select</option>
                      {data.mySessions.map(s => <option key={s.id} value={s.id}>{s.subject} - {s.examDate}</option>)}
                    </select>
                  </div>
                </div>
                <div className="hx-form-row">
                  <div className="hx-form-group" style={{ flex: 1 }}>
                    <label className="hx-label">Reason</label>
                    <textarea className="hx-input" value={eliminationForm.reason} onChange={(e) => setEliminationForm({ ...eliminationForm, reason: e.target.value })} minLength={5} required rows={3} />
                  </div>
                </div>
                <button type="submit" className="hx-button hx-btn-sm hx-btn-danger">Request Elimination</button>
              </form>
            </div>
            {data.governance ? (
              <div className="hx-governance-info">
                <h4>Validation Workflow</h4>
                <p>{data.governance.workflow}</p>
                <div className="hx-alert hx-alert-info" style={{ marginTop: '16px' }}>
                  Entered grades go through an administrative validation cycle before being published to students.
                </div>
              </div>
            ) : <p>No governance information available.</p>}
          </div>
        </section>
      )}
    </>
  );
}
