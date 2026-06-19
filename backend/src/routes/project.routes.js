const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const projectController = require('../controllers/project.controller');
const auth = require('../middleware/auth.middleware');

router.use(auth);

router.route('/')
  .get(projectController.getAll)
  .post([
    body('projectName').notEmpty().withMessage('Project name is required'),
    body('status').optional().isIn(['Not Started', 'In Progress', 'Completed'])
  ], projectController.create);

router.route('/:id')
  .get(projectController.getOne)
  .put([
    body('projectName').optional().notEmpty(),
    body('status').optional().isIn(['Not Started', 'In Progress', 'Completed'])
  ], projectController.update)
  .delete(projectController.remove);

module.exports = router;
