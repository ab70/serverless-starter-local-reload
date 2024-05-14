const { MongoClient, ServerApiVersion } = require("mongodb");
let cachedDb = null;

const connectToDatabase = async () => {
  const uri = process.env.MONGO_URL;
  if (cachedDb) {
    console.log("=> using cached database instance");
    return cachedDb;
  }
  console.log("=> Creating cached database instance");
  const client = new MongoClient(uri, {
    serverApi: ServerApiVersion.v1,
  });
  cachedDb = client.db(process.env.DB_NAME);
  return cachedDb;
};

module.exports = {connectToDatabase};
