const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

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

module.exports = {
    generateCharts,
    generateAggregatedCharts,
    aggregateResults
};
