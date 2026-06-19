import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { LayoutDashboard, FolderKanban, CheckSquare, Clock, CheckCircle2, TrendingUp, AlertCircle, Calendar, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/tasks?limit=50')
        ]);
        setStats(statsRes.data);
        setAllTasks(tasksRes.data.tasks || []);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const recentTasks = allTasks.slice(0, 5);

  const upcomingDeadlines = allTasks
    .filter(task => {
      if (!task.dueDate || task.status === 'Completed') return false;
      const today = new Date();
      const due = new Date(task.dueDate);
      const diffTime = due - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    })
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  const statCards = [
    { label: 'Total Projects', value: stats?.totalProjects || 0, icon: FolderKanban, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-200' },
    { label: 'In Progress Projects', value: stats?.inProgressProjects || 0, icon: TrendingUp, color: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-200' },
    { label: 'Total Tasks', value: stats?.totalTasks || 0, icon: CheckSquare, color: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-200' },
    { label: 'Pending Tasks', value: stats?.pendingTasks || 0, icon: Clock, color: 'from-amber-400 to-amber-500', shadow: 'shadow-amber-200' },
    { label: 'Completed Tasks', value: stats?.completedTasks || 0, icon: CheckCircle2, color: 'from-emerald-400 to-emerald-500', shadow: 'shadow-emerald-200' },
  ];

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'Medium': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
    }
  };

  const totalTasks = stats?.totalTasks || 0;
  const completedTasks = stats?.completedTasks || 0;
  const pendingTasks = stats?.pendingTasks || 0;
  const inProgressTasks = totalTasks - completedTasks - pendingTasks;
  
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Real-time statistics and productivity indicators.</p>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl h-32 border border-gray-100 shadow-sm animate-pulse p-6">
              <div className="w-10 h-10 bg-gray-205 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 w-1/2 mb-2 rounded"></div>
              <div className="h-6 bg-gray-200 w-1/4 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-gray-100 p-6 transition-all duration-200 group transform hover:-translate-y-1 relative overflow-hidden">
                <div className={`absolute -right-6 -top-6 w-24 h-24 bg-gradient-to-br ${stat.color} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-500`}></div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} text-white flex items-center justify-center mb-4 shadow-lg ${stat.shadow}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">{stat.label}</h3>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Recent Tasks List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Tasks</h2>
            <Link to="/tasks" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
              View All <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-4 flex-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <CheckSquare className="w-10 h-10 text-gray-400 mb-2" />
              <p className="text-gray-500 font-medium">No tasks found</p>
              <Link to="/tasks" className="mt-2 text-blue-600 text-sm hover:underline">Create a new task</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-100 hover:shadow-sm transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {task.status === 'Completed' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm font-semibold ${task.status === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {task.taskName}
                      </h4>
                      <p className="text-xs text-gray-505 mt-0.5">{task.project?.projectName || 'Project'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                      {getPriorityIcon(task.priority)}
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="flex items-center text-xs text-gray-550">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Donut Chart & Upcoming Deadlines Column */}
        <div className="space-y-8">
          
          {/* Custom SVG Donut Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
            <h3 className="text-lg font-bold text-gray-900 mb-6 w-full text-left">Task Completion Donut</h3>
            
            {loading ? (
              <div className="w-32 h-32 bg-gray-150 rounded-full animate-pulse"></div>
            ) : (
              <div className="relative flex items-center justify-center w-36 h-36">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="stroke-gray-100"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    className="stroke-blue-600 transition-all duration-500 ease-out"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-gray-900">{completionPercentage}%</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 w-full mt-6 text-center border-t border-gray-100 pt-4">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Pending</p>
                <p className="text-lg font-extrabold text-amber-500">{pendingTasks}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Active</p>
                <p className="text-lg font-extrabold text-blue-500">{inProgressTasks > 0 ? inProgressTasks : 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Done</p>
                <p className="text-lg font-extrabold text-emerald-500">{completedTasks}</p>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Deadlines</h3>
            
            {loading ? (
              <div className="space-y-4 flex-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : upcomingDeadlines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-gray-505">
                <Calendar className="w-8 h-8 text-gray-450 mb-2" />
                <p className="text-sm font-semibold">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">No deadlines in the next 7 days.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map(task => {
                  const daysLeft = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-red-50/30 border border-red-100/50 rounded-xl">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-905 truncate">{task.taskName}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Due: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${daysLeft <= 1 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {daysLeft === 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
