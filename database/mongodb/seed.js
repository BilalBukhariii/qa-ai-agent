// Run with: node database/mongodb/seed.js
// Populates a local MongoDB with sample tickets and test cases.
import mongoose from "../../backend/node_modules/mongoose/index.js";
import dotenv from "../../backend/node_modules/dotenv/lib/main.js";
import Ticket from "../../backend/models/Ticket.js";
import TestCase from "../../backend/models/TestCase.js";
import User from "../../backend/models/User.js";

dotenv.config({ path: "../../backend/.env" });

const run = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/qa_ai_agent";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
  } catch (err) {
    console.warn(`Primary connection failed (${err.message}). Seeding on MongoMemoryServer fallback...`);
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: "qa_ai_agent" });
  }

  await User.deleteMany({ email: "admin@example.com" });
  const admin = await User.create({
    name: "Admin",
    email: "admin@example.com",
    password: "Passw0rd!",
    role: "admin",
  });

  const ticket = await Ticket.create({
    title: "User cannot reset password",
    description: "Password reset email is never received.",
    type: "bug",
    priority: "high",
    status: "in_progress",
    assignee: admin.name,
  });

  await TestCase.create({
    ticket: ticket._id,
    module: "Authentication",
    title: "Verify password reset email is sent",
    precondition: "User has a registered account",
    priority: "high",
    severity: "high",
    steps: [
      "Navigate to login page",
      "Click 'Forgot password'",
      "Enter registered email",
      "Submit form",
    ],
    expectedResult: "Reset email arrives within 60 seconds",
    status: "not_run",
    automationCandidate: true,
  });

  console.log("Seed complete");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
