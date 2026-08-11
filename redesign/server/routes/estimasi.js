import express from 'express';
import EstimasiController from '../controllers/EstimasiController.js';

const router = express.Router();

// GET /api/estimasi/kalkulasi
router.get('/kalkulasi', (req, res) => EstimasiController.getKalkulasi(req, res));

// GET /api/estimasi/simulasi-beban
router.get('/simulasi-beban', (req, res) => EstimasiController.simulasiBeban(req, res));

export default router;
