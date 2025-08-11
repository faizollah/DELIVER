const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('index');
});

router.get('/analysis', (req, res) => {
    res.render('analysis');
});

router.get('/practice_search', (req, res) => {
    res.render('practice_search');
});

module.exports = router;
