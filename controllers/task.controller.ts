import { Request, Response } from 'express';
import * as TaskService from '../services/task.service';
import { HTTP_STATUS_CODE } from '../utils/const/constants';

export const createTaskHandler = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { taskName, description } = req.body;

    // Access the user from res.locals
    const userId = res.locals.user?.data._id;

    if (!userId) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        message: 'User not authenticated',
      });
    }

    // Call service to create a task
    const task = await TaskService.createTask(taskName, description, userId);
    return res.status(HTTP_STATUS_CODE.CREATED).json(task);
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      message: 'Failed to create task',
      error: error.message,
    });
  }
};

export const getTasksHandler = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    // Access the user from res.locals
    const userId = res.locals.user?.data._id;

    if (!userId) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        message: 'User not authenticated',
      });
    }

    // Call service to get user tasks
    const tasks = await TaskService.getUserTasks(userId);
    return res.status(HTTP_STATUS_CODE.OK).json(tasks);
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      message: 'Failed to fetch tasks',
      error: error.message,
    });
  }
};

export const updateTaskHandler = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    // Call service to update task status
    const updatedTask = await TaskService.updateTaskStatus(taskId, status);

    return res.status(HTTP_STATUS_CODE.OK).json(updatedTask);
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      message: 'Failed to update task status',
      error: error.message,
    });
  }
};

export const deleteTaskHandler = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { taskId } = req.params;

    // Call service to delete task
    const deletedTask = await TaskService.deleteTask(taskId);

    return res.status(HTTP_STATUS_CODE.OK).json(deletedTask);
  } catch (error) {
    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER).json({
      message: 'Failed to delete task',
      error: error.message,
    });
  }
};
