/* filepath: /d:/Personal/NAVER/web-track-naver-vietnam-ai-hackathon-KiyoshiKoii/src/pages/AnalyticsPage.tsx */
import React from 'react';
import { useTasks } from '../hooks/useTasks';
import { useCategories } from '../hooks/useCategories';

// --- BƯỚC 1: TẠO COMPONENT BIỂU ĐỒ TRÒN TÁI SỬ DỤNG ---
interface ChartDataItem {
  label: string;
  value: number;
  color: string; // Tailwind CSS color class e.g., 'text-emerald-500'
}

const DoughnutChart: React.FC<{ data: ChartDataItem[] }> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="text-center text-slate-400">No data to display</div>;

  let accumulatedOffset = 0;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 36 36" className="transform -rotate-90">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const offset = accumulatedOffset;
            accumulatedOffset += percentage;
            return (
              <circle
                key={index}
                className={`${item.color} transition-all duration-500`}
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                cx="18"
                cy="18"
                r="16"
                strokeDasharray={`${percentage}, 100`}
                strokeDashoffset={-offset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{total}</span>
          <span className="text-sm text-slate-400">Tasks</span>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${item.color.replace('text-', 'bg-')}`}></div>
            <span className="text-slate-300">{item.label}:</span>
            <span className="font-semibold text-white">{item.value}</span>
            <span className="text-sm text-slate-400">({Math.round((item.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalyticsPage: React.FC = () => {
  const { tasks } = useTasks();
  const { getCategoryById } = useCategories();

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;

    const high = tasks.filter(t => t.priority === 'high').length;
    const medium = tasks.filter(t => t.priority === 'medium').length;
    const low = tasks.filter(t => t.priority === 'low').length;

    const overdue = tasks.filter(t =>
      t.status !== 'completed' && new Date(t.dueDate) < new Date()
    ).length;

    const totalEstimatedTime = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    const completedTime = tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, task) => sum + task.estimatedTime, 0);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const productivityHours = Math.round(completedTime / 60 * 10) / 10;

    // --- CẬP NHẬT LOGIC TÍNH TOÁN TỶ LỆ HOÀN THÀNH ĐÚNG HẠN ---
    const completedTasks = tasks.filter(t => t.status === 'completed');
    // Đếm trực tiếp từ flag isCompletedOnTime
    const onTimeCompleted = completedTasks.filter(t => t.isCompletedOnTime === true).length;
    
    const onTimeCompletionRate = completedTasks.length > 0 
      ? Math.round((onTimeCompleted / completedTasks.length) * 100) 
      : 0;

    return {
      total, completed, inProgress, pending,
      high, medium, low, overdue,
      totalEstimatedTime, completedTime,
      completionRate, productivityHours,
      onTimeCompletionRate
    };
  };

  const stats = getStats();

  // --- BƯỚC 3: CHUẨN BỊ DỮ LIỆU CHO BIỂU ĐỒ ---
  const priorityChartData: ChartDataItem[] = [
    { label: 'High', value: stats.high, color: 'text-red-500' },
    { label: 'Medium', value: stats.medium, color: 'text-amber-500' },
    { label: 'Low', value: stats.low, color: 'text-emerald-500' },
  ].filter(item => item.value > 0);

  // --- BƯỚC 4: XỬ LÝ DỮ LIỆU CATEGORY CHO BIỂU ĐỒ ---
  const getCategoryChartData = (): ChartDataItem[] => {
    // --- ĐỊNH NGHĨA MỘT BỘ MÀU RIÊNG ---
    const chartColors = [
      'text-emerald-500',
      'text-sky-500',
      'text-indigo-500',
      'text-pink-500',
      'text-amber-500',
    ];

    const categoryCounts: { [key: string]: number } = {};
    tasks.forEach(task => {
      categoryCounts[task.categoryId] = (categoryCounts[task.categoryId] || 0) + 1;
    });

    const sortedCategories = Object.entries(categoryCounts)
      .map(([categoryId, count]) => ({ categoryId, count }))
      .sort((a, b) => b.count - a.count);

    const top5 = sortedCategories.slice(0, 5);
    const othersCount = sortedCategories.slice(5).reduce((sum, cat) => sum + cat.count, 0);

    const chartData: ChartDataItem[] = top5.map(({ categoryId, count }, index) => {
      const category = getCategoryById(categoryId);
      return {
        label: category?.name || 'Unknown',
        value: count,
        // --- SỬ DỤNG MÀU TỪ BỘ MÀU ĐÃ ĐỊNH NGHĨA ---
        color: chartColors[index % chartColors.length],
      };
    });

    if (othersCount > 0) {
      chartData.push({
        label: 'Others',
        value: othersCount,
        color: 'text-slate-400', // Màu riêng cho nhóm "Others"
      });
    }
    return chartData;
  };

  const categoryChartData = getCategoryChartData();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          <span className="text-emerald-400">📊</span> Analytics & Insights
        </h1>
        <p className="text-slate-400">Track your productivity and task completion trends</p>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/30 p-12 text-center backdrop-blur-sm">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-2xl font-bold text-white mb-4">No data yet</h3>
          <p className="text-slate-400">Add some tasks to see your productivity analytics!</p>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-6 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold text-emerald-400 mb-2">{stats.total}</div>
              <div className="text-slate-300">Total Tasks</div>
            </div>

            <div className="rounded-2xl border border-emerald-700/50 bg-gradient-to-br from-emerald-800/30 to-emerald-900/20 p-6 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold text-emerald-400 mb-2">{stats.completed}</div>
              <div className="text-slate-300">Completed</div>
            </div>

            <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-6 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold text-emerald-400 mb-2">{stats.completionRate}%</div>
              <div className="text-slate-300">Completion Rate</div>
            </div>

            <div className="rounded-2xl border border-sky-700/50 bg-gradient-to-br from-sky-800/30 to-sky-900/20 p-6 text-center backdrop-blur-sm">
              <div className="text-3xl font-bold text-sky-400 mb-2">{stats.onTimeCompletionRate}%</div>
              <div className="text-slate-300">On-Time Completion</div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-6">
              <span className="text-emerald-400">📈</span> Progress Overview
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2 text-slate-300">
                  <span>Task Status</span>
                  <span>{stats.completed}/{stats.total}</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                  <div className="flex h-full">
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                    ></div>
                    <div
                      className="bg-amber-500 transition-all duration-500"
                      style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}
                    ></div>
                    <div
                      className="bg-red-500 transition-all duration-500"
                      style={{ width: `${(stats.pending / stats.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>✅ Completed ({stats.completed})</span>
                  <span>⏳ In Progress ({stats.inProgress})</span>
                  <span>📋 Pending ({stats.pending})</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2 text-slate-300">
                  <span>Time Progress</span>
                  <span>{formatTime(stats.completedTime)} / {formatTime(stats.totalEstimatedTime)}</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-500"
                    style={{ width: `${stats.totalEstimatedTime > 0 ? (stats.completedTime / stats.totalEstimatedTime) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* --- BƯỚC 5: THAY THẾ PRIORITY BREAKDOWN BẰNG BIỂU ĐỒ --- */}
          <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-6">
              <span className="text-emerald-400">🎯</span> Priority Breakdown
            </h3>
            <DoughnutChart data={priorityChartData} />
          </div>

          {/* --- BƯỚC 6: THAY THẾ CATEGORIES PERFORMANCE BẰNG BIỂU ĐỒ --- */}
          {categoryChartData.length > 0 && (
            <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-6">
                <span className="text-emerald-400">📂</span> Categories Breakdown
              </h3>
              <DoughnutChart data={categoryChartData} />
            </div>
          )}

          {/* Productivity Insights */}
          <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/60 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-6">
              <span className="text-emerald-400">💡</span> Smart Insights
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-xl border-l-4 border-emerald-500">
                <span className="text-xl">⏱️</span>
                <span className="text-slate-300">You've completed {stats.productivityHours} hours of productive work!</span>
              </div>

              {stats.overdue > 0 && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl border-l-4 border-red-500">
                  <span className="text-xl">⚠️</span>
                  <span className="text-slate-300">You have {stats.overdue} overdue task{stats.overdue > 1 ? 's' : ''} that need{stats.overdue === 1 ? 's' : ''} attention.</span>
                </div>
              )}

              {stats.completionRate > 80 && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 rounded-xl border-l-4 border-emerald-500">
                  <span className="text-xl">🎉</span>
                  <span className="text-slate-300">Excellent! You have a high completion rate of {stats.completionRate}%!</span>
                </div>
              )}

              {stats.inProgress > 5 && (
                <div className="flex items-center gap-3 p-4 bg-blue-500/10 rounded-xl border-l-4 border-blue-500">
                  <span className="text-xl">📋</span>
                  <span className="text-slate-300">You have many tasks in progress. Consider focusing on fewer tasks at once.</span>
                </div>
              )}

              {stats.completionRate < 30 && stats.total > 3 && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/10 rounded-xl border-l-4 border-amber-500">
                  <span className="text-xl">💪</span>
                  <span className="text-slate-300">Your completion rate is low. Try breaking tasks into smaller, manageable pieces!</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;