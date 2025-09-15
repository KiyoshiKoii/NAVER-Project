/* filepath: /d:/Personal/NAVER/web-track-naver-vietnam-ai-hackathon-KiyoshiKoii/src/pages/TasksPage.tsx */
import React, { useState, useRef } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useToast } from '../hooks/useToast';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../hooks/useSettings'; // Import useSettings
import type { Task } from '../types/Task';
import ToastContainer from '../components/ToastContainer';
import ConfirmModal from '../components/ConfirmModal';
import CategoryManager from '../components/CategoryManager';

// --- UPDATED COMPONENT: CustomTimeInput ---
const CustomTimeInput: React.FC<{
  value: string; // "HH:mm"
  onChange: (newValue: string) => void;
  timeFormat: '12h' | '24h';
}> = ({ value, onChange, timeFormat }) => {
  
  const parseTime = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(':')) return { hours: 0, minutes: 0 };
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  };

  const { hours, minutes } = parseTime(value);

  const handleHourChange = (newHour: number) => {
    if (!isNaN(newHour) && newHour >= 0 && newHour < 24) {
      onChange(`${String(newHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
    }
  };

  const handleMinuteChange = (newMinute: number) => {
    if (!isNaN(newMinute) && newMinute >= 0 && newMinute < 60) {
      onChange(`${String(hours).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`);
    }
  };

  // --- SWAPPED LOGIC ---
  // 24h format uses custom inputs
  if (timeFormat === '24h') {
    return (
      <div className="flex items-center gap-2 w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2.5 text-slate-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
        <input
          type="number"
          value={String(hours).padStart(2, '0')}
          onChange={(e) => handleHourChange(parseInt(e.target.value, 10))}
          className="bg-transparent w-12 text-center outline-none"
          min="0" max="23"
        />
        <span>:</span>
        <input
          type="number"
          value={String(minutes).padStart(2, '0')}
          onChange={(e) => handleMinuteChange(parseInt(e.target.value, 10))}
          className="bg-transparent w-12 text-center outline-none"
          min="0" max="59" step="1"
        />
      </div>
    );
  }

  // 12h format uses the native browser input
  return (
    <input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-200 backdrop-blur-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
    />
  );
};

const TasksPage: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { toasts, removeToast, success, error, warning } = useToast();
  const { categories, getCategoryById } = useCategories();
  const { settings } = useSettings(); // Use the settings hook

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const draggedTaskRef = useRef<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    taskId: string;
    taskTitle: string;
  }>({
    isOpen: false,
    taskId: '',
    taskTitle: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    status: 'pending' as Task['status'],
    dueDate: '',
    dueTime: '23:59', // Thêm state cho thời gian, mặc định là cuối ngày
    estimatedTime: 60,
    categoryId: 'personal',
  });

  // NEW: Use a ref to track drag status synchronously
  const dragStatus = useRef({ didDrag: false });

  // --- CÁC STATE MỚI CHO TÍNH NĂNG AI HELPER ---
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPromptTitle, setAiPromptTitle] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<{ id: number; text: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false); // State này đã có, ta sẽ tái sử dụng

  // Improved neutral Kanban columns
  const kanbanColumns = [
    {
      id: 'pending',
      title: 'To Do',
      icon: '📋',
      status: 'pending' as Task['status'],
      accentColor: 'border-sky-500',
      count: tasks.filter(t => t.status === 'pending').length
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      icon: '⏳',
      status: 'in-progress' as Task['status'],
      accentColor: 'border-amber-500',
      count: tasks.filter(t => t.status === 'in-progress').length
    },
    {
      id: 'completed',
      title: 'Completed',
      icon: '✅',
      status: 'completed' as Task['status'],
      accentColor: 'border-emerald-500',
      count: tasks.filter(t => t.status === 'completed').length
    }
  ];

  // --- HÀM MỚI: GỌI AI TỪ MODAL MỚI ---
  const handleGenerateSuggestions = async () => {
    if (!aiPromptTitle.trim()) {
      error('AI Helper', 'Vui lòng nhập ý tưởng công việc.');
      return;
    }
    setIsAiLoading(true);
    setAiSuggestions([]); // Xóa gợi ý cũ
    try {
      const response = await fetch('http://localhost:3001/api/generate-subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: aiPromptTitle }),
      });
      if (!response.ok) throw new Error('AI server is not responding');
      const data = await response.json();
      if (data.suggestions && data.suggestions.length > 0) {
        // Gán ID duy nhất cho mỗi gợi ý để dễ quản lý
        setAiSuggestions(data.suggestions.map((text: string, index: number) => ({ id: index, text })));
      } else {
        warning('AI Helper', 'AI không thể tạo gợi ý cho chủ đề này.');
      }
    } catch (err) {
      error('AI Error', 'Không thể kết nối đến dịch vụ AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- HÀM MỚI: TỪ CHỐI MỘT GỢI Ý ---
  const handleRejectSuggestion = (id: number) => {
    setAiSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));
  };

  // --- HÀM MỚI: CHẤP NHẬN VÀ TẠO TASK TỪ GỢI Ý ---
  const handleAcceptSuggestion = (suggestionText: string) => {
    try {
      addTask({
        title: suggestionText,
        description: `Task được tạo bởi AI từ ý tưởng: "${aiPromptTitle}"`,
        priority: 'medium', // Cài đặt mặc định
        status: 'pending',   // Mặc định vào cột To Do
        dueDate: new Date(), // Mặc định là hôm nay
        estimatedTime: 30,   // Mặc định 30 phút
        categoryId: 'personal', // Mặc định
      });
      success('Task Created', `"${suggestionText}" đã được thêm vào To Do.`);
      // Xóa gợi ý đã được chấp nhận khỏi danh sách
      handleRejectSuggestion(aiSuggestions.find(s => s.text === suggestionText)!.id);
    } catch (err) {
      error('Lỗi', 'Không thể tạo task. Vui lòng thử lại.');
    }
  };

  // Group tasks by status for Kanban
  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter(task => task.status === status);
  };

  // CONSOLIDATED Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    draggedTaskRef.current = task;                // ← không setState
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    (e.currentTarget as HTMLElement).style.opacity = '0.6'; // feedback nhẹ
  };
  
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDragOverColumn(null);
    draggedTaskRef.current = null;                // ← reset ngay
  };
  
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: Task['status']) => {
    e.preventDefault();
    setDragOverColumn(null);
  
    const t = draggedTaskRef.current;
    if (t && t.status !== targetStatus) {
      updateTask(t.id, { status: targetStatus });
      const msg = { pending: 'moved to To Do', 'in-progress': 'moved to In Progress', completed: 'completed! 🎉' };
      success('Task Moved', `"${t.title}" ${msg[targetStatus]}`);
    }
    draggedTaskRef.current = null;                // ← reset phòng khi dragend không nổ
  };

  // Form handlers (keep existing logic)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.dueDate) {
      error('Validation Error', 'Title and Due Date are required!');
      return;
    }

    // Gộp ngày và giờ thành một đối tượng Date hoàn chỉnh
    const combinedDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);

    try {
      if (editingTask) {
        updateTask(editingTask.id, {
          ...formData,
          dueDate: combinedDateTime, // Sử dụng ngày giờ đã gộp
        });
        success('Task Updated', `"${formData.title}" has been updated`);
      } else {
        addTask({
          ...formData,
          dueDate: combinedDateTime, // Sử dụng ngày giờ đã gộp
        });
        success('Task Created', `"${formData.title}" has been added`);
      }
      
      resetForm();
    } catch (err) {
      error('Save Failed', 'Unable to save task. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      dueDate: '',
      dueTime: '23:59', // Reset thời gian
      estimatedTime: 60,
      categoryId: 'personal',
    });
    setShowForm(false);
    setEditingTask(null);
    setShowDatePicker(false);
  };

  // UPDATED: openTaskDetail to check the ref
  const openTaskDetail = (task: Task) => {
    if (dragStatus.current.didDrag) return;

    const taskDueDate = task.dueDate;
    const dateString = `${taskDueDate.getFullYear()}-${String(taskDueDate.getMonth() + 1).padStart(2, '0')}-${String(taskDueDate.getDate()).padStart(2, '0')}`;
    
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: dateString,
      dueTime: formatTimeForInput(taskDueDate), // Use the new formatter
      estimatedTime: task.estimatedTime,
      categoryId: task.categoryId,
    });
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDeleteTask = (e: React.MouseEvent, taskId: string, taskTitle: string) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      taskId,
      taskTitle
    });
  };

  const confirmDeleteTask = () => {
    try {
      deleteTask(confirmModal.taskId);
      success('Task Deleted', `"${confirmModal.taskTitle}" has been removed`);
      
      if (editingTask?.id === confirmModal.taskId) {
        resetForm();
      }
    } catch (err) {
      error('Delete Failed', 'Unable to delete task. Please try again.');
    }
    
    setConfirmModal({ isOpen: false, taskId: '', taskTitle: '' });
  };

  // Utility functions
  const formatDate = (date: Date) => {
    // Simple format for the card, e.g., "14 Sep"
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short'
    });
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'Select date';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Format based on user settings
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    };
    
    // The locale 'en-CA' gives YYYY-MM-DD, 'en-GB' gives DD/MM/YYYY
    let locale = 'en-US'; // MM/DD/YYYY
    if (settings.dateFormat === 'DD/MM/YYYY') locale = 'en-GB';
    if (settings.dateFormat === 'YYYY-MM-DD') locale = 'en-CA';

    return new Intl.DateTimeFormat(locale, options).format(date);
  };

  const formatTimeForInput = (date: Date): string => {
    // Always use 24h format for <input type="time">
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // REFACTORED KanbanTaskCard component
  const KanbanTaskCard = ({ task }: { task: Task }) => {
    const category = getCategoryById(task.categoryId);
    
    const getPriorityBorder = (priority: string) => {
      const borders = {
        high: 'border-rose-400',
        medium: 'border-amber-400', 
        low: 'border-sky-400'
      };
      return borders[priority as keyof typeof borders] || 'border-slate-400';
    };
    
    const getPriorityBadgeColor = (priority: string) => {
      const colors = {
        high: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
        medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
        low: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300'
      };
      return colors[priority as keyof typeof colors] || 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300';
    };

    // CẬP NHẬT: Logic so sánh thời gian chính xác
    const getDueDateStyle = (dueDate: Date): string => {
      const now = new Date(); // Lấy thời gian hiện tại chính xác

      if (task.status === 'completed') {
        return 'bg-slate-100 dark:bg-slate-600 text-slate-500 dark:text-slate-400';
      }
      // So sánh trực tiếp với thời gian hiện tại
      if (dueDate < now) {
        return 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300';
      } else {
        return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
      }
    };
    
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
        onClick={() => openTaskDetail(task)}
        className={`group relative bg-white dark:bg-slate-700 border-2 ${getPriorityBorder(task.priority)}
        rounded-lg p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-move
        data-[dragging=true]:opacity-60 data-[dragging=true]:scale-95`}
      >
        {/* Category badge with icon - top left, colored by priority */}
        <div className="flex items-start justify-between mb-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${getPriorityBadgeColor(task.priority)}`}>
            <span className="text-sm">{category?.icon || '📝'}</span>
            <span>{category?.name || 'General'}</span>
          </div>
          <button 
            className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors z-10"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              handleDeleteTask(e, task.id, task.title);
            }}
            title="Delete task"
          >
            <span className="text-xs">🗑️</span>
          </button>
        </div>
        
        {/* CẬP NHẬT: Tăng kích thước font chữ của tiêu đề */}
        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight mb-3 line-clamp-2">
          {task.title}
        </h4>
        
        {/* Description if exists */}
        {task.description && (
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed line-clamp-2 mb-4">
            {task.description}
          </p>
        )}
        
        {/* Bottom row - Date, Time, Progress - Made larger */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Date - larger, with conditional background */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${getDueDateStyle(task.dueDate)}`}>
              <span className="text-sm">📅</span>
              <span className="text-sm font-medium">{formatDate(task.dueDate)}</span>
            </div>
            
            {/* Estimated time - larger */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="text-sm">⏱️</span>
              <span className="text-sm font-medium">{task.estimatedTime}m</span>
            </div>
          </div>
          
          {/* Completion badge for completed tasks */}
          {task.status === 'completed' && (
            <div className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full text-xs font-medium">
              <span>✅</span>
              <span>Done</span>
            </div>
          )}
        </div>
        
        {/* Drag indicator */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-0.5 h-0.5 bg-slate-400 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-slate-400 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-slate-400 rounded-full"></div>
            <div className="w-0.5 h-0.5 bg-slate-400 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  };

  // DatePicker component (keep existing implementation but simplified)
  const DatePicker = () => {
    // ... (keep existing DatePicker logic but with improved styling)
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const today = new Date();
    const selectedDate = formData.dueDate ? new Date(formData.dueDate + 'T00:00:00') : null;

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const selectDate = (day: number) => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const selectedDate = new Date(year, month, day);
      const dateString = selectedDate.getFullYear() + '-' + 
        String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(selectedDate.getDate()).padStart(2, '0');
      
      setFormData({ ...formData, dueDate: dateString });
      setShowDatePicker(false);
    };

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl z-50">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
            className="p-2 hover:bg-slate-700 rounded text-slate-300"
          >
            ←
          </button>
          <span className="font-semibold text-slate-200">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
            className="p-2 hover:bg-slate-700 rounded text-slate-300"
          >
            → 
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-xs text-slate-400 p-2 font-medium">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="p-2"></div>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            
            return (
              <button
                key={day}
                type="button"
                onClick={() => selectDate(day)}
                className={`p-2 text-sm rounded transition-colors ${
                  isSelected
                    ? 'bg-emerald-500 text-white'
                    : isToday
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-600">
          <button
            type="button"
            onClick={() => {
              const todayString = today.getFullYear() + '-' + 
                String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                String(today.getDate()).padStart(2, '0');
              setFormData({ ...formData, dueDate: todayString });
              setShowDatePicker(false);
            }}
            className="w-full p-2 text-emerald-400 hover:bg-emerald-500/20 rounded text-sm"
          >
            Today
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-800"> {/* Changed from bg-slate-950 */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
        <div className="space-y-8">
          {/* Improved Header with better typography hierarchy */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-2 tracking-tight">
                <span className="text-emerald-400">📋</span> Task Board
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed">Organize and track your tasks with drag & drop</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* NÚT AI HELPER MỚI */}
              <button
                onClick={() => setShowAiModal(true)}
                className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/25 transition-all duration-200 hover:shadow-sky-500/40 hover:-translate-y-0.5"
              >
                <span className="text-xl">🤖</span>
                <span>AI Helper</span>
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
              >
                <span className="text-xl">✨</span>
                <span>Add New Task</span>
              </button>
            </div>
          </div>

          {/* Kanban Board - Unified neutral design */}
          {tasks.length === 0 ? (
            <div className="rounded-2xl bg-slate-700/80 border border-slate-600/50 p-16 text-center"> {/* Lighter empty state */}
              <div className="mx-auto max-w-md space-y-6">
                <div className="text-6xl opacity-60 text-slate-400">📝</div> {/* Lighter icon */}
                <h3 className="text-xl font-semibold text-slate-100">Ready to get organized?</h3> {/* Brighter text */}
                <p className="text-slate-300 leading-relaxed"> {/* Brighter description */}
                  Create your first task and start managing your workflow with our intuitive Kanban board.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/30 px-6 py-3 text-emerald-300 transition-colors hover:bg-emerald-500/40" 
                >
                  <span>✨</span>
                  <span>Create your first task</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {kanbanColumns.map(column => {
                const columnTasks = getTasksByStatus(column.status);
                
                return (
                  <div
                    key={column.id}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, column.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.status)}
                    className={`rounded-2xl bg-slate-700/80 border border-slate-600/50 transition-all duration-200 ${
                      dragOverColumn === column.id 
                        ? `ring-2 ring-offset-2 ring-offset-slate-800 scale-[1.02] ${column.accentColor.replace('border-', 'ring-')} bg-slate-700/90` 
                        : ''
                    }`}
                  >
                    {/* Enhanced Column Header with better visual hierarchy */}
                    <div className={`border-b border-slate-600/50 p-5 rounded-t-2xl border-l-4 ${column.accentColor} bg-slate-600/40`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{column.icon}</span>
                          <div>
                            <h3 className="font-bold text-slate-100 text-xl tracking-tight">{column.title}</h3>
                            <p className="text-slate-300 text-sm font-medium">
                              {column.count} {column.count === 1 ? 'task' : 'tasks'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Enhanced add button */}
                        <button
                          onClick={() => {
                            setFormData({ ...formData, status: column.status });
                            setShowForm(true);
                          }}
                          className="rounded-xl p-3 bg-white/10 text-slate-300 hover:bg-white/20 hover:text-slate-100 hover:scale-110 transition-all duration-200 border border-slate-500/30"
                          title={`Add task to ${column.title}`}
                        >
                          <span className="text-xl font-bold">➕</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Dynamic Column Content - adjusts to content */}
                    <div className={`p-5 space-y-4 ${columnTasks.length === 0 ? 'pb-16' : 'pb-6'}`}>
                      {columnTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="text-slate-500/80 space-y-3">
                            <div className="text-5xl opacity-60">{column.icon}</div>
                            <p className="text-base font-medium text-slate-400">No tasks yet</p>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">
                              Drag tasks here or click the + button to add new ones
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {columnTasks.map(task => (
                            <KanbanTaskCard key={task.id} task={task} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Task Detail/Edit Modal - keep existing but improve contrast */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-600/50 bg-slate-700/95 backdrop-blur-xl shadow-2xl flex flex-col"> {/* Lighter modal */}
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-slate-600/50 p-6 flex-shrink-0">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 tracking-tight"> {/* Brighter text */}
                      {editingTask ? 'Edit Task' : 'Create New Task'}
                    </h2>
                    <p className="text-sm text-slate-300"> {/* Brighter text */}
                      {editingTask ? 'Update your task details' : 'Add a new task to your board'}
                    </p>
                  </div>
                  <button
                    onClick={resetForm}
                    className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-600 hover:text-white" 
                    aria-label="Close"
                  >
                    <span className="text-xl">✕</span>
                  </button>
                </div>
                
                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto">
                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    
                    {/* --- CẬP NHẬT Ô NHẬP TIÊU ĐỀ --- */}
                    <div>
                      <label htmlFor="title" className="block mb-2 text-sm font-medium text-slate-300">Task Title *</label>
                      <div className="flex items-center gap-2">
                        <input
                          id="title"
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="e.g., Plan a new project launch"
                          className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-200 placeholder-slate-400 backdrop-blur-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          required
                        />
                        <button
                          type="button"
                          onClick={handleGenerateSuggestions}
                          disabled={isAiLoading}
                          className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Generate sub-tasks with AI"
                        >
                          {isAiLoading ? (
                            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            '✨'
                          )}
                          <span>AI</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-300">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Add more details about your task..."
                        rows={3}
                        className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-200 placeholder-slate-400 backdrop-blur-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">Priority</label>
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                          className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-200 backdrop-blur-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <option value="low">🔵 Low Priority</option>
                          <option value="medium">🟡 Medium Priority</option>
                          <option value="high">🔴 High Priority</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-2 text-sm font-medium text-slate-300">Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                          className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-200 backdrop-blur-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <option value="pending">📋 To Do</option>
                          <option value="in-progress">⏳ In Progress</option>
                          <option value="completed">✅ Completed</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative">
                        <label className="block mb-2 text-sm font-medium text-slate-300">Due Date *</label>
                        <button
                          type="button"
                          onClick={() => setShowDatePicker(!showDatePicker)}
                          className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-left text-slate-200 backdrop-blur-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 flex items-center justify-between"
                        >
                          <span className={formData.dueDate ? 'text-slate-200' : 'text-slate-400'}>
                            {formatDateDisplay(formData.dueDate)}
                          </span>
                          <span className="text-emerald-400">📅</span>
                        </button>
                        {showDatePicker && <DatePicker />}
                      </div>

                      <div>
                        <label htmlFor="dueTimeInput" className="block mb-2 text-sm font-medium text-slate-300">Due Time</label>
                        <CustomTimeInput
                          value={formData.dueTime}
                          onChange={(newValue) => setFormData({ ...formData, dueTime: newValue })}
                          timeFormat={settings.timeFormat}
                        />
                      </div>

                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-300">Estimated Time (minutes)</label>
                      <input
                        type="number"
                        value={formData.estimatedTime}
                        onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) || 0 })}
                        min="15"
                        step="15"
                        className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-200 backdrop-blur-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-slate-300">Category</label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-200 backdrop-blur-sm transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        {categories.map(category => (
                          <option key={category.id} value={category.id} style={{ backgroundColor: '#334155', color: '#e2e8f0' }}>
                            {category.icon} {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-4 justify-end pt-4 border-t border-slate-700/50">
                      <button 
                        type="button" 
                        onClick={resetForm}
                        className="rounded-lg px-6 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                      >
                        Cancel
                      </button>
                      {editingTask && (
                        <button 
                          type="button"
                          onClick={() => handleDeleteTask({ stopPropagation: () => {} } as any, editingTask.id, editingTask.title)}
                          className="rounded-lg px-6 py-3 font-medium text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          Delete Task
                        </button>
                      )}
                      <button 
                        type="submit" 
                        className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                      >
                        {editingTask ? 'Update Task' : 'Create Task'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Task"
        message={`Are you sure you want to delete "${confirmModal.taskTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDeleteTask}
        onCancel={() => setConfirmModal({ isOpen: false, taskId: '', taskTitle: '' })}
      />

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onCategoryAdded={(category) => {
          setFormData({ ...formData, categoryId: category.id });
        }}
      />

      {/* --- MODAL AI HELPER MỚI --- */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-600/50 bg-slate-700/95 backdrop-blur-xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-600/50 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100 tracking-tight">🤖 AI Helper</h2>
                <p className="text-sm text-slate-300">Chia nhỏ công việc lớn của bạn thành các bước cụ thể.</p>
              </div>
              <button onClick={() => setShowAiModal(false)} className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-600 hover:text-white">
                <span className="text-xl">✕</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="ai-prompt" className="block mb-2 text-sm font-medium text-slate-300">Nhập ý tưởng công việc của bạn:</label>
                <div className="flex items-center gap-2">
                  <input
                    id="ai-prompt"
                    type="text"
                    value={aiPromptTitle}
                    onChange={(e) => setAiPromptTitle(e.target.value)}
                    placeholder="Ví dụ: Lên kế hoạch cho chuyến du lịch Đà Nẵng"
                    className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-200 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateSuggestions}
                    disabled={isAiLoading}
                    className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg bg-sky-500/20 px-4 py-3 text-sm font-semibold text-sky-400 transition-colors hover:bg-sky-500/30 disabled:opacity-50"
                  >
                    {isAiLoading ? <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div> : '✨'}
                    <span>Tạo gợi ý</span>
                  </button>
                </div>
              </div>

              {/* DANH SÁCH GỢI Ý */}
              {aiSuggestions.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-600/50">
                  <h3 className="font-semibold text-slate-200">Các công việc được gợi ý:</h3>
                  <ul className="space-y-2">
                    {aiSuggestions.map((suggestion) => (
                      <li key={suggestion.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-600/50">
                        <span className="text-slate-200">{suggestion.text}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => handleRejectSuggestion(suggestion.id)} title="Bỏ qua" className="p-2 rounded-full text-slate-400 hover:bg-red-500/20 hover:text-red-400">
                            <span className="font-bold">✕</span>
                          </button>
                          <button onClick={() => handleAcceptSuggestion(suggestion.text)} title="Thêm vào To Do" className="p-2 rounded-full text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400">
                            <span className="font-bold">✓</span>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;