const modelbitService = require('../services/modelbit.service');
const googleService = require('../services/google.service');
const dbService = require('../services/database.service');
const chartService = require('../services/chart.service');
const config = require('../../config');

async function analyzeSingleReview(req, res) {
    const text = req.body.text;
    try {
        const sentimentResult = await modelbitService.callModelbitApi(config.sentimentDeploymentName, text);
        const multilabelResult = await modelbitService.callModelbitApi(config.multilabelDeploymentName, text);
        await dbService.logAnalysis(text, sentimentResult.sentiment, sentimentResult.confidence);
        const charts = await chartService.generateCharts(sentimentResult, multilabelResult);
        res.render('result', {
            text,
            sentimentResult,
            multilabelResult,
            charts
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'An error occurred during analysis.' });
    }
}

async function analyzePractice(req, res) {
    const place_id = req.params.place_id;
    try {
        const practiceDetails = await googleService.getPracticeDetails(place_id);
        const reviews = practiceDetails.reviews.map(review => review.text).filter(text => text && text.trim());
        
        if (reviews.length === 0) {
            return res.render('practice_results', { 
                practice_name: practiceDetails.name,
                error_message: 'No text reviews found for this practice.' 
            });
        }

        const batchData = reviews.map((review, i) => [i, review]);
        const sentimentBatchResults = await modelbitService.callModelbitBatchApi(config.sentimentDeploymentName, batchData);
        const multilabelBatchResults = await modelbitService.callModelbitBatchApi(config.multilabelDeploymentName, batchData);

        const aggregatedResults = chartService.aggregateResults(sentimentBatchResults, multilabelBatchResults);
        const charts = await chartService.generateAggregatedCharts(aggregatedResults);

        res.render('practice_results', {
            practice_name: practiceDetails.name,
            aggregatedResults,
            charts
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'An error occurred while analyzing the practice.' });
    }
}

async function searchPractices(req, res) {
    const query = req.body.query;
    try {
        const practices = await googleService.searchPractices(query);
        res.render('practice_search_results', { practices });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'An error occurred while searching for practices.' });
    }
}

module.exports = {
    analyzeSingleReview,
    analyzePractice,
    searchPractices
};
