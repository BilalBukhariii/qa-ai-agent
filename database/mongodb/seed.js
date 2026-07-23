// Run with: node database/mongodb/seed.js
// Populates a local MongoDB with sample tickets and test cases.
import mongoose from "mongoose";
import dotenv from "dotenv";
import Ticket from "../../backend/models/Ticket.js";
import TestCase from "../../backend/models/TestCase.js";
import User from "../../backend/models/User.js";

dotenv.config({ path: "../../.env" });

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const admin = await User.findOneAndUpdate(
    { email: "admin@example.com" },
    { name: "Admin", email: "admin@example.com", password: "Passw0rd!", role: "admin" },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

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
