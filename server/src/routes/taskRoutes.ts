import { Router } from 'express';
import { 
  createTask, 
  getTasks, 
  getTaskById, 
  updateTask, 
  deleteTask, 
  transitionStatus, 
  approveTask, 
  rejectTask, 
  addComment, 
  addAttachment, 
  toggleChecklistItem,
  getMyTasks
} from '../controllers/taskController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';

const router = Router();

// Apply auth middlewares globally for all task operations
router.use(authenticateJWT);
router.use(tenantIsolated);

router.post('/', createTask);
router.get('/my', getMyTasks);
router.get('/', getTasks);
router.get('/:id', getTaskById);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

router.patch('/:id/status', transitionStatus);
router.patch('/:id/approve', approveTask);
router.patch('/:id/reject', rejectTask);

router.post('/:id/comment', addComment);
router.post('/:id/attachment', addAttachment);
router.post('/:id/checklist', toggleChecklistItem);

export default router;
