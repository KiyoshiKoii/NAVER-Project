/* filepath: /d:/Personal/NAVER/web-track-naver-vietnam-ai-hackathon-KiyoshiKoii/src/utils/categoryStorage.ts */
import type { Category, CategoryStorage } from '../types/Category';

const CATEGORY_CONFIG = {
  STORAGE_KEY: 'student-categories',
  VERSION_KEY: 'student-categories-version',
  CURRENT_VERSION: '1.1.0', // Bump version to trigger migration
} as const;

// Default categories - CHỈ CÓ PERSONAL
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'personal',
    name: 'Personal',
    icon: '👤',
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    createdAt: new Date(),
    isDefault: true
  }
];

class CategoryStorageManager {
  private storageKey = CATEGORY_CONFIG.STORAGE_KEY;
  private versionKey = CATEGORY_CONFIG.VERSION_KEY;
  private listeners: Array<(categories: Category[]) => void> = [];
  private syncChannel?: BroadcastChannel;

  constructor() {
    this.initSyncChannel();
    this.initializeCategories();
  }

  private initSyncChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.syncChannel = new BroadcastChannel('category-storage-sync');
      this.syncChannel.addEventListener('message', (event) => {
        if (event.data.type === 'CATEGORIES_UPDATED') {
          this.notifyListeners(event.data.categories);
        }
      });
    }

    window.addEventListener('storage', (event) => {
      if (event.key === this.storageKey && event.newValue) {
        try {
          const data = this.parseStorageData(event.newValue);
          this.notifyListeners(data.categories);
        } catch (error) {
          console.warn('Failed to sync category changes:', error);
        }
      }
    });
  }

  private initializeCategories() {
    const existing = localStorage.getItem(this.storageKey);
    const currentVersion = localStorage.getItem(this.versionKey);
    
    // If no data exists OR version is outdated, reset to new defaults
    if (!existing || currentVersion !== CATEGORY_CONFIG.CURRENT_VERSION) {
      console.log('Initializing categories with Personal only...');
      this.save(DEFAULT_CATEGORIES);
      localStorage.setItem(this.versionKey, CATEGORY_CONFIG.CURRENT_VERSION);
      return;
    }

    // Check if we need to migrate old default categories
    try {
      const data = this.parseStorageData(existing);
      const hasOldDefaults = data.categories.some(cat => 
        cat.isDefault && ['work', 'study', 'health'].includes(cat.id)
      );

      if (hasOldDefaults) {
        console.log('Migrating old default categories...');
        // Keep only Personal default and any user-created categories
        const migratedCategories = data.categories.filter(cat => {
          // Keep Personal default
          if (cat.id === 'personal' && cat.isDefault) return true;
          // Keep all user-created categories (non-default)
          if (!cat.isDefault) return true;
          // Remove old defaults (work, study, health)
          return false;
        });

        // Ensure Personal exists
        const hasPersonal = migratedCategories.some(cat => cat.id === 'personal');
        if (!hasPersonal) {
          migratedCategories.unshift(DEFAULT_CATEGORIES[0]);
        }

        this.save(migratedCategories);
        localStorage.setItem(this.versionKey, CATEGORY_CONFIG.CURRENT_VERSION);
      }
    } catch (error) {
      console.error('Migration failed, resetting to defaults:', error);
      this.save(DEFAULT_CATEGORIES);
      localStorage.setItem(this.versionKey, CATEGORY_CONFIG.CURRENT_VERSION);
    }
  }

  subscribe(callback: (categories: Category[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  private notifyListeners(categories: Category[]) {
    this.listeners.forEach(callback => callback(categories));
  }

  private broadcast(categories: Category[]) {
    if (this.syncChannel) {
      this.syncChannel.postMessage({
        type: 'CATEGORIES_UPDATED',
        categories,
        timestamp: Date.now()
      });
    }
  }

  private parseStorageData(raw: string): CategoryStorage {
    const data = JSON.parse(raw);
    
    // Handle legacy format or direct array
    if (Array.isArray(data)) {
      return {
        version: CATEGORY_CONFIG.CURRENT_VERSION,
        categories: data.map((cat: any) => ({
          ...cat,
          createdAt: new Date(cat.createdAt)
        })),
        metadata: {
          lastModified: new Date().toISOString(),
          totalCategories: data.length,
          createdAt: new Date().toISOString()
        }
      };
    }
    
    return {
      ...data,
      categories: data.categories.map((cat: any) => ({
        ...cat,
        createdAt: new Date(cat.createdAt)
      }))
    };
  }

  load(): Category[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return DEFAULT_CATEGORIES;

      const data = this.parseStorageData(raw);
      return data.categories;
    } catch (error) {
      console.error('Failed to load categories:', error);
      return DEFAULT_CATEGORIES;
    }
  }

  save(categories: Category[]): boolean {
    try {
      const data: CategoryStorage = {
        version: CATEGORY_CONFIG.CURRENT_VERSION,
        categories,
        metadata: {
          lastModified: new Date().toISOString(),
          totalCategories: categories.length,
          createdAt: this.getCreatedAt()
        }
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));
      localStorage.setItem(this.versionKey, CATEGORY_CONFIG.CURRENT_VERSION);
      
      this.broadcast(categories);
      return true;
    } catch (error) {
      console.error('Failed to save categories:', error);
      return false;
    }
  }

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

  addCategory(category: Omit<Category, 'id' | 'createdAt'>): Category {
    const categories = this.load();
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    const updatedCategories = [...categories, newCategory];
    this.save(updatedCategories);
    this.notifyListeners(updatedCategories);
    
    return newCategory;
  }

  updateCategory(id: string, updates: Partial<Category>): boolean {
    const categories = this.load();
    const updatedCategories = categories.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    );

    const success = this.save(updatedCategories);
    if (success) {
      this.notifyListeners(updatedCategories);
    }
    return success;
  }

  deleteCategory(id: string): boolean {
    const categories = this.load();
    const category = categories.find(cat => cat.id === id);
    
    // Prevent deleting default categories
    if (category?.isDefault) {
      return false;
    }

    const updatedCategories = categories.filter(cat => cat.id !== id);
    const success = this.save(updatedCategories);
    
    if (success) {
      this.notifyListeners(updatedCategories);
    }
    return success;
  }

  getCategoryById(id: string): Category | undefined {
    const categories = this.load();
    return categories.find(cat => cat.id === id);
  }

  getDefaultCategory(): Category {
    const categories = this.load();
    return categories.find(cat => cat.id === 'personal') || categories[0];
  }

  // Method to force reset categories (for debugging/admin)
  resetToDefaults(): boolean {
    console.log('Resetting categories to defaults...');
    const success = this.save(DEFAULT_CATEGORIES);
    if (success) {
      this.notifyListeners(DEFAULT_CATEGORIES);
      localStorage.setItem(this.versionKey, CATEGORY_CONFIG.CURRENT_VERSION);
    }
    return success;
  }

  destroy() {
    if (this.syncChannel) {
      this.syncChannel.close();
    }
    this.listeners = [];
  }
}

export const categoryStorage = new CategoryStorageManager();