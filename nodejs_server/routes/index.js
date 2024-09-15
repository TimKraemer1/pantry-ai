// routes/index.js
require('dotenv').config()
const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { connectToDatabase, connectPantryDatabase } = require('../models/db');
const { fetchNutritionixAPI } = require('../globalFunctions');

const APP_ID = process.env.NODE_NUTRITIONIX_APP_ID;
const API_KEY = process.env.NODE_NUTRITIONIX_API_KEY;

router.get('/api/food-items/sku/:sku', async (req, res) => {
	console.log('here');
	try {
		const {sku} = req.params;
		const foodItem = await fetchNutritionixAPI(sku, APP_ID, API_KEY);

		if (foodItem === -1) {
			res.status(404).json({message: 'Food item not found in NutritionixAPI database'});
			return;
		}
		const responseObject = {
			status: 'Success',
			message: 'Food item found',
			sku_num: sku,
			item_name: foodItem.food_name
		};
		res.status(200).json(responseObject);
	} catch (error) {
		res.status(500).json({message: 'Internal Server Error'});
		console.log('Error: ', error);
	}
});

/**
 * @route POST /api/food-items/
 * @description Create a new food item entry in pantry database without SKU
 * @access Public
 * 
 * @param {Object} req - The request object containing user data.
 * @param {string} req.body.food_name - The name of the item
 * @param {string} req.body.location - pantry, fridge, freezer
 * @param {string} req.body.identifier - Dairy, meat, vegetables, grains/carbs, fruits, legumes, nuts/seeds, oils/fats, condiments/sauces, beverages
 * 
 * @returns {Object} 200 - Success adding food item into database
 * @returns {Object} 500 - Error with code, Internal server error
 */
router.post('/api/food-items', async (req, res) => {
	try {
		const food_name = req.body.food_name;
		const location = req.body.location;
		const identifier = req.body.identifier;

		const newUUID = uuidv4();

		const db = await connectPantryDatabase();
		const collection = db.collection('pantrycollection');

		const item_exists = await collection.findOne({ itemName: food_name });

		if (item_exists) {
			// Use MongoDB's $inc operator to increment the amount
			const result = await collection.updateOne(
			  { itemName: food_name },
			  { $inc: { amount: 1 } }  // Increment amount by 1
			);
			if (result.modifiedCount > 0) {
				res.status(200).json({message: 'Food item present, amount updated'});
				return;
			} else {
				res.status(500).json({message: 'Error updating item amount in database'});
				return;
			}
		}

		const foodItemInsert = {
			UUID: newUUID,
			skuID: -1,
			itemName: food_name,
			location: location,
			identifier: identifier,
			amount: 1,
		};
		const result = await collection.insertOne(foodItemInsert);

		if (result.acknowledged) {
			res.status(200).json({message: 'Food item successfully entered'});
		}
		else {
			res.status(500).json({message: 'Error entering food item'});
		}

	}catch (error) {
		res.status(500).send('Internal Server Error\n');
	}
})

/**
 * @route DELETE /api/food-items/:id
 * @description Deletes a food item from the database
 * @access Public
 * 
 * @param {Object} req - The request object containing user data.
 * @param {string} req.params.id - the UUID of the food item to be deleted
 * 
 * @returns {Object} 200 - Success deleting food item from database
 * @returns {Object} 500 - Error with code, Internal server error
 * @returns {Object} 404 - Food item not found 
 */
router.delete('/api/food-items/:id', async (req, res) => {
	const { id } = req.params;
	const db = await connectPantryDatabase();
	const collection = db.collection('pantrycollection');

	try {
		// use mongodb deleteOne function
		const result = await collection.deleteOne({ UUID: id });
		if(result.deletedCount > 0) { //Check if deleted count greater than 0
			res.status(200).json({ message: 'Food item deleted' });
		} else {
			res.status(404).json({ message: 'Food item not found' });
		}
	} catch (error) {
		console.error('Error deleting food item:', error);
        res.status(500).json({ message: 'Internal Server Error' });
	}
		
})

/**
 * @route GET /api/food-items/:id
 * @description Fetches food item info based on provided UUID, meant for html tile clicking? Might not be necessary
 * @access Public
 * 
 * @param {Object} req - The request object containing user data.
 * @param {string} req.params.id - the UUID of the food item to be fetched
 * 
 * @returns {Object} 200 - Success deleting food item from database
 * @returns {Object} 500 - Error with code, Internal server error
 * @returns {Object} 404 - Food item not found 
 */
router.get('/api/food-items/:id', async (req, res) => {
	const { id } = req.params;

	const db = await connectPantryDatabase();
	const collection = db.collection('pantrycollection');

	try {
		const foodItem = await collection.findOne({ UUID: id });
	if(foodItem) {
		res.status(200).json({message: 'Success', data: foodItem});
	} else {
		res.status(404).json({message: 'Food item not found'});
	}
	} catch (error) {
		console.error('Error retrieving food item:', error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
})

/**
 * @route GET /api/pantry/clear
 * @description Clears pantry of all items, rendering it empty
 * @access Public
 * 
 * @param {Object} req - The request object containing user data.
 * 
 * @returns {Object} 200 - Success deleting all food items from database
 * @returns {Object} 500 - Error with code, Internal server error
 */
router.get('/api/pantry/clear', async (req, res) => {
	const db = await connectPantryDatabase();
	const collection = db.collection('pantrycollection');
	try {
        const result = await collection.deleteMany({});
		res.status(200).json({ message: 'Deleted - items from the collection'})
		return;
    } catch (error) {
		res.status(500).json({message: 'Internal Server Error'})
		return;
	}
})

/**
 * @route GET api/pantry/debug
 * @description Returns contents of pantry in json format
 * @access Public
 * 
 * @param {Object} req - The request object containing user data.
 * 
 * @returns {Object} 200 - Success fetching and displaying food items in pantry
 * @returns {Object} 500 - Error with code, Internal server error
 */
router.get('/api/pantry/contents/location/:location', async (req, res) => {
	const {locate} = req.params;
	const db = await connectPantryDatabase();
	const collection = db.collection('pantrycollection');
    try {
        const documents = await collection.find({location: locate}).toArray();
        console.log('Collection Data:');
        console.log(JSON.stringify(documents, null, 2));
		res.status(200).json(documents)
    } catch (error) {
        console.error('Error retrieving documents:', error);
		res.status(500).json({ message: 'Internal Server Error' });
    }
})

router.get('/api/pantry/contents', async (req, res) => {
	const db = await connectPantryDatabase();
	const collection = db.collection('pantrycollection');
	try {
		const documents = await collection.find({}).toArray();
		console.log('Collection Data:');
		console.log(JSON.stringify(documents, null, 2));
		res.status(200).json(documents);
	} catch (error) {
		console.error('Error retrieving documents:', error);
		res.status(500).json({ message: 'Internal Server Error' });
	}
})

/**
 * @route GET api/pantry/items
 * @description Returns data for a specific item from search parameters
 * @access Public
 * 
 * @param {Object} req - The request object containing user data.
 * @param {String} req.param.food_name - name of item being searched for
 * 
 * @returns {Object} 200 - Success finding item, item data in json format
 * @returns {Object} 404 - Failure finding item
 * @returns {Object} 500 - Error with code, Internal server error
 */
router.get('/api/pantry/items', async (req, res) => {
	const db = await connectPantryDatabase();
	const collection = db.collection('pantrycollection');
	try {
		const category = req.query.category;	//Food item category
		const name = req.query.itemName;		//Name of food item
		const location = req.query.location;	//Location of food item
		
		//fetch items from database with specific parameters
		const query = {};
		if(category) query.identifier = category;
		if(name) query.itemName = name;
		if(location) query.location = location;

		const documents = await collection.find(query).toArray();
		console.log('Returned Pantry Items Query:');
		console.log(JSON.stringify(documents, null, 2));
		res.status(200).json(documents);

	} catch (error) {
		console.error(error);
		res.status(500).send('Internal Server Error');
	}
});

router.get('/api/item-stock/:item', async (req, res) => {
	try {
		const item = req.params.item;
		console.log(item);
	} catch (error) {
		console.log(error);
		res.status(500).send('Internal Server Error');
	}
});


//TEST ENDPOINTS FOR API

router.get('/api/hello-world', async (req, res) => {
	res.send('Hello World!');
});

router.get('/api/nutrionix-api', async (req, res) => {
	console.log('Nutritionix API Test UPC Black Beans');
	axios.get('https://trackapi.nutritionix.com/v2/search/item', {
    params: { upc: UPC },
    headers: {
        'x-app-id': APP_ID,
        'x-app-key': API_KEY,
        'x-remote-user-id': '0'
    }
	})

	.then(response => {
		// Parse and log the response data
		const productData = response.data;
		console.log('Product Data:', productData);
	
		// Access specific fields from the response
		if (productData && productData.foods && productData.foods.length > 0) {
			const foodItem = productData.foods[0];  // Assuming we want the first item
			console.log('Food Item Name:', foodItem.food_name);
			console.log('Calories:', foodItem.nf_calories);
			console.log('Serving Size:', foodItem.serving_qty, foodItem.serving_unit);
		} else {
			console.log('No food item found for the given UPC.');
		}
	})

	.catch(error => {
		console.error('Error fetching product data:', error);
	});
})

router.get('/api/uuid', async (req, res) => {
	const myUUID = uuidv4();
	console.log(myUUID);
	res.status(200).send('Success');

})

module.exports = router;
