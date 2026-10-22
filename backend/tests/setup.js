const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
require('dotenv').config();

let mongod;

// Connect to the in-memory database before tests run
beforeAll(async () => {
  // Create an instance of MongoMemoryServer and start it
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Set the MongoDB URL to the in-memory instance
  process.env.MONGO_URI = uri;
  
  // Connect to the in-memory database
  // MongoDB driver 7.6+ loads its os adapter with a dynamic import(), which
  // Jest's VM sandbox rejects; hand it Node's os module directly instead.
  await mongoose.connect(uri, { runtimeAdapters: { os: require('os') } });
});

// Clear all collections after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Disconnect from and stop the database after all tests are done
afterAll(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});