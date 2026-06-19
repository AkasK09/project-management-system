import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import TaskModal from '../components/TaskModal';
import { Search, Filter, Plus, Calendar, CheckCircle2, Circle, Clock, AlertCircle, ArrowUpDown } from 'lucide-react';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Pagination & Sorting
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, priorityFilter, sortBy, order]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTasks();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter, priorityFilter, page, sortBy, order]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      params.append('page', page);
      params.append('limit', 8);
      params.append('sortBy', sortBy);
      params.append('order', order);
      
      const res = await api.get(`/tasks?${params.toString()}`);
      setTasks(res.data.tasks || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (task = null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSaveTask = async (data) => {
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.id}`, data);
        toast.success('Task updated successfully');
      } else {
        await api.post('/tasks', data);
        toast.success('Task created successfully');
      }
      fetchTasks();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${id}`);
        toast.success('Task deleted');
        fetchTasks();
      } catch {
        toast.error('Failed to delete task');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-emerald-505 bg-emerald-50';
      case 'In Progress': return 'text-amber-505 bg-amber-50';
      default: return 'text-slate-505 bg-slate-50';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'High': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'Medium': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return <Circle className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">All Tasks</h1>
          <p className="text-gray-500 mt-1">Manage tasks across all your projects</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md transition duration-200"
        >
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      {/* Filter and Sort section */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 items-center justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <Filter className="w-5 h-5 text-gray-400 hidden sm:block" />
          
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
          
          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          {/* Sort Selection */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ArrowUpDown className="w-5 h-5 text-gray-400 hidden sm:block" />
            <select
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('-');
                setSortBy(field);
                setOrder(dir);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="dueDate-asc">Due Date (Ascending)</option>
              <option value="dueDate-desc">Due Date (Descending)</option>
              <option value="taskName-asc">Name (A-Z)</option>
              <option value="taskName-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl h-20 border border-gray-100 shadow-sm animate-pulse"></div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks found</h3>
          <p className="text-gray-500 max-w-sm mb-6">Create a task to keep track of your to-dos across your projects.</p>
          <button onClick={() => handleOpenModal()} className="text-blue-600 font-medium hover:text-blue-700">
            + Create your first task
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <li key={task.id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {task.status === 'Completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div>
                      <h4 className={`text-base font-semibold ${task.status === 'Completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {task.taskName}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium">
                        <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          Project: {task.project?.projectName || 'Unknown'}
                        </span>
                        <span className={`px-2 py-1 rounded-md flex items-center gap-1 ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                          {getPriorityIcon(task.priority)}
                          {task.priority}
                        </span>
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-gray-500 border border-gray-200 px-2 py-1 rounded-md bg-white">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center sm:opacity-0 group-hover:opacity-100 transition-opacity gap-2 self-end sm:self-center">
                    <button 
                      onClick={() => handleOpenModal(task)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(task.id)}
                      className="px-3 py-1.5 text-sm font-medium text-red-650 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between border-t border-gray-150 pt-4 mt-6">
            <button
              disabled={page <= 1}
              onClick={() => setPage(prev => prev - 1)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 font-medium transition cursor-pointer"
            >
              Previous
            </button>
            <span className="text-sm font-semibold text-gray-600">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(prev => prev + 1)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 font-medium transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </>
      )}

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSubmit={handleSaveTask} 
        task={editingTask} 
      />
    </div>
  );
}
