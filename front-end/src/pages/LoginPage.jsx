/**
 * Page de Connexion (Login)
 * Gère l'authentification classique et Google OAuth2
 */
import React from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import HorizonLogo from "../assets/Horizon.png";
import { getCurrentUser, isAuthenticated, login, loginWithGoogle, saveSession } from "../api/auth.js";

export function LoginPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = React.useState(false); // État de chargement
  const [errorMessage, setErrorMessage] = React.useState(""); // Erreur générale
  const [fieldErrors, setFieldErrors] = React.useState({}); // Erreurs par champ
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID; // Client ID Google récupéré du .env
  const googleButtonRef = React.useRef(null);

  // Redirection si l'utilisateur est déjà connecté
  const currentUser = getCurrentUser();
  if (isAuthenticated() && currentUser?.role) {
    return <Navigate to={`/${currentUser.role}`} replace />;
  }

  /**
   * Initialisation de Google Identity Services (GSI)
   */
  React.useEffect(() => {
    if (!googleClientId) return;

    const renderButton = () => {
      if (!googleButtonRef.current) return;
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          setErrorMessage("");
          try {
            setIsSubmitting(true);
            // Appel API pour valider le token Google
            const data = await loginWithGoogle(response.credential);
            // Sauvegarde de la session
            saveSession({ token: data.token, user: data.user }, true);
            // Redirection selon le rôle
            navigate(`/${data.user?.role || "student"}`);
          } catch (err) {
            setErrorMessage(err.message || "Google sign-in failed");
          } finally {
            setIsSubmitting(false);
          }
        },
      });

      // Rendu du bouton Google officiel
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: "100%",
      });
    };

    // Chargement dynamique du script Google GSI si non présent
    if (window.google?.accounts?.id) {
      renderButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    document.body.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [googleClientId, navigate]);

  /**
   * Validation des champs du formulaire
   */
  const validate = ({ email, password, role }) => {
    const errors = {};

    if (!["admin", "teacher", "student"].includes(role)) {
      errors.role = "Please select a valid role.";
    }

    // Validation de l'email institutionnel
    if (!email || !/^[^\s@]+@horizon-university\.tn$/.test(email)) {
      errors.email = "Please enter a valid institutional email (@horizon-university.tn).";
    }

    if (!password || password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    return errors;
  };

  /**
   * Message d'information si Google Login n'est pas configuré
   */
  const handleGoogleSetupClick = () => {
    alert("Google Sign-in is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.");
  };

  /**
   * Gestion de la soumission du formulaire classique
   */
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

    // Validation avant envoi
    const errors = validate(payload);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      // Appel API de login
      const response = await login(payload);
      // Sauvegarde du token et des infos user
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
      // Redirection
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
              <div style={{ marginBottom: 14 }}>
                {googleClientId ? (
                  <div ref={googleButtonRef} />
                ) : (
                  <button type="button" className="hx-google-button" onClick={handleGoogleSetupClick}>
                    <svg className="hx-google-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.68 1.22 9.16 3.22l6.82-6.82C35.86 2.34 30.39 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.93 6.16C12.33 13.3 17.7 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.15 24.5c0-1.57-.14-3.07-.41-4.5H24v8.51h12.43c-.54 2.86-2.16 5.29-4.61 6.93l7.43 5.77C43.56 37.33 46.15 31.4 46.15 24.5z"/>
                      <path fill="#FBBC05" d="M10.49 28.62A14.5 14.5 0 0 1 9.73 24c0-1.6.28-3.15.76-4.62l-7.93-6.16A23.93 23.93 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.93-6.16z"/>
                      <path fill="#34A853" d="M24 48c6.39 0 11.86-2.11 15.82-5.79l-7.43-5.77c-2.06 1.38-4.7 2.19-8.39 2.19-6.3 0-11.67-3.8-13.51-9.88l-7.93 6.16C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Continue with Google
                  </button>
                )}
              </div>
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
                  placeholder="name@horizon-university.tn"
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

              <div className="hx-form-row-inline">
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
