/* filepath: /d:/Personal/NAVER/web-track-naver-vietnam-ai-hackathon-KiyoshiKoii/src/utils/storage.ts */
import type { Task } from '../types/Task';

// Storage configuration
const STORAGE_CONFIG = {
  TASKS_KEY: 'student-tasks',
  VERSION_KEY: 'student-tasks-version',
  CURRENT_VERSION: '1.0.0',
  BACKUP_PREFIX: 'student-tasks-backup-',
  MAX_BACKUPS: 5,
} as const;

// Storage data structure
interface StorageData {
  version: string;
  tasks: Task[];
  metadata: {
    lastModified: string;
    totalTasks: number;
    createdAt: string;
  };
}

// Migration interface
interface Migration {
  version: string;
  migrate: (data: any) => any;
  description: string;
}

// Available migrations
const MIGRATIONS: Migration[] = [
  {
    version: '1.0.0',
    description: 'Initial version with metadata support',
    migrate: (oldData: Task[]) => {
      // Convert old array format to new structured format
      if (Array.isArray(oldData)) {
        return {
          version: '1.0.0',
          tasks: oldData.map(task => ({
            ...task,
            dueDate: new Date(task.dueDate),
            createdAt: new Date(task.createdAt),
            updatedAt: new Date(task.updatedAt),
          })),
          metadata: {
            lastModified: new Date().toISOString(),
            totalTasks: oldData.length,
            createdAt: new Date().toISOString(),
          }
        };
      }
      return oldData;
    }
  }
];

class TaskStorage {
  private storageKey = STORAGE_CONFIG.TASKS_KEY;
  private versionKey = STORAGE_CONFIG.VERSION_KEY;
  private listeners: Array<(tasks: Task[]) => void> = [];
  private syncChannel?: BroadcastChannel;

  constructor() {
    this.initSyncChannel();
    this.runMigrations();
  }

  // Initialize cross-tab sync
  private initSyncChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.syncChannel = new BroadcastChannel('task-storage-sync');
      this.syncChannel.addEventListener('message', (event) => {
        if (event.data.type === 'TASKS_UPDATED') {
          this.notifyListeners(event.data.tasks);
        }
      });
    }

    // Fallback for storage event (less reliable but works)
    window.addEventListener('storage', (event) => {
      if (event.key === this.storageKey && event.newValue) {
        try {
          const data = this.parseStorageData(event.newValue);
          this.notifyListeners(data.tasks);
        } catch (error) {
          console.warn('Failed to sync storage changes:', error);
        }
      }
    });
  }

  // Subscribe to storage changes
  subscribe(callback: (tasks: Task[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  private notifyListeners(tasks: Task[]) {
    this.listeners.forEach(callback => callback(tasks));
  }

  // Broadcast changes to other tabs
  private broadcast(tasks: Task[]) {
    if (this.syncChannel) {
      this.syncChannel.postMessage({
        type: 'TASKS_UPDATED',
        tasks,
        timestamp: Date.now()
      });
    }
  }

  // Run migrations if needed
  private runMigrations() {
    try {
      const currentVersion = localStorage.getItem(this.versionKey);
      const rawData = localStorage.getItem(this.storageKey);

      if (!rawData) return;

      let data = JSON.parse(rawData);
      
      // Check if migration is needed
      if (!currentVersion || currentVersion !== STORAGE_CONFIG.CURRENT_VERSION) {
        console.log('🔄 Running storage migrations...');
        
        // Create backup before migration
        this.createBackup();
        
        // Run migrations
        for (const migration of MIGRATIONS) {
          data = migration.migrate(data);
          console.log(`✅ Applied migration: ${migration.description}`);
        }

        // Save migrated data
        localStorage.setItem(this.storageKey, JSON.stringify(data));
        localStorage.setItem(this.versionKey, STORAGE_CONFIG.CURRENT_VERSION);
        
        console.log('🎉 Migration completed successfully!');
      }
    } catch (error) {
      console.error('❌ Migration failed:', error);
      this.restoreFromBackup();
    }
  }

  // Parse storage data with error handling
  private parseStorageData(raw: string): StorageData {
    const data = JSON.parse(raw);
    
    // Handle legacy format (direct array)
    if (Array.isArray(data)) {
      return MIGRATIONS[0].migrate(data);
    }
    
    // Modern format
    return {
      ...data,
      tasks: data.tasks.map((task: any) => ({
        ...task,
        dueDate: new Date(task.dueDate),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      }))
    };
  }

  // Load tasks from storage
  load(): Task[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];

      const data = this.parseStorageData(raw);
      return data.tasks;
    } catch (error) {
      console.error('Failed to load tasks:', error);
      return [];
    }
  }

  // Save tasks to storage
  save(tasks: Task[]): boolean {
    try {
      const data: StorageData = {
        version: STORAGE_CONFIG.CURRENT_VERSION,
        tasks,
        metadata: {
          lastModified: new Date().toISOString(),
          totalTasks: tasks.length,
          createdAt: this.getCreatedAt()
        }
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));
      localStorage.setItem(this.versionKey, STORAGE_CONFIG.CURRENT_VERSION);
      
      // Broadcast to other tabs
      this.broadcast(tasks);
      
      return true;
    } catch (error) {
      console.error('Failed to save tasks:', error);
      return false;
    }
  }

  // Get creation date from existing data or use current date
  private getCreatedAt(): string {
    try {
      const existing = localStorage.getItem(this.storageKey);
      if (existing) {
        const data = JSON.parse(existing);
        return data.metadata?.createdAt || new Date().toISOString();
      }
    } catch (error) {
      // Ignore error
    }
    return new Date().toISOString();
  }

  // Create backup
  createBackup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupKey = `${STORAGE_CONFIG.BACKUP_PREFIX}${timestamp}`;
    
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        localStorage.setItem(backupKey, data);
        this.cleanupOldBackups();
        console.log(`📦 Backup created: ${backupKey}`);
        return backupKey;
      }
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
    return '';
  }

  // Cleanup old backups
  private cleanupOldBackups() {
    try {
      const backups = Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_CONFIG.BACKUP_PREFIX))
        .sort()
        .reverse();

      if (backups.length > STORAGE_CONFIG.MAX_BACKUPS) {
        const toDelete = backups.slice(STORAGE_CONFIG.MAX_BACKUPS);
        toDelete.forEach(key => localStorage.removeItem(key));
        console.log(`🧹 Cleaned up ${toDelete.length} old backups`);
      }
    } catch (error) {
      console.error('Failed to cleanup backups:', error);
    }
  }

  // Restore from latest backup
  restoreFromBackup(): boolean {
    try {
      const backups = Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_CONFIG.BACKUP_PREFIX))
        .sort()
        .reverse();

      if (backups.length > 0) {
        const latestBackup = localStorage.getItem(backups[0]);
        if (latestBackup) {
          localStorage.setItem(this.storageKey, latestBackup);
          console.log(`🔄 Restored from backup: ${backups[0]}`);
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to restore from backup:', error);
    }
    return false;
  }

  // Export data
  export(): { data: string; filename: string } {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const data = raw ? this.parseStorageData(raw) : { tasks: [], metadata: {} };
      
      const exportData = {
        ...data,
        exportedAt: new Date().toISOString(),
        version: STORAGE_CONFIG.CURRENT_VERSION
      };

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `tasks-backup-${timestamp}.json`;
      
      return {
        data: JSON.stringify(exportData, null, 2),
        filename
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      throw new Error('Export failed');
    }
  }

  // Import data
  import(jsonData: string): { success: boolean; message: string; tasksCount: number } {
    try {
      // Create backup before import
      this.createBackup();
      
      const importData = JSON.parse(jsonData);
      
      // Validate import data
      if (!importData.tasks || !Array.isArray(importData.tasks)) {
        throw new Error('Invalid import format: missing tasks array');
      }

      // Validate task structure
      const validTasks = importData.tasks.filter((task: any) => 
        task.id && task.title && task.dueDate
      );

      if (validTasks.length === 0) {
        throw new Error('No valid tasks found in import data');
      }

      // Convert dates and save
      const tasks: Task[] = validTasks.map((task: any) => ({
        ...task,
        dueDate: new Date(task.dueDate),
        createdAt: new Date(task.createdAt || Date.now()),
        updatedAt: new Date(task.updatedAt || Date.now()),
      }));

      const success = this.save(tasks);
      
      if (success) {
        this.notifyListeners(tasks);
        return {
          success: true,
          message: `Successfully imported ${tasks.length} tasks`,
          tasksCount: tasks.length
        };
      } else {
        throw new Error('Failed to save imported data');
      }
    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
        tasksCount: 0
      };
    }
  }

  // Clear all data
  clear(): boolean {
    try {
      // Create backup before clearing
      this.createBackup();
      
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.versionKey);
      
      this.broadcast([]);
      this.notifyListeners([]);
      
      console.log('🗑️ All task data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }

  // Get storage info
  getInfo() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const version = localStorage.getItem(this.versionKey);
      
      if (!raw) {
        return {
          exists: false,
          version: null,
          tasksCount: 0,
          size: 0,
          lastModified: null
        };
      }

      const data = this.parseStorageData(raw);
      const sizeInBytes = new Blob([raw]).size;
      
      return {
        exists: true,
        version: version || 'unknown',
        tasksCount: data.tasks.length,
        size: sizeInBytes,
        sizeFormatted: this.formatBytes(sizeInBytes),
        lastModified: data.metadata?.lastModified || null,
        createdAt: data.metadata?.createdAt || null
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        exists: false,
        version: null,
        tasksCount: 0,
        size: 0,
        lastModified: null
      };
    }
  }

  // Format bytes to human readable
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Cleanup resources
  destroy() {
    if (this.syncChannel) {
      this.syncChannel.close();
    }
    this.listeners = [];
  }
}

// Export singleton instance
export const taskStorage = new TaskStorage();

// Export utility functions
export const exportTasks = () => taskStorage.export();
export const importTasks = (data: string) => taskStorage.import(data);
export const clearAllTasks = () => taskStorage.clear();
export const getStorageInfo = () => taskStorage.getInfo();
export const createBackup = () => taskStorage.createBackup();