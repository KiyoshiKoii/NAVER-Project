/* filepath: /d:/Personal/NAVER/web-track-naver-vietnam-ai-hackathon-KiyoshiKoii/src/hooks/useCategories.ts */
import { useState, useEffect } from 'react';
import type { Category } from '../types/Category';
import { categoryStorage } from '../utils/categoryStorage';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const loadedCategories = categoryStorage.load();
      setCategories(loadedCategories);
      setError(null);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Failed to load categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = categoryStorage.subscribe((updatedCategories) => {
      setCategories(updatedCategories);
    });

    return unsubscribe;
  }, []);

  const addCategory = (category: Omit<Category, 'id' | 'createdAt'>) => {
    try {
      const newCategory = categoryStorage.addCategory(category);
      setError(null);
      return newCategory;
    } catch (err) {
      setError('Failed to add category');
      console.error('Failed to add category:', err);
      throw err;
    }
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    try {
      const success = categoryStorage.updateCategory(id, updates);
      if (success) {
        setError(null);
      } else {
        setError('Failed to update category');
      }
      return success;
    } catch (err) {
      setError('Failed to update category');
      console.error('Failed to update category:', err);
      return false;
    }
  };

  const deleteCategory = (id: string) => {
    try {
      const success = categoryStorage.deleteCategory(id);
      if (success) {
        setError(null);
      } else {
        setError('Cannot delete default category');
      }
      return success;
    } catch (err) {
      setError('Failed to delete category');
      console.error('Failed to delete category:', err);
      return false;
    }
  };

  const getCategoryById = (id: string) => {
    return categoryStorage.getCategoryById(id);
  };

  const getDefaultCategory = () => {
    return categoryStorage.getDefaultCategory();
  };

  return {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getDefaultCategory,
    isLoading,
    error
  };
};