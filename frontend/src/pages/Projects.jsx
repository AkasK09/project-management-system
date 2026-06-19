import React, { useEffect, useState } from 'react';
import api from '../services/api';
import ProjectModal from '../components/ProjectModal';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, Clock, CheckCircle2, MoreVertical, ArrowUpDown } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination & Sorting States
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/projects?search=${search}&status=${statusFilter}&page=${page}&limit=6&sortBy=${sortBy}&order=${order}`
      );
      setProjects(res.data.projects || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, sortBy, order]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter, page, sortBy, order]);

  const handleOpenModal = (project = null) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingProject(null);
    setIsModalOpen(false);
  };

  const handleSaveProject = async (data) => {
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, data);
        toast.success('Project updated successfully');
      } else {
        await api.post('/projects', data);
        toast.success('Project created successfully');
      }
      fetchProjects();
      handleCloseModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save project');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/projects/${id}`);
        toast.success('Project deleted successfully');
        fetchProjects();
      } catch (error) {
        toast.error('Failed to delete project');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-250';
      case 'In Progress':
        return 'bg-blue-50 text-blue-700 border-blue-250';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-250';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Projects</h1>
          <p className="text-gray-500 mt-1">Manage, organize, and monitor your active projects.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md transition duration-200"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Filters & Sorting section */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Filter className="w-5 h-5 text-gray-400 hidden sm:block" />
          
          {/* Status Filter */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ArrowUpDown className="w-5 h-5 text-gray-400 hidden sm:block" />
            <select
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('-');
                setSortBy(field);
                setOrder(dir);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="projectName-asc">Name (A-Z)</option>
              <option value="projectName-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl h-48 border border-gray-100 shadow-sm animate-pulse flex flex-col p-5">
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-auto"></div>
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No projects found</h3>
          <p className="text-gray-500 max-w-sm mb-6">Get started by creating a new project to organize your tasks and track progress.</p>
          <button 
            onClick={() => handleOpenModal()}
            className="text-blue-600 font-medium hover:text-blue-700"
          >
            + Create your first project
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <Link to={`/projects/${p.id}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-1 flex-1 pr-4">
                    {p.projectName}
                  </Link>
                  <div className="relative group/menu">
                    <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 py-1">
                      <button 
                        onClick={() => handleOpenModal(p)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)}
                        className="w-full text-left px-4 py-2 text-sm text-red-650 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                  {p.description || 'No description provided.'}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(p.status)} flex items-center`}>
                    {p.status === 'Completed' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <Clock className="w-3.5 h-3.5 mr-1" />}
                    {p.status}
                  </span>
                  
                  {p.endDate && (
                    <span className="text-xs text-gray-505 flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {new Date(p.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
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

      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSubmit={handleSaveProject} 
        project={editingProject} 
      />
    </div>
  );
}
