const axios = require('axios');
const config = require('../../config');

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

module.exports = {
    searchPractices,
    getPracticeDetails
};
