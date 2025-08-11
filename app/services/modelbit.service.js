const axios = require('axios');
const config = require(`${__basedir}/config.js`);

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

module.exports = {
    callModelbitApi,
    callModelbitBatchApi
};
