const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysis.controller');

router.post('/analyze', analysisController.analyzeSingleReview);
router.post('/search', analysisController.searchPractices);
router.get('/analyze_practice/:place_id', analysisController.analyzePractice);

module.exports = router;
