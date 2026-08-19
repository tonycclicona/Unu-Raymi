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

const router = Router();

// Rutas Públicas (Pasajero / Checkout)
router.get('/schema', getActiveFormSchema);
router.post('/evaluate', submitPassengerEvaluations);

// Rutas de Administración (Admin Dashboard)
router.get('/admin/questions', getQuestionsAdmin);
router.post('/admin/questions', upsertQuestionAdmin);
router.delete('/admin/questions/:id', deleteQuestionAdmin);

router.get('/admin/rules', getRiskRulesAdmin);
router.post('/admin/rules', upsertRiskRuleAdmin);

router.get('/admin/evaluations', getEvaluationsAdmin);
router.get('/admin/evaluaciones', getEvaluationsAdmin);
router.put('/admin/evaluations/:id/dictamen', updateEvaluationDictamenAdmin);
router.put('/admin/evaluaciones/:id/dictamen', updateEvaluationDictamenAdmin);

export default router;
