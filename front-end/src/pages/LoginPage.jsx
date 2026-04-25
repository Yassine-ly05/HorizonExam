import React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import HorizonLogo from "../assets/Horizon.png";
import { getCurrentUser, isAuthenticated, login, saveSession } from "../api/auth.js";

export function LoginPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState({});

  const currentUser = getCurrentUser();
  if (isAuthenticated() && currentUser?.role) {
    return <Navigate to={`/${currentUser.role}`} replace />;
  }

  const validate = ({ email, password, role }) => {
    const errors = {};

    if (!["admin", "teacher", "student"].includes(role)) {
      errors.role = "Please select a valid role.";
    }

    if (!email || !/^[^\s@]+@horizon\.tn$/.test(email)) {
      errors.email = "Please enter a valid institutional email (@horizon.tn).";
    }

    if (!password || password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || ""),
      role: String(formData.get("role") || ""),
      remember: formData.get("remember") === "on",
    };

    const errors = validate(payload);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await login(payload);
      saveSession(
        {
          token: response.token,
          user: {
            ...(response.user || {}),
            email: response.user?.email || payload.email,
            role: response.user?.role || payload.role,
          },
        },
        payload.remember,
      );
      navigate(`/${response.user?.role || payload.role}`);
    } catch (error) {
      setErrorMessage(
        error.message ||
          "We could not sign you in right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="hx-page">
      <div className="hx-page-inner">
        <header className="hx-brand-strip">
          <div className="hx-brand-left">
            <img
              src={HorizonLogo}
              alt="Horizon School of Digital Technologies"
              className="hx-logo"
            />
            <div className="hx-brand-text">
              <span className="hx-brand-name">HorizonExam</span>
              <span className="hx-brand-subtitle">
                Examination Management Platform
              </span>
            </div>
          </div>
          <span className="hx-academic-year">Academic Year 2025–2026</span>
        </header>

        <main className="hx-layout">
          <section className="hx-panel hx-panel--info">
            <span className="hx-pill">Official Horizon Portal</span>
            <h1 className="hx-heading">Secure access for exams and results</h1>
            <p className="hx-body">
              HorizonExam centralizes exam sessions, grades, and attendance for
              the Horizon School of Digital Technologies. Access is reserved for{" "}
              <strong>students</strong>, <strong>teachers</strong>, and the{" "}
              <strong>examination office</strong>.
            </p>
            <ul className="hx-feature-list">
              <li>Institutional single-sign-on ready</li>
              <li>
                Role-based access for administrators, teachers, and students
              </li>
              <li>Secure handling of grades, attendance, and exam archives</li>
            </ul>
            <p className="hx-footnote">
              By signing in you agree to comply with Horizon&apos;s academic
              integrity and data protection policies.
            </p>
            <div className="hx-trust-row" aria-label="Security and compliance indicators">
              <span className="hx-trust-item">Encrypted access</span>
              <span className="hx-trust-item">Role-based control</span>
              <span className="hx-trust-item">Academic compliance</span>
            </div>
          </section>

          <section className="hx-panel hx-panel--form" aria-label="Login form">
            <h2 className="hx-panel-title">Sign in to HorizonExam</h2>
            <p className="hx-panel-subtitle">
              Use your institutional credentials to continue.
            </p>

            <form className="hx-form" onSubmit={handleSubmit} noValidate>
              <div className="hx-field">
                <label htmlFor="role" className="hx-label">
                  I am
                </label>
                <select
                  id="role"
                  name="role"
                  className="hx-select"
                  defaultValue="student"
                  required
                >
                  <option value="admin">Administrator</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
                {fieldErrors.role ? (
                  <span className="hx-field-error">{fieldErrors.role}</span>
                ) : null}
              </div>

              <div className="hx-field">
                <label htmlFor="email" className="hx-label">
                  Institutional email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@horizon.tn"
                  autoComplete="email"
                  className="hx-input"
                  required
                />
                {fieldErrors.email ? (
                  <span className="hx-field-error">{fieldErrors.email}</span>
                ) : null}
              </div>

              <div className="hx-field">
                <label htmlFor="password" className="hx-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="********"
                  autoComplete="current-password"
                  className="hx-input"
                  required
                />
                {fieldErrors.password ? (
                  <span className="hx-field-error">{fieldErrors.password}</span>
                ) : null}
              </div>

              <div className="hx-form-row">
                <label className="hx-checkbox">
                  <input type="checkbox" name="remember" />
                  <span>Remember this device</span>
                </label>
                <Link to="/forgot-password" className="hx-link-button">
                  Forgot password?
                </Link>
              </div>

              {errorMessage ? (
                <p className="hx-error-message" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <button type="submit" className="hx-button" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>

              <p className="hx-helper">
                Having trouble signing in? Contact the Examination Office.
              </p>
            </form>
          </section>
        </main>

        <footer className="hx-footer">
          <span>
            © {new Date().getFullYear()} Horizon School of Digital Technologies
          </span>
          <span>HorizonExam &middot; Examination Office</span>
        </footer>
      </div>
    </div>
  );
}
