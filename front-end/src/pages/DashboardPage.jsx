import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getCurrentUser } from "../api/auth";
import { apiRequest } from "../api/client";

export function DashboardPage() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    student: null,
    grades: [],
    absences: [],
    sessions: [],
    correctionRequests: [],
    summary: {
      average: 0,
      semester1Average: 0,
      semester2Average: 0,
      finalAverage: 0,
      finalStatus: "-",
      absencesCount: 0,
      sessionsCount: 0,
    },
  });

  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [correctionReason, setCorrectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const [payload, requestsPayload] = await Promise.all([
        apiRequest(`/api/student/dashboard-data/${user.id}`),
        apiRequest(`/api/student/correction-requests`)
      ]);
      
      setData({
        student: payload.student || null,
        grades: payload.grades || [],
        absences: payload.absences || [],
        sessions: payload.sessions || [],
        correctionRequests: requestsPayload?.requests || [], // Added optional chaining
        summary: payload.summary || data.summary,
      });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGrade || !correctionReason) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest("/api/student/correction-requests", {
        method: "POST",
        body: JSON.stringify({
          resultId: selectedGrade.id,
          reason: correctionReason
        })
      });
      setShowCorrectionModal(false);
      setCorrectionReason("");
      setSelectedGrade(null);
      loadData(); // Refresh data to show the new request
      alert("Correction request submitted successfully to administration.");
    } catch (err) {
      alert(err.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDashboard = location.pathname === "/student" || location.pathname === "/student/";
  const isGrades = location.pathname.includes("/grades");
  const isAbsences = location.pathname.includes("/absences");
  const isTimetable = location.pathname.includes("/timetable");

  return (
    <>
      {error ? <div className="hx-alert hx-alert-error">{error}</div> : null}

      {isDashboard && (
        <div className="hx-stats-grid">
          <article className="hx-stat-card">
            <div className="hx-stat-header">
              <span className="hx-stat-icon">📈</span>
              <span className="hx-stat-label">Semester 1</span>
            </div>
            <div className="hx-stat-value hx-text-primary">{Number(data.summary.semester1Average || 0).toFixed(2)}</div>
          </article>
          <article className="hx-stat-card">
            <div className="hx-stat-header">
              <span className="hx-stat-icon">📈</span>
              <span className="hx-stat-label">Semester 2</span>
            </div>
            <div className="hx-stat-value hx-text-primary">{Number(data.summary.semester2Average || 0).toFixed(2)}</div>
          </article>
          <article className="hx-stat-card hx-stat-info">
            <div className="hx-stat-header">
              <span className="hx-stat-icon">🏁</span>
              <span className="hx-stat-label">Final Average</span>
            </div>
            <div className="hx-stat-value hx-text-primary">{Number(data.summary.finalAverage ?? data.summary.average ?? 0).toFixed(2)}</div>
          </article>
          <article className="hx-stat-card">
            <div className="hx-stat-header">
              <span className="hx-stat-icon">✅</span>
              <span className="hx-stat-label">Final Status</span>
            </div>
            <div className="hx-stat-value">{data.summary.finalStatus || "-"}</div>
          </article>
          <article className="hx-stat-card hx-stat-warning">
            <div className="hx-stat-header">
              <span className="hx-stat-icon">⚠️</span>
              <span className="hx-stat-label">Absences</span>
            </div>
            <div className="hx-stat-value">{data.summary.absencesCount}</div>
          </article>
          <article className="hx-stat-card hx-stat-info">
            <div className="hx-stat-header">
              <span className="hx-stat-icon">📅</span>
              <span className="hx-stat-label">Scheduled Sessions</span>
            </div>
            <div className="hx-stat-value">{data.summary.sessionsCount}</div>
          </article>
        </div>
      )}

      {(isDashboard || isGrades) && (
        <section className="hx-panel">
          <div className="hx-panel-header">
            <div className="hx-panel-title">
              <h3>My Grades</h3>
              <p className="hx-panel-subtitle">View your results by subject</p>
            </div>
          </div>
          <div className="hx-table-container">
            <table className="hx-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Semester</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.grades.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="hx-table-empty">
                      {isLoading ? "Loading..." : "No grades available."}
                    </td>
                  </tr>
                ) : (
                  data.grades.map((item) => {
                    const existingRequest = data.correctionRequests.find(r => r.result_id === item.id);
                    return (
                      <tr key={item.id}>
                        <td><strong>{item.subject}</strong></td>
                        <td><span className="hx-badge hx-badge-info">{item.examType}</span></td>
                        <td>{item.examDate}</td>
                        <td>S{item.semester}</td>
                        <td><strong className="hx-text-primary">{item.grade}</strong></td>
                        <td>
                          <span className={`hx-badge ${item.status === 'Published' ? 'hx-badge-success' : 'hx-badge-warning'}`}>
                            {item.status === 'Published' ? 'Published' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          {item.status === 'Published' && (
                            existingRequest ? (
                              <span className={`hx-badge ${existingRequest.status === 'Pending' ? 'hx-badge-warning' : existingRequest.status === 'Accepted' ? 'hx-badge-success' : 'hx-badge-danger'}`}>
                                {existingRequest.status === 'Pending' ? 'Correction Pending' : `Correction ${existingRequest.status}`}
                              </span>
                            ) : (
                              <button 
                                className="hx-button hx-btn-sm hx-btn-outline"
                                onClick={() => {
                                  setSelectedGrade(item);
                                  setShowCorrectionModal(true);
                                }}
                              >
                                Report
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Double Correction Modal */}
      {showCorrectionModal && (
        <div className="hx-modal-overlay">
          <div className="hx-modal">
            <div className="hx-modal-header">
              <h3>Request Double Correction</h3>
              <button className="hx-modal-close" onClick={() => setShowCorrectionModal(false)}>&times;</button>
            </div>
            <div className="hx-modal-body">
              <p>Subject: <strong>{selectedGrade?.subject}</strong> | Grade: <strong>{selectedGrade?.grade}</strong></p>
              <form onSubmit={handleCorrectionSubmit}>
                <div className="hx-form-group">
                  <label className="hx-label">Reason for request</label>
                  <textarea 
                    className="hx-input" 
                    rows="4" 
                    placeholder="Explain why you are requesting a double correction (min 10 characters)..."
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    required
                  ></textarea>
                </div>
                <div className="hx-modal-footer">
                  <button type="button" className="hx-button hx-btn-secondary" onClick={() => setShowCorrectionModal(false)}>Cancel</button>
                  <button type="submit" className="hx-button" disabled={isSubmitting || correctionReason.length < 10}>
                    {isSubmitting ? "Submitting..." : "Send to Administration"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {(isDashboard || isAbsences) && (
        <section className="hx-panel">
          <div className="hx-panel-header">
            <h3>My Absences</h3>
          </div>
          <div className="hx-absence-list">
            {data.absences.length === 0 ? (
              <div className="hx-table-empty">No absences recorded.</div>
            ) : (
              data.absences.map((item) => (
                <div key={item.id} className="hx-absence-item">
                  <div className="hx-absence-info">
                    <strong>{item.subject}</strong>
                    <p className="hx-text-muted">{item.date}</p>
                  </div>
                  <span className="hx-badge hx-badge-danger">Absent</span>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {(isDashboard || isTimetable) && (
        <section className="hx-panel">
          <div className="hx-panel-header">
            <h3>Exam Timetable</h3>
          </div>
          <div className="hx-table-container">
            <table className="hx-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Room</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="hx-table-empty">No sessions scheduled.</td>
                  </tr>
                ) : (
                  data.sessions.map((session) => (
                    <tr key={session.id}>
                      <td><strong>{session.subject}</strong></td>
                      <td>{session.examDate}</td>
                      <td>{session.startTime} - {session.endTime}</td>
                      <td><span className="hx-badge hx-badge-info">{session.room}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
