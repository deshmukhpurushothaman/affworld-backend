import mongoose, { Schema, Document } from 'mongoose';

export interface TaskDocument extends Document {
  userId: string; // User who created the task
  taskName: string;
  description: string;
  status: 'Pending' | 'Completed' | 'Done';
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    taskName: { type: String, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Done'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

const TaskModel = mongoose.model<TaskDocument>('Task', TaskSchema);
export default TaskModel;
