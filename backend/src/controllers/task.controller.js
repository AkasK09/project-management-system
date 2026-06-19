const prisma = require('../config/db');
const { validationResult } = require('express-validator');
const { logActivity } = require('../utils/audit');

exports.getAll = async (req, res, next) => {
  try {
    const { search, status, priority, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // RBAC: Admins get all tasks, normal users get only their own
    const where = req.user.role === 'Admin' ? {} : { project: { userId: req.user.id } };

    if (search) {
      where.taskName = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }

    const skip = (page - 1) * limit;

    // Sorting fields validation
    const allowedSortFields = ['taskName', 'status', 'priority', 'dueDate', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { [sortField]: sortOrder },
        include: { project: { select: { projectName: true } } }
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      tasks,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) { next(err); }
};

exports.getByProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    
    // RBAC: Admins can query any project, users only their own
    const where = { projectId: parseInt(projectId) };
    if (req.user.role !== 'Admin') {
      where.project = { userId: req.user.id };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    // RBAC check
    const where = req.user.role === 'Admin' ? { id: parseInt(req.params.id) } : { id: parseInt(req.params.id), project: { userId: req.user.id } };
    const task = await prisma.task.findFirst({ where });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // RBAC check on project ownership
    const projectWhere = req.user.role === 'Admin' ? { id: parseInt(req.body.projectId) } : { id: parseInt(req.body.projectId), userId: req.user.id };
    const project = await prisma.project.findFirst({ where: projectWhere });
    if (!project) return res.status(403).json({ message: 'Forbidden: Project not owned by user or does not exist' });

    const task = await prisma.task.create({ data: {
      projectId: parseInt(req.body.projectId),
      taskName: req.body.taskName,
      description: req.body.description,
      priority: req.body.priority,
      status: req.body.status,
      dueDate: (req.body.dueDate && req.body.dueDate !== '') ? new Date(req.body.dueDate) : null
    } });

    await logActivity(req.user.id, 'Create Task', `Created task: ${task.taskName} inside project: ${project.projectName}`, 'Task', task.id);

    res.status(201).json(task);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // RBAC check
    const where = req.user.role === 'Admin' ? { id: parseInt(req.params.id) } : { id: parseInt(req.params.id), project: { userId: req.user.id } };
    const task = await prisma.task.findFirst({ where });
    if (!task) return res.status(404).json({ message: 'Task not found or forbidden' });

    const dataToUpdate = { ...req.body };
    if ('dueDate' in dataToUpdate) {
      dataToUpdate.dueDate = (dataToUpdate.dueDate && dataToUpdate.dueDate !== '') ? new Date(dataToUpdate.dueDate) : null;
    }
    if (dataToUpdate.projectId) {
      dataToUpdate.projectId = parseInt(dataToUpdate.projectId);
    }

    const updated = await prisma.task.update({ where: { id: task.id }, data: dataToUpdate });

    await logActivity(req.user.id, 'Update Task', `Updated task: ${updated.taskName}`, 'Task', updated.id);

    res.json({ message: 'Task updated', task: updated });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    // RBAC check
    const where = req.user.role === 'Admin' ? { id: parseInt(req.params.id) } : { id: parseInt(req.params.id), project: { userId: req.user.id } };
    const task = await prisma.task.findFirst({ where });
    if (!task) return res.status(404).json({ message: 'Task not found or forbidden' });

    await prisma.task.delete({ where: { id: task.id } });

    await logActivity(req.user.id, 'Delete Task', `Deleted task: ${task.taskName}`, 'Task', task.id);

    res.json({ message: 'Task deleted' });
  } catch (err) { next(err); }
};
