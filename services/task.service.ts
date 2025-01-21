import TaskModel from '../models/task.model';
import { UserDocument } from '../models/user.model';
import { logger } from '../utils/logger/loggerUtil';

// Service to create a new task
export const createTask = async (
  taskName: string,
  description: string,
  userId: string
) => {
  try {
    const task = await TaskModel.create({ taskName, description, userId });
    return task.toObject();
  } catch (error) {
    logger.error('Error creating task:', error);
    throw new Error('Error creating task');
  }
};

// Service to get all tasks for a user
export const getUserTasks = async (userId: string) => {
  try {
    const tasks = await TaskModel.find({ userId });

    const groupedTasks = {
      Pending: tasks.filter((task) => task.status === 'Pending'),
      Completed: tasks.filter((task) => task.status === 'Completed'),
      Done: tasks.filter((task) => task.status === 'Done'),
    };

    return groupedTasks;
  } catch (error) {
    logger.error('Error fetching tasks:', error);
    throw new Error('Error fetching tasks');
  }
};

// Service to update a task's status
export const updateTaskStatus = async (taskId: string, status: string) => {
  try {
    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      { status },
      { new: true }
    );
    return updatedTask;
  } catch (error) {
    logger.error('Error updating task status:', error);
    throw new Error('Error updating task status');
  }
};

// Service to delete a task
export const deleteTask = async (taskId: string) => {
  try {
    const deletedTask = await TaskModel.findByIdAndDelete(taskId);
    return deletedTask;
  } catch (error) {
    logger.error('Error deleting task:', error);
    throw new Error('Error deleting task');
  }
};
