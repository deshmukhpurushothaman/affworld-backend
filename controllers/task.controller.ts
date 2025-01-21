import { Request, Response } from 'express';
import TaskModel from '../models/task.model';

// Create a new task
export const createTaskHandler = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { taskName, description } = req.body;
    const userId = res.locals.user?.data._id;

    if (!userId) {
      return res.status(400).json({ message: 'User not authenticated' });
    }

    const task = await TaskModel.create({ userId, taskName, description });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task', error });
  }
};

// Get all tasks grouped by status
export const getTasksHandler = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = res.locals.user?.data._id;

    if (!userId) {
      return res.status(400).json({ message: 'User not authenticated' });
    }

    const tasks = await TaskModel.find({ userId });

    const groupedTasks = {
      Pending: tasks.filter((task) => task.status === 'Pending'),
      Completed: tasks.filter((task) => task.status === 'Completed'),
      Done: tasks.filter((task) => task.status === 'Done'),
    };

    res.status(200).json(groupedTasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error });
  }
};

// Update task status
export const updateTaskStatusHandler = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Completed', 'Done'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await TaskModel.findByIdAndUpdate(
      taskId,
      { status },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task status', error });
  }
};

// Delete a task
export const deleteTaskHandler = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { taskId } = req.params;

    const task = await TaskModel.findByIdAndDelete(taskId);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task', error });
  }
};
