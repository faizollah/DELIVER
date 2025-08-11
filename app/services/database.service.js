const { Pool } = require('pg');
const config = require(`${__basedir}/config.js`);

const pool = new Pool(config.dbConfig);

async function ensureTableExists() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS sentiment_logs (
                id SERIAL PRIMARY KEY,
                input_text TEXT NOT NULL,
                sentiment VARCHAR(255) NOT NULL,
                confidence REAL NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } finally {
        client.release();
    }
}

async function logAnalysis(text, sentiment, confidence) {
    const client = await pool.connect();
    try {
        const query = 'INSERT INTO sentiment_logs (input_text, sentiment, confidence) VALUES ($1, $2, $3)';
        await client.query(query, [text, sentiment, confidence]);
    } finally {
        client.release();
    }
}

module.exports = {
    ensureTableExists,
    logAnalysis
};
