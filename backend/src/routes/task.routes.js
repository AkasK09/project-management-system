const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const taskController = require('../controllers/task.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);

router.route('/')
  .get(taskController.getAll)
  .post([
    body('taskName').notEmpty().withMessage('Task name is required'),
    body('projectId').notEmpty().withMessage('Project ID is required'),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
    body('status').optional().isIn(['Pending', 'In Progress', 'Completed'])
  ], taskController.create);

router.route('/project/:projectId').get(taskController.getByProject);

router.route('/:id')
  .get(taskController.getOne)
  .put([
    body('taskName').optional().notEmpty(),
    body('priority').optional().isIn(['Low', 'Medium', 'High']),
    body('status').optional().isIn(['Pending', 'In Progress', 'Completed'])
  ], taskController.update)
  .delete(taskController.remove);

module.exports = router;
