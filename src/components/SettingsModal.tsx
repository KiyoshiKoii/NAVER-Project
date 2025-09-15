/* filepath: /d:/Personal/NAVER/web-track-naver-vietnam-ai-hackathon-KiyoshiKoii/src/components/SettingsModal.tsx */
import React, { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useTasks } from '../hooks/useTasks';
import { useToast } from '../hooks/useToast';
import { useSettings, type AppSettings } from '../hooks/useSettings'; // Import useSettings
import CategoryManager from './CategoryManager';
import ToastContainer from './ToastContainer';
import ConfirmModal from './ConfirmModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { categories } = useCategories();
  const { tasks, exportTasks, importTasks, clearAllTasks } = useTasks();
  const { toasts, removeToast, success, error } = useToast();
  
  // Use the new settings hook
  const { settings, saveSettings } = useSettings();

  const [activeTab, setActiveTab] = useState<'general' | 'categories' | 'data' | 'about'>('general');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  // Update setting function
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
    // No need for local success toast, as it's handled globally if needed
  };

  const handleExport = () => {
    try {
      const { data, filename } = exportTasks();
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      success('Export Successful', `Downloaded ${filename} with ${tasks.length} tasks`);
    } catch (err) {
      error('Export Failed', 'Unable to export tasks');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = importTasks(content);
        
        if (result.success) {
          success('Import Successful', `Imported ${result.tasksCount} tasks`);
        } else {
          error('Import Failed', result.message);
        }
      } catch (err) {
        error('Import Failed', 'Invalid file format');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClearAll = () => {
    try {
      clearAllTasks();
      success('Data Cleared', 'All tasks have been removed');
      setShowClearConfirm(false);
    } catch (err) {
      error('Clear Failed', 'Unable to clear tasks');
    }
  };

  const getStorageSize = () => {
    try {
      const tasksData = localStorage.getItem('student-tasks') || '';
      const categoriesData = localStorage.getItem('student-categories') || '';
      const settingsData = localStorage.getItem('app-settings') || '';
      const totalSize = new Blob([tasksData + categoriesData + settingsData]).size;
      
      if (totalSize < 1024) return `${totalSize} bytes`;
      if (totalSize < 1024 * 1024) return `${Math.round(totalSize / 1024)} KB`;
      return `${Math.round(totalSize / (1024 * 1024))} MB`;
    } catch {
      return 'Unknown';
    }
  };

  const resetToDefaults = () => {
    if (confirm('Reset all settings to default values?')) {
      const defaultSettingsData: AppSettings = {
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        defaultPriority: 'medium',
        defaultEstimatedTime: 60,
      };
      saveSettings(defaultSettingsData);
      success('Settings Reset', 'All preferences have been reset to default.');
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'categories', label: 'Categories', icon: '📂' },
    { id: 'data', label: 'Data', icon: '💾' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ] as const;

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-slate-700/50 bg-slate-800/95 backdrop-blur-xl shadow-2xl flex">
          {/* Sidebar */}
          <div className="w-64 border-r border-slate-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              >
                ✕
              </button>
            </div>

            <nav className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">General Preferences</h3>

                  {/* Date Format */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Date Format</label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => updateSetting('dateFormat', e.target.value as AppSettings['dateFormat'])}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                    </select>
                  </div>

                  {/* Time Format */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Time Format</label>
                    <select
                      value={settings.timeFormat}
                      onChange={(e) => updateSetting('timeFormat', e.target.value as AppSettings['timeFormat'])}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white"
                    >
                      <option value="24h">24 Hour (14:30)</option>
                      <option value="12h">12 Hour (2:30 PM)</option>
                    </select>
                  </div>

                  {/* Default Priority */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Default Priority for New Tasks</label>
                    <select
                      value={settings.defaultPriority}
                      onChange={(e) => updateSetting('defaultPriority', e.target.value as AppSettings['defaultPriority'])}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white"
                    >
                      <option value="low">🟢 Low Priority</option>
                      <option value="medium">🟡 Medium Priority</option>
                      <option value="high">🔴 High Priority</option>
                    </select>
                  </div>

                  {/* Default Estimated Time */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Default Estimated Time (minutes)</label>
                    <input
                      type="number"
                      value={settings.defaultEstimatedTime}
                      onChange={(e) => updateSetting('defaultEstimatedTime', parseInt(e.target.value) || 60)}
                      min="15"
                      step="15"
                      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-white"
                    />
                  </div>

                  <button
                    onClick={resetToDefaults}
                    className="w-full mt-6 px-4 py-2 rounded-lg bg-slate-600/50 text-slate-300 hover:bg-slate-600 transition-colors"
                  >
                    Reset to Defaults
                  </button>
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Categories Management</h3>
                  <p className="text-slate-400">Organize your tasks with custom categories</p>
                  
                  <div className="flex flex-wrap gap-3 mb-6">
                    {categories.map(category => (
                      <div key={category.id} className="flex items-center gap-2">
                        <span className="text-lg">{category.icon}</span>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white uppercase tracking-wider ${category.color} shadow-lg`}>
                          {category.name}
                        </span>
                        {category.isDefault && (
                          <span className="text-xs text-slate-400 bg-slate-600/50 px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowCategoryManager(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-3 text-emerald-400 transition-colors hover:bg-emerald-500/30"
                  >
                    <span>⚙️</span>
                    <span>Manage Categories</span>
                  </button>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Data Management</h3>
                  <p className="text-slate-400">Backup, restore, or clear your task data</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-white">Backup & Restore</h4>
                      
                      <button
                        onClick={handleExport}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500/20 px-4 py-3 text-blue-400 transition-colors hover:bg-blue-500/30 border border-blue-500/30"
                      >
                        <span>📤</span>
                        <span>Export All Data</span>
                      </button>

                      <div className="relative">
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImport}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-500/20 px-4 py-3 text-green-400 transition-colors hover:bg-green-500/30 border border-green-500/30">
                          <span>📥</span>
                          <span>Import Data</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-white">Storage Information</h4>
                      
                      <div className="space-y-2 p-4 bg-slate-700/30 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Total Tasks:</span>
                          <span className="text-white">{tasks.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Categories:</span>
                          <span className="text-white">{categories.length}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Storage Used:</span>
                          <span className="text-white">{getStorageSize()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-500/20 px-4 py-3 text-red-400 transition-colors hover:bg-red-500/30 border border-red-500/30"
                      >
                        <span>🗑️</span>
                        <span>Clear All Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">About TaskMaster</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl">
                        ✨
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-white">TaskMaster</h4>
                        <p className="text-slate-400">Your Personal Productivity Assistant</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                        <span className="text-slate-300">Version</span>
                        <span className="text-emerald-400 font-medium">1.0.0</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                        <span className="text-slate-300">Release Date</span>
                        <span className="text-emerald-400 font-medium">September 2025</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                        <span className="text-slate-300">Built with</span>
                        <span className="text-emerald-400 font-medium">React + TypeScript</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                        <span className="text-slate-300">Storage</span>
                        <span className="text-emerald-400 font-medium">Browser LocalStorage</span>
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-500/10 rounded-lg border-l-4 border-emerald-500">
                      <div className="flex items-start gap-3">
                        <span className="text-xl">💡</span>
                        <div>
                          <p className="text-sm text-slate-300 font-medium mb-1">
                            Features
                          </p>
                          <ul className="text-xs text-slate-400 space-y-1">
                            <li>• Task management with priorities and categories</li>
                            <li>• Real-time cross-tab synchronization</li>
                            <li>• Data export/import for backup</li>
                            <li>• Analytics and productivity insights</li>
                            <li>• Offline-first design</li>
                            <li>• Responsive mobile-friendly interface</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔒</span>
                        <div>
                          <p className="text-sm text-slate-300 font-medium">Privacy</p>
                          <p className="text-xs text-slate-400 mt-1">
                            All your data stays on your device. No servers, no tracking.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onCategoryAdded={() => {
          success('Category Added', 'New category created successfully!');
        }}
      />

      {/* Clear Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear All Data"
        message="Are you sure you want to delete all tasks and data? This action cannot be undone. Consider exporting your data first."
        confirmText="Clear All"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
};

export default SettingsModal;