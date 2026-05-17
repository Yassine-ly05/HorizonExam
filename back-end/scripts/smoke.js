/* eslint-disable no-console */
const assert = require("assert");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const sequelize = require("../config/db");
const { startServer } = require("../server");

async function request(path, options = {}) {
  const response = await fetch(`${globalThis.__SMOKE_API__}${path}`, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || `Request failed for ${path}`);
  }
  return payload;
}

async function run() {
  const server = await startServer({ port: 0 });
  const address = server.address();
  globalThis.__SMOKE_API__ = process.env.API_URL || `http://localhost:${address.port}`;

  const adminLogin = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || "admin@horizon-university.tn",
      password: process.env.ADMIN_PASSWORD || "admin12345",
      role: "admin",
    }),
  });
  assert(adminLogin.token, "Admin token is required");

  const adminDashboard = await request(`/api/admin/dashboard-data/${adminLogin.user.id}`, {
    headers: { Authorization: `Bearer ${adminLogin.token}` },
  });
  assert(adminDashboard.summary, "Admin summary should exist");

  console.log("Smoke test passed.");

  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
}

run().catch((error) => {
  console.error("Smoke test failed:", error.message);
  process.exit(1);
});
