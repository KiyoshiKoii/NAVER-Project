/* filepath: /d:/Personal/NAVER/web-track-naver-vietnam-ai-hackathon-KiyoshiKoii/src/types/Task.ts */
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: Date;
  estimatedTime: number; 
  actualTime?: number; 
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  isCompletedOnTime?: boolean; 
}
export interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
}