const mysql = require('mysql');
const config = require('../config');

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

module.exports = {
    logAnalysis
};
