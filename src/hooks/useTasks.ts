/* filepath: /d:/Personal/NAVER/web-track-naver-vietnam-ai-hackathon-KiyoshiKoii/src/hooks/useTasks.ts */
import { useState, useEffect } from 'react';
import type { Task } from '../types/Task';
import { taskStorage } from '../utils/storage';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    try {
      const loadedTasks = taskStorage.load();
      setTasks(loadedTasks);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to storage changes (cross-tab sync)
  useEffect(() => {
    const unsubscribe = taskStorage.subscribe((updatedTasks) => {
      setTasks(updatedTasks);
    });

    return unsubscribe;
  }, []);

  // Save tasks whenever they change
  useEffect(() => {
    if (!isLoading) {
      const success = taskStorage.save(tasks);
      if (!success) {
        setError('Failed to save tasks');
      } else {
        setError(null);
      }
    }
  }, [tasks, isLoading]);

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setTasks(prev => [...prev, newTask]);
      setError(null);
    } catch (err) {
      setError('Failed to add task');
      console.error('Failed to add task:', err);
    }
  };

  const updateTask = (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    try {
      setTasks(prevTasks => {
        const newTasks = prevTasks.map(task => {
          if (task.id === id) {
            const finalUpdates = { ...updates };
            // Đảm bảo dueDate luôn là đối tượng Date
            if (typeof finalUpdates.dueDate === 'string') {
              finalUpdates.dueDate = new Date(finalUpdates.dueDate);
            }

            const updatedTask = { ...task, ...finalUpdates, updatedAt: new Date() };

            // Logic kiểm tra hoàn thành đúng hạn (giữ nguyên)
            if (updates.status === 'completed' && task.status !== 'completed') {
              const completionTime = updatedTask.updatedAt;
              const dueDate = new Date(task.dueDate);
              updatedTask.isCompletedOnTime = completionTime <= dueDate;
            }

            return updatedTask;
          }
          return task;
        });
        return newTasks;
      });
      setError(null);
    } catch (err) {
      setError('Failed to update task');
      console.error('Failed to update task:', err);
    }
  };

  const deleteTask = (id: string) => {
    try {
      setTasks(prev => prev.filter(task => task.id !== id));
      setError(null);
    } catch (err) {
      setError('Failed to delete task');
      console.error('Failed to delete task:', err);
    }
  };

  const clearAllTasks = () => {
    try {
      setTasks([]);
      taskStorage.clear();
      setError(null);
    } catch (err) {
      setError('Failed to clear tasks');
      console.error('Failed to clear tasks:', err);
    }
  };

  const exportTasks = () => {
    try {
      return taskStorage.export();
    } catch (err) {
      setError('Failed to export tasks');
      console.error('Failed to export tasks:', err);
      throw err;
    }
  };

  const importTasks = (data: string) => {
    try {
      const result = taskStorage.import(data);
      if (result.success) {
        setTasks(taskStorage.load());
        setError(null);
      } else {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMsg = 'Failed to import tasks';
      setError(errorMsg);
      console.error('Failed to import tasks:', err);
      return { success: false, message: errorMsg, tasksCount: 0 };
    }
  };

  return { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask,
    clearAllTasks,
    exportTasks,
    importTasks,
    isLoading,
    error,
    storageInfo: taskStorage.getInfo()
  };
};