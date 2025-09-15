/* filepath: /d:/Personal/NAVER/web-track-naver-vietnam-ai-hackathon-KiyoshiKoii/src/pages/CalendarPage.tsx */
import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../hooks/useToast'; // BƯỚC 1: Import useToast
import type { Task } from '../types/Task';
import ToastContainer from '../components/ToastContainer'; // Import ToastContainer

type ViewMode = 'day' | 'week' | 'month';

const CalendarPage: React.FC = () => {
  const { tasks, addTask, updateTask } = useTasks(); // Thêm addTask
  const { getCategoryById, categories } = useCategories(); // Thêm categories
  const { settings } = useSettings();
  const { toasts, removeToast, success, error } = useToast(); // BƯỚC 2: Lấy hàm toast

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- BƯỚC 3: SAO CHÉP STATE VÀ COMPONENT TỪ TASKSPAGE ---
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    status: 'pending' as Task['status'],
    dueDate: '',
    dueTime: '23:59',
    estimatedTime: 60,
    categoryId: 'personal',
  });

  // Sao chép component CustomTimeInput
  const CustomTimeInput: React.FC<{ value: string; onChange: (newValue: string) => void; timeFormat: '12h' | '24h'; }> = ({ value, onChange,timeFormat  }) => {
    return <input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-slate-200" />;
  };

  // Sao chép component DatePicker
  const DatePicker = () => {
    const [pickerDate, setPickerDate] = useState(formData.dueDate ? new Date(formData.dueDate + 'T00:00:00') : new Date());
    const today = new Date();
    const selectedDate = formData.dueDate ? new Date(formData.dueDate + 'T00:00:00') : null;
    const daysInMonth = new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), 1).getDay();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const selectDate = (day: number) => {
      const date = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), day);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      setFormData({ ...formData, dueDate: dateString });
      setShowDatePicker(false);
    };

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl z-50">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-700 rounded text-slate-300">←</button>
          <span className="font-semibold text-slate-200">{monthNames[pickerDate.getMonth()]} {pickerDate.getFullYear()}</span>
          <button type="button" onClick={() => setPickerDate(new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-700 rounded text-slate-300">→</button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => <div key={day} className="text-center text-xs text-slate-400 p-2 font-medium">{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(pickerDate.getFullYear(), pickerDate.getMonth(), day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
            return <button key={day} type="button" onClick={() => selectDate(day)} className={`p-2 text-sm rounded transition-colors ${isSelected ? 'bg-emerald-500 text-white' : isToday ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>{day}</button>;
          })}
        </div>
      </div>
    );
  };

  // --- BƯỚC 4: SAO CHÉP CÁC HÀM XỬ LÝ FORM ---
  const resetForm = () => {
    setFormData({
      title: '', description: '', priority: 'medium', status: 'pending',
      dueDate: '', dueTime: '23:59', estimatedTime: 60, categoryId: 'personal',
    });
    setShowForm(false);
    setEditingTask(null);
    setShowDatePicker(false);
  };

  const formatTimeForInput = (date: Date): string => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleTaskClick = (task: Task) => {
    const taskDueDate = task.dueDate;
    const dateString = `${taskDueDate.getFullYear()}-${String(taskDueDate.getMonth() + 1).padStart(2, '0')}-${String(taskDueDate.getDate()).padStart(2, '0')}`;
    
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: dateString,
      dueTime: formatTimeForInput(taskDueDate),
      estimatedTime: task.estimatedTime,
      categoryId: task.categoryId,
    });
    setEditingTask(task);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.dueDate) {
      error('Validation Error', 'Title and Due Date are required!');
      return;
    }
    const combinedDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
    try {
      if (editingTask) {
        updateTask(editingTask.id, { ...formData, dueDate: combinedDateTime });
        success('Task Updated', `"${formData.title}" has been updated`);
      } else {
        addTask({ ...formData, dueDate: combinedDateTime });
        success('Task Created', `"${formData.title}" has been added`);
      }
      resetForm();
    } catch (err) {
      error('Save Failed', 'Unable to save task.');
    }
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'Select date';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' });
  };

  const groupTasksByDate = (tasks: Task[]) => {
    const grouped: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      const dateKey = task.dueDate.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });
    
    return grouped;
  };

  const tasksByDate = groupTasksByDate(tasks);
  const today = new Date();

  const getDateRange = () => {
    const dates: Date[] = [];
    
    switch (viewMode) {
      case 'day':
        dates.push(new Date(currentDate));
        break;
        
      case 'week':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        for (let i = 0; i < 7; i++) {
          const date = new Date(startOfWeek);
          date.setDate(startOfWeek.getDate() + i);
          dates.push(date);
        }
        break;
        
      case 'month':
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - firstDay.getDay());
        
        const endDate = new Date(lastDay);
        endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d));
        }
        break;
    }
    
    return dates;
  };

  const dates = getDateRange();

  const formatDate = (date: Date, mode: ViewMode) => {
    switch (mode) {
      case 'day':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric',
          month: 'long', 
          day: 'numeric' 
        });
      case 'week':
        return date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        });
      case 'month':
        return date.getDate().toString();
      default:
        return date.toLocaleDateString();
    }
  };

  const formatTime = (date: Date) => {
    if (settings.timeFormat === '12h') {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-500',
      medium: 'bg-yellow-500',
      low: 'bg-emerald-500'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500';
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric',
          month: 'long', 
          day: 'numeric' 
        });
      case 'week':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  const getTasksForDate = (date: Date) => {
    const tasksForDay = tasksByDate[date.toDateString()] || [];
    
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return tasksForDay.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  const getGridCols = () => {
    switch (viewMode) {
      case 'day': return 'grid-cols-1';
      case 'week': return 'grid-cols-1 md:grid-cols-7';
      case 'month': return 'grid-cols-7';
    }
  };

  const renderTask = (task: Task, isCompact = false) => {
    const category = getCategoryById(task.categoryId);
    const getPriorityBorderColor = (priority: string) => {
      const colors = {
        high: 'border-l-red-500',
        medium: 'border-l-amber-500',
        low: 'border-l-emerald-500'
      };
      return colors[priority as keyof typeof colors] || 'border-l-gray-500';
    };

    return (
      <div 
        key={task.id}
        onClick={() => handleTaskClick(task)}
        className={`p-2 rounded-lg border-l-4 transition-all cursor-pointer ${isCompact ? 'mb-1' : 'mb-2'}
                  ${getPriorityBorderColor(task.priority)} 
                  ${task.status === 'completed' ? 'bg-slate-700/30 opacity-60' : 'bg-slate-700/60'}
                  hover:bg-slate-600/80`}
      >
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-1">
            <span className={`font-medium leading-tight ${isCompact ? 'text-xs' : 'text-sm'}
                              ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-white'}`}>
              {task.title}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
            </div>
          </div>
          
          {!isCompact && (
            <div className="flex items-center gap-2 text-xs text-sky-300">
              <span>🕒</span>
              <span>{formatTime(task.dueDate)}</span>
            </div>
          )}

          {category && (
            <div className="flex items-center gap-1">
              <span className="text-xs">{category.icon}</span>
              <span className="text-xs text-slate-400">{category.name}</span>
            </div>
          )}
          
          {!isCompact && (
            <select 
              value={task.status}
              onChange={(e) => updateTask(task.id, { status: e.target.value as Task['status'] })}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs
                       focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="pending">📋 To do</option>
              <option value="in-progress">⏳ In Progress</option>
              <option value="completed">✅ Completed</option>
            </select>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          <span className="text-emerald-400">📅</span> Task Calendar
        </h1>
        <p className="text-slate-400">Organize and track your tasks by timeline</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                viewMode === mode
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white transition-colors"
          >
            ⬅️
          </button>
          
          <div className="text-center min-w-[200px]">
            <h2 className="text-lg font-bold text-white">{getViewTitle()}</h2>
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white transition-colors"
          >
            ➡️
          </button>
        </div>

        <button
          onClick={goToToday}
          className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
        >
          Today
        </button>
      </div>

      {viewMode === 'month' && (
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-slate-400 font-medium text-sm">
              {day}
            </div>
          ))}
        </div>
      )}

      <div className={`grid ${getGridCols()} gap-2 md:gap-4 overflow-x-auto`}>
        {dates.map((date, index) => {
          const dayTasks = getTasksForDate(date);
          const isCurrentDay = isToday(date);
          const isOtherMonth = viewMode === 'month' && !isCurrentMonth(date);
          
          const TASKS_LIMIT = 3;
          const isCompactView = viewMode === 'month' || viewMode === 'week';
          const tasksToShow = isCompactView ? dayTasks.slice(0, TASKS_LIMIT) : dayTasks;
          const remainingTasks = dayTasks.length - tasksToShow.length;

          return (
            <div 
              key={index} 
              className={`rounded-2xl border transition-all min-w-0 ${viewMode === 'week' ? 'min-w-[250px] md:min-w-0' : ''} ${
                isCurrentDay 
                  ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20' 
                  : 'border-slate-700/50 bg-slate-800/50'
              } ${isOtherMonth ? 'opacity-30' : ''} backdrop-blur-sm overflow-hidden flex flex-col`}
            >
              <div className={`p-2 md:p-3 border-b border-slate-700/50 ${isCurrentDay ? 'bg-emerald-500/10' : 'bg-slate-700/30'}`}>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isCurrentDay ? 'text-emerald-400' : 'text-white'} ${
                    viewMode === 'month' ? 'text-sm' : viewMode === 'week' ? 'text-xs md:text-sm' : 'text-base'
                  }`}>
                    {formatDate(date, viewMode)}
                  </span>
                  <div className="flex items-center gap-1 md:gap-2">
                    {isCurrentDay && (
                      <span className="bg-emerald-400 text-black px-1 md:px-2 py-1 rounded-full text-xs font-bold">
                        Today
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{dayTasks.length}</span>
                  </div>
                </div>
              </div>
              
              <div className={`p-2 md:p-3 ${viewMode === 'day' ? 'min-h-[400px]' : 'min-h-[120px]'} space-y-1 md:space-y-2 flex-grow`}>
                {dayTasks.length === 0 ? (
                  <div className="text-slate-500 text-center py-2 md:py-4 italic text-xs md:text-sm">
                    No tasks
                  </div>
                ) : (
                  tasksToShow.map(task => 
                    renderTask(task, isCompactView)
                  )
                )}
                
                {isCompactView && remainingTasks > 0 && (
                  <div className="text-center pt-1">
                    <span className="text-xs text-sky-400 font-semibold">
                      còn {remainingTasks} mục còn lại
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {viewMode === 'week' && (
        <div className="md:hidden mb-4">
          <p className="text-xs text-slate-400 text-center">← Scroll horizontally to see all days →</p>
        </div>
      )}
      
      {tasks.length === 0 && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-2xl font-bold text-white mb-4">No tasks scheduled</h3>
          <p className="text-slate-400">Add some tasks to see them in your calendar!</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-slate-300">High Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-slate-300">Medium Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-slate-300">Low Priority</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-emerald-500 rounded-full"></div>
            <span className="text-slate-300">Today</span>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-600/50 bg-slate-700/95 backdrop-blur-xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-600/50 p-6">
              <h2 className="text-xl font-bold text-slate-100">
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </h2>
              <button onClick={resetForm} className="rounded-lg p-2 text-slate-300 hover:bg-slate-600">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label htmlFor="title" className="block mb-2 text-sm font-medium text-slate-300">Task Title *</label>
                  <input id="title" type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3" required />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-300">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-300">Priority</label>
                    <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })} className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3">
                      <option value="low">🔵 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-300">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })} className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3">
                      <option value="pending">📋 To Do</option>
                      <option value="in-progress">⏳ In Progress</option>
                      <option value="completed">✅ Completed</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <label className="block mb-2 text-sm font-medium text-slate-300">Due Date *</label>
                    <button type="button" onClick={() => setShowDatePicker(!showDatePicker)} className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-left flex justify-between items-center">
                      <span>{formatDateDisplay(formData.dueDate)}</span>
                      <span className="text-emerald-400">📅</span>
                    </button>
                    {showDatePicker && <DatePicker />}
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-300">Due Time</label>
                    <CustomTimeInput value={formData.dueTime} onChange={(newValue) => setFormData({ ...formData, dueTime: newValue })} timeFormat={settings.timeFormat} />
                  </div>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-300">Estimated Time (minutes)</label>
                  <input type="number" value={formData.estimatedTime} onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) || 0 })} min="15" step="15" className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3" />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-slate-300">Category</label>
                  <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3">
                    {categories.map(category => <option key={category.id} value={category.id}>{category.icon} {category.name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-4 pt-4 border-t border-slate-600/50">
                  <button type="button" onClick={resetForm} className="px-6 py-3 rounded-lg bg-slate-600">Cancel</button>
                  <button type="submit" className="px-6 py-3 rounded-lg bg-emerald-600 font-semibold">
                    {editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default CalendarPage;