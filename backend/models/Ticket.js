import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    jiraId: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ["epic", "story", "task", "bug"],
      default: "task",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["backlog", "in_progress", "in_review", "done"],
      default: "backlog",
    },
    assignee: { type: String },
    sprint: { type: String },
    storyPoints: { type: Number },
    acceptanceCriteria: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);
