const prisma = require('../config/db');

exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const totalProjects = await prisma.project.count({ where: { userId } });
    const inProgressProjects = await prisma.project.count({ where: { userId, status: 'In Progress' } });
    const totalTasks = await prisma.task.count({ where: { project: { userId } } });
    const completedTasks = await prisma.task.count({ where: { project: { userId }, status: 'Completed' } });
    const pendingTasks = await prisma.task.count({ where: { project: { userId }, status: 'Pending' } });

    res.json({
      totalProjects,
      inProgressProjects,
      totalTasks,
      completedTasks,
      pendingTasks
    });
  } catch (err) { next(err); }
};
