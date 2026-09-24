import { Router } from 'express';
import {
  getActiveFormSchema,
  submitPassengerEvaluations,
  getQuestionsAdmin,
  upsertQuestionAdmin,
  deleteQuestionAdmin,
  getRiskRulesAdmin,
  upsertRiskRuleAdmin,
  getEvaluationsAdmin,
  updateEvaluationDictamenAdmin,
} from '../controllers/formEngineController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// Rutas Públicas (Pasajero / Checkout)
router.get('/schema', getActiveFormSchema);
router.post('/evaluate', submitPassengerEvaluations);

// Rutas de Administración (Admin Dashboard) — Protegidas con JWT
router.get('/admin/questions', requireAuth, getQuestionsAdmin);
router.post('/admin/questions', requireAuth, upsertQuestionAdmin);
router.delete('/admin/questions/:id', requireAuth, deleteQuestionAdmin);

router.get('/admin/rules', requireAuth, getRiskRulesAdmin);
router.post('/admin/rules', requireAuth, upsertRiskRuleAdmin);

router.get(['/admin/evaluations', '/admin/evaluaciones'], requireAuth, getEvaluationsAdmin);
router.put(['/admin/evaluations/:id/dictamen', '/admin/evaluaciones/:id/dictamen'], requireAuth, updateEvaluationDictamenAdmin);

export default router;
