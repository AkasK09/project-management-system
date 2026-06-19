const prisma = require('../config/db');
const { validationResult } = require('express-validator');
const { logActivity } = require('../utils/audit');

exports.getAll = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // RBAC: Admins get all projects, normal users get only their own
    const where = req.user.role === 'Admin' ? {} : { userId: req.user.id };
    
    if (search) {
      where.projectName = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;
    
    // Sorting fields validation
    const allowedSortFields = ['projectName', 'status', 'createdAt', 'startDate', 'endDate'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const [projects, total] = await Promise.all([
      prisma.project.findMany({ 
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { [sortField]: sortOrder }
      }),
      prisma.project.count({ where })
    ]);

    res.json({
      projects,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    // RBAC: Admins can get any project, users only their own
    const where = req.user.role === 'Admin' ? { id: parseInt(req.params.id) } : { id: parseInt(req.params.id), userId: req.user.id };
    const project = await prisma.project.findFirst({ where });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const data = { ...req.body };
    data.userId = req.user.id;
    
    if (data.startDate === '' || data.startDate === undefined || data.startDate === null) {
      data.startDate = null;
    } else {
      data.startDate = new Date(data.startDate);
    }

    if (data.endDate === '' || data.endDate === undefined || data.endDate === null) {
      data.endDate = null;
    } else {
      data.endDate = new Date(data.endDate);
    }

    const project = await prisma.project.create({ data });
    
    await logActivity(req.user.id, 'Create Project', `Created project: ${project.projectName}`, 'Project', project.id);
    
    res.status(201).json(project);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // RBAC check
    const where = req.user.role === 'Admin' ? { id: parseInt(req.params.id) } : { id: parseInt(req.params.id), userId: req.user.id };
    const project = await prisma.project.findFirst({ where });
    if (!project) return res.status(404).json({ message: 'Project not found or forbidden' });

    const dataToUpdate = { ...req.body };
    
    if ('startDate' in dataToUpdate) {
      if (dataToUpdate.startDate === '' || dataToUpdate.startDate === null || dataToUpdate.startDate === undefined) {
        dataToUpdate.startDate = null;
      } else {
        dataToUpdate.startDate = new Date(dataToUpdate.startDate);
      }
    }

    if ('endDate' in dataToUpdate) {
      if (dataToUpdate.endDate === '' || dataToUpdate.endDate === null || dataToUpdate.endDate === undefined) {
        dataToUpdate.endDate = null;
      } else {
        dataToUpdate.endDate = new Date(dataToUpdate.endDate);
      }
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: dataToUpdate
    });

    await logActivity(req.user.id, 'Update Project', `Updated project: ${updated.projectName}`, 'Project', updated.id);
    
    res.json({ message: 'Updated successfully', project: updated });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    // RBAC check
    const where = req.user.role === 'Admin' ? { id: parseInt(req.params.id) } : { id: parseInt(req.params.id), userId: req.user.id };
    const project = await prisma.project.findFirst({ where });
    if (!project) return res.status(404).json({ message: 'Project not found or forbidden' });

    await prisma.project.delete({
      where: { id: project.id }
    });

    await logActivity(req.user.id, 'Delete Project', `Deleted project: ${project.projectName}`, 'Project', project.id);
    
    res.json({ message: 'Deleted successfully' });
  } catch (err) { next(err); }
};
