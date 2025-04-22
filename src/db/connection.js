const { MongoClient } = require('mongodb');
const dbConfig = require('../config/db.config');

// Client variable to store connection
let client;
let clientPromise;

// Create and export a cached connection promise
if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to maintain connection
  // between hot reloads
  if (!global._mongoClientPromise) {
    client = new MongoClient(dbConfig.uri);
    global._mongoClientPromise = client.connect()
      .then(client => {
        console.log('✅ Successfully connected to MongoDB Atlas');
        console.log(`📊 Using database: ${dbConfig.dbName}`);
        return client;
      })
      .catch(err => {
        console.error('❌ MongoDB Atlas connection error:', err);
        throw err;
      });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, create a new connection for each instance
  client = new MongoClient(dbConfig.uri);
  clientPromise = client.connect()
    .then(client => {
      console.log('Successfully connected to MongoDB Atlas');
      return client;
    })
    .catch(err => {
      console.error('❌ MongoDB Atlas connection error:', err);
      throw err;
    });
}

/**
 * Get database instance
 * @returns {Promise<Db>} MongoDB database instance
 */
async function getDb() {
  const client = await clientPromise;
  return client.db(dbConfig.dbName);
}

/**
 * Get a collection from the database
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Collection>} MongoDB collection
 */
async function getCollection(collectionName) {
  const db = await getDb();
  return db.collection(collectionName);
}

/**
 * List all collections in the database
 * @returns {Promise<string[]>} Array of collection names
 */
async function listCollections() {
  const db = await getDb();
  const collections = await db.listCollections().toArray();
  return collections.map(collection => collection.name);
}

module.exports = {
  clientPromise,
  getDb,
  getCollection,
  listCollections
}; 