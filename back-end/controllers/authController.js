/**
 * Contrôleur pour la gestion de l'authentification
 */
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "horizonexam-dev-secret";

/**
 * Login classique avec Email et Mot de passe
 */
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    
    // Recherche de l'utilisateur par email
    const user = await User.findOne({ where: { email: normalizedEmail } });
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Vérification du rôle (admin, student, teacher)
    if (user.role !== role) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Vérification du mot de passe (hashé avec bcrypt ou texte brut pour tests)
    const passwordMatches = user.password.startsWith("$2")
      ? await bcrypt.compare(password, user.password)
      : user.password === password;

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Génération du token JWT
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
      expiresIn: "8h",
    });

    // Envoi de la réponse avec le token et les infos utilisateur
    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, class: user.class },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Login via Google OAuth2
 */
exports.googleLogin = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(501).json({ message: "Google login is not configured" });
    }

    const client = new OAuth2Client(clientId);
    // Vérification du token envoyé par le frontend
    const ticket = await client.verifyIdToken({
      idToken: req.body.credential,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const emailVerified = Boolean(payload?.email_verified);

    if (!email || !emailVerified) return res.status(401).json({ message: "Google account not verified" });
    
    const normalizedEmail = String(email).trim().toLowerCase();
    
    // Restriction aux emails institutionnels uniquement
    if (!normalizedEmail.endsWith("@horizon-university.tn")) {
      return res.status(403).json({ message: "Institutional email is required (@horizon-university.tn)" });
    }

    // L'utilisateur doit déjà exister dans notre base
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) return res.status(401).json({ message: "User is not registered" });

    // Génération du token JWT suite au succès Google
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, {
      expiresIn: "8h",
    });

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, class: user.class },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Récupérer les informations de l'utilisateur connecté (via Token)
 */
exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "role", "class", "semester"],
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};
