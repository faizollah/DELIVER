const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const config = require('./config');
const axios = require('axios');
const mysql = require('mysql');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));

app.use(express.static(path.join(__dirname, 'static')));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

app.get('/practice_search.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'practice_search.html'));
});

app.post('/analyze', async (req, res) => {
    const text = req.body.text;
    try {
        const sentimentResult = await callModelbitApi(config.sentimentDeploymentName, text);
        const multilabelResult = await callModelbitApi(config.multilabelDeploymentName, text);

        await logAnalysis(text, sentimentResult.sentiment, sentimentResult.confidence);

        const charts = await generateCharts(sentimentResult, multilabelResult);

        res.render('result', {
            text,
            sentimentResult,
            multilabelResult,
            charts
        });
    } catch (error) {
        console.error(error);
        res.status(500).sendFile(path.join(__dirname, 'templates', 'error.html'));
    }
});

app.post('/search', async (req, res) => {
    const query = req.body.query;
    try {
        const practices = await searchPractices(query);
        res.render('practice_search_results', { practices });
    } catch (error) {
        console.error(error);
        res.status(500).sendFile(path.join(__dirname, 'templates', 'error.html'));
    }
});

app.get('/analyze_practice/:place_id', async (req, res) => {
    const place_id = req.params.place_id;
    try {
        const practiceDetails = await getPracticeDetails(place_id);
        const reviews = practiceDetails.reviews.map(review => review.text).filter(text => text && text.trim());
        
        if (reviews.length === 0) {
            return res.render('practice_results', { 
                practice_name: practiceDetails.name,
                error_message: 'No text reviews found for this practice.' 
            });
        }

        const batchData = reviews.map((review, i) => [i, review]);
        const sentimentBatchResults = await callModelbitBatchApi(config.sentimentDeploymentName, batchData);
        const multilabelBatchResults = await callModelbitBatchApi(config.multilabelDeploymentName, batchData);

        const aggregatedResults = aggregateResults(sentimentBatchResults, multilabelBatchResults);
        const charts = await generateAggregatedCharts(aggregatedResults);

        res.render('practice_results', {
            practice_name: practiceDetails.name,
            aggregatedResults,
            charts
        });

    } catch (error) {
        console.error(error);
        res.status(500).sendFile(path.join(__dirname, 'templates', 'error.html'));
    }
});

async function callModelbitApi(deploymentName, text) {
    const url = `https://${config.modelbitWorkspace}.${config.modelbitRegion}.modelbit.com/v1/${deploymentName}/latest`;
    const headers = {
        'Content-Type': 'application/json',
        'X-Modelbit-Api-Key': config.mbApiKey,
    };
    const body = {
        data: [[1, text]],
    };
    const response = await axios.post(url, body, { headers });
    return response.data.data[0][1];
}

async function generateCharts(sentimentResult, multilabelResult) {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 600 });
    
    const sentimentConfig = {
        type: 'pie',
        data: {
            labels: [sentimentResult.sentiment, 'Other'],
            datasets: [{
                data: [sentimentResult.confidence, 1 - sentimentResult.confidence],
                backgroundColor: ['#36a2eb', '#ff6384']
            }]
        },
    };

    const multilabelConfig = {
        type: 'bar',
        data: {
            labels: Object.keys(multilabelResult.all_probabilities),
            datasets: [{
                label: 'Probability',
                data: Object.values(multilabelResult.all_probabilities),
                backgroundColor: '#36a2eb'
            }]
        },
        options: {
            indexAxis: 'y',
        }
    };

    const sentimentImage = await chartJSNodeCanvas.renderToDataURL(sentimentConfig);
    const multilabelImage = await chartJSNodeCanvas.renderToDataURL(multilabelConfig);

    return { sentimentImage, multilabelImage };
}

async function searchPractices(query) {
    const url = `${config.placesApiBaseUrl}/textsearch/json`;
    const params = {
        query: `dental practice ${query}`,
        key: config.googlePlacesApiKey,
        type: 'dentist',
        language: 'en'
    };
    const response = await axios.get(url, { params });
    return response.data.results.map(p => ({
        place_id: p.place_id,
        name: p.name,
        address: p.formatted_address,
        rating: p.rating,
        user_ratings_total: p.user_ratings_total
    }));
}

async function getPracticeDetails(place_id) {
    const url = `${config.placesApiBaseUrl}/details/json`;
    const params = {
        place_id,
        fields: 'name,formatted_address,reviews',
        key: config.googlePlacesApiKey,
        language: 'en'
    };
    const response = await axios.get(url, { params });
    return response.data.result;
}

async function callModelbitBatchApi(deploymentName, batchData) {
    const url = `https://${config.modelbitWorkspace}.${config.modelbitRegion}.modelbit.com/v1/${deploymentName}/latest`;
    const headers = {
        'Content-Type': 'application/json',
        'X-Modelbit-Api-Key': config.mbApiKey,
    };
    const body = {
        data: batchData,
    };
    const response = await axios.post(url, body, { headers });
    return response.data.data;
}

function logAnalysis(text, sentiment, confidence) {
    return new Promise((resolve, reject) => {
        const connection = mysql.createConnection(config.dbConfig);
        connection.connect((err) => {
            if (err) {
                console.error('Database connection failed:', err.stack);
                return reject(err);
            }
            const query = 'INSERT INTO sentiment_logs (input_text, sentiment, confidence) VALUES (?, ?, ?)';
            connection.query(query, [text, sentiment, confidence], (error, results) => {
                connection.end(); // End connection in both cases
                if (error) {
                    console.error('Error logging to database:', error);
                    return reject(error);
                }
                resolve(results);
            });
        });
    });
}

function aggregateResults(sentimentResults, multilabelResults) {
    const sentimentCounts = {};
    const labelCounts = {};

    sentimentResults.forEach(result => {
        const sentiment = result[1].sentiment;
        sentimentCounts[sentiment] = (sentimentCounts[sentiment] || 0) + 1;
    });

    multilabelResults.forEach(result => {
        result[1].predicted_labels.forEach(label => {
            labelCounts[label] = (labelCounts[label] || 0) + 1;
        });
    });

    return { sentimentCounts, labelCounts };
}

async function generateAggregatedCharts(aggregatedResults) {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 600 });
    
    const sentimentConfig = {
        type: 'pie',
        data: {
            labels: Object.keys(aggregatedResults.sentimentCounts),
            datasets: [{
                data: Object.values(aggregatedResults.sentimentCounts),
                backgroundColor: ['#36a2eb', '#ff6384', '#ffcd56']
            }]
        },
    };

    const topLabels = Object.entries(aggregatedResults.labelCounts)
        .sort(([,a],[,b]) => b-a)
        .slice(0, 15);

    const multilabelConfig = {
        type: 'bar',
        data: {
            labels: topLabels.map(([label]) => label),
            datasets: [{
                label: 'Frequency',
                data: topLabels.map(([,count]) => count),
                backgroundColor: '#36a2eb'
            }]
        },
        options: {
            indexAxis: 'y',
        }
    };

    const sentimentImage = await chartJSNodeCanvas.renderToDataURL(sentimentConfig);
    const multilabelImage = await chartJSNodeCanvas.renderToDataURL(multilabelConfig);

    return { sentimentImage, multilabelImage };
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
