import express from 'express';
import {
  createProjectTopic,
  getProjectTopics,
  getProjectTopicById,
  updateProjectTopic,
  deleteProjectTopic,
  getTopicsByCategory,
  getTrendingTopics
} from '../controllers/projectTopicController.js';

const router = express.Router();

// All routes are now public - no authentication required
router.get('/', getProjectTopics);
router.get('/trending', getTrendingTopics);
router.get('/category/:category', getTopicsByCategory);
router.get('/:id', getProjectTopicById);
router.post('/', createProjectTopic);
router.put('/:id', updateProjectTopic);
router.delete('/:id', deleteProjectTopic);

export default router;