const prisma = require('../config/db');

async function logActivity(userId, action, details, entityType = null, entityId = null) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId ? parseInt(entityId) : null,
        details: typeof details === 'string' ? details : JSON.stringify(details),
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

module.exports = { logActivity };
