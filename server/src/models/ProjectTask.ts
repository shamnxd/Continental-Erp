import { Schema, model, Document } from "mongoose";
import { IProjectTask } from "../interfaces/models/IProjectTask";

export interface IProjectTaskDocument extends Document, Omit<IProjectTask, "id" | "projectRef" | "assignedStaffId"> {
  projectRef: Schema.Types.ObjectId;
  assignedStaffId?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const projectTaskSchema = new Schema<IProjectTaskDocument>(
  {
    projectRef: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "Review", "Completed"],
      required: true,
      default: "Todo"
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      required: true,
      default: "Medium"
    },
    assignedStaffId: { type: Schema.Types.ObjectId, ref: "Staff", default: null },
    assignedTo: { type: String, default: "", trim: true },
    dueDate: { type: Date, default: null },
    completedWorkNotes: { type: String, default: "", trim: true }
  },
  { timestamps: true }
);

export const ProjectTaskModel = model<IProjectTaskDocument>("ProjectTask", projectTaskSchema);
