import express from 'express';
import { getLeads, getLead, createLead, updateLead, deleteLead, assignLead, bulkImport } from '../controllers/leadController.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getLeads);
router.post('/', createLead);
router.get('/:id', getLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.put('/:id/assign', assignLead);
router.post('/bulk-import', upload.single('file'), bulkImport);

export default router;
