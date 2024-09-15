//globalFunction.js

function fetchNutritionixAPI(UPC, APP_ID, API_KEY) {
    const axios = require('axios');

    return axios.get('https://trackapi.nutritionix.com/v2/search/item', {
        params: { upc: UPC},
        headers: {
            'x-app-id': APP_ID,
            'x-app-key': API_KEY,
            'x-remote-user-id': '0'
        },
        validateStatus: function (status) {
            return status >= 200 && status < 500; // Treat only 5xx status codes as errors
        }
    })

    .then(response => {
        const productData = response.data;
        const responseStatus = response.status;
        if (responseStatus === 404) {
            return -1;
        }
        if (productData && productData.foods && productData.foods.length > 0) {
            return productData.foods[0];  // Return the first food item
        } else {
            throw new Error('No food item found for the given UPC.');
        }
    })

    .catch(error => {
        throw error;
    });
}

module.exports = { fetchNutritionixAPI };