/* eslint-disable no-console */
const assert = require("assert");

const API = process.env.API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || `Request failed for ${path}`);
  }
  return payload;
}

async function run() {
  const teacherLogin = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "teacher@horizon.edu",
      password: "teacher123",
      role: "teacher",
    }),
  });
  assert(teacherLogin.token, "Teacher token is required");

  const adminLogin = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "admin@horizon.edu",
      password: "admin123",
      role: "admin",
    }),
  });
  assert(adminLogin.token, "Admin token is required");

  const teacherDashboard = await request(`/api/teacher/dashboard-data/${teacherLogin.user.id}`, {
    headers: { Authorization: `Bearer ${teacherLogin.token}` },
  });
  assert(Array.isArray(teacherDashboard.sessions), "Teacher sessions should be an array");

  const adminDashboard = await request(`/api/admin/dashboard-data/${adminLogin.user.id}`, {
    headers: { Authorization: `Bearer ${adminLogin.token}` },
  });
  assert(adminDashboard.summary, "Admin summary should exist");

  console.log("Smoke test passed.");
}

run().catch((error) => {
  console.error("Smoke test failed:", error.message);
  process.exit(1);
});
