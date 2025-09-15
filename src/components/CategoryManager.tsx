/* filepath: /d:/Personal/NAVER/web-track-naver-vietnam-ai-hackathon-KiyoshiKoii/src/components/CategoryManager.tsx */
import React, { useState } from 'react';
import type { Category } from '../types/Category';
import { useCategories } from '../hooks/useCategories';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryAdded?: (category: Category) => void;
}

const PREDEFINED_ICONS = [
  '👤', '💼', '📚', '🏃‍♂️', '🎯', '💡', '🎨', '🔧', 
  '🏠', '✈️', '🍔', '🎵', '💰', '📱', '🎮', '🧘‍♂️',
  '📝', '💻', '🔬', '🎪', '🌟', '⚽', '🎭', '🌱'
];

const PREDEFINED_COLORS = [
  'bg-gradient-to-r from-blue-500 to-blue-600',
  'bg-gradient-to-r from-purple-500 to-purple-600',
  'bg-gradient-to-r from-green-500 to-green-600',
  'bg-gradient-to-r from-red-500 to-red-600',
  'bg-gradient-to-r from-yellow-500 to-yellow-600',
  'bg-gradient-to-r from-pink-500 to-pink-600',
  'bg-gradient-to-r from-indigo-500 to-indigo-600',
  'bg-gradient-to-r from-gray-500 to-gray-600',
  'bg-gradient-to-r from-orange-500 to-orange-600',
  'bg-gradient-to-r from-teal-500 to-teal-600',
  'bg-gradient-to-r from-cyan-500 to-cyan-600',
  'bg-gradient-to-r from-emerald-500 to-emerald-600'
];

const CategoryManager: React.FC<CategoryManagerProps> = ({ isOpen, onClose, onCategoryAdded }) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '📂',
    color: 'bg-gradient-to-r from-blue-500 to-blue-600'
  });

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      name: '',
      icon: '📂',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600'
    });
    setShowAddForm(false);
    setEditingCategory(null);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color
    });
    setEditingCategory(category);
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    try {
      if (editingCategory) {
        // Update existing category
        const success = updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color
        });
        
        if (success) {
          resetForm();
        }
      } else {
        // Add new category
        const newCategory = addCategory({
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color
        });
        
        resetForm();
        
        if (onCategoryAdded) {
          onCategoryAdded(newCategory);
        }
      }
    } catch (err) {
      console.error('Failed to save category:', err);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      const success = deleteCategory(id);
      if (success && editingCategory && editingCategory.id === id) {
        resetForm(); // Close edit form if deleting currently edited category
      }
    }
  };

  const isFormVisible = showAddForm || editingCategory;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl border border-slate-700/50 bg-slate-800/95 backdrop-blur-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/50 p-6 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white">Manage Categories</h2>
            <p className="text-sm text-slate-400">Organize your tasks with custom categories</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add/Edit Category Button */}
          <div className="mb-6">
            {!isFormVisible && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-emerald-400 transition-colors hover:bg-emerald-500/30"
              >
                <span>➕</span>
                <span>Add New Category</span>
              </button>
            )}
          </div>

          {/* Add/Edit Category Form */}
          {isFormVisible && (
            <div className="mb-6 rounded-xl border border-slate-600/50 bg-slate-700/30 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                {editingCategory && (
                  <button
                    onClick={resetForm}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Cancel editing"
                  >
                    ✕
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-300">Category Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Projects, Hobbies..."
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 backdrop-blur-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-300">Icon</label>
                  <div className="grid grid-cols-8 gap-2 mb-4">
                    {PREDEFINED_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`p-3 rounded-lg text-xl transition-colors ${
                          formData.icon === icon
                            ? 'bg-emerald-500/30 border-emerald-500'
                            : 'bg-slate-600/50 hover:bg-slate-600 border-slate-600'
                        } border`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Or type custom emoji..."
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-white placeholder-slate-400 text-center"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-300">Color</label>
                  <div className="grid grid-cols-6 gap-2">
                    {PREDEFINED_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`h-10 rounded-lg ${color} transition-all ${
                          formData.color === color
                            ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-800'
                            : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="pt-4 border-t border-slate-600/50">
                  <p className="text-sm text-slate-400 mb-2">Preview:</p>
                  <div className="inline-flex items-center gap-2">
                    <span className="text-base">{formData.icon}</span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white uppercase tracking-wider ${formData.color} shadow-lg`}>
                      {formData.name || 'Category Name'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                  >
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white mb-4">Your Categories</h3>
            {categories.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <span className="text-4xl mb-2 block">📂</span>
                <p>No categories yet. Add your first category!</p>
              </div>
            ) : (
              categories.map(category => (
                <div key={category.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  editingCategory?.id === category.id 
                    ? 'bg-emerald-500/10 border-emerald-500/50' 
                    : 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{category.icon}</span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white uppercase tracking-wider ${category.color} shadow-lg`}>
                      {category.name}
                    </span>
                    {category.isDefault && (
                      <span className="text-xs text-slate-400 bg-slate-600/50 px-2 py-1 rounded">Default</span>
                    )}
                    {editingCategory?.id === category.id && (
                      <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">Editing</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Edit Button - Show for all categories */}
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 p-2 rounded-lg transition-colors"
                      title="Edit category"
                    >
                      ✏️
                    </button>

                    {/* Delete Button - Only for non-default categories */}
                    {!category.isDefault && (
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-lg transition-colors"
                        title="Delete category"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          {categories.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-600/50">
              <p className="text-xs text-slate-400 mb-3">Quick Actions:</p>
              <div className="flex gap-2 text-xs">
                <span className="text-slate-500">💡 Tip: Click</span>
                <span className="text-blue-400">✏️ to edit</span>
                <span className="text-slate-500">or</span>
                <span className="text-red-400">🗑️ to delete</span>
                <span className="text-slate-500">categories</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;