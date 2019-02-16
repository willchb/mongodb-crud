const { MongoClient, ObjectId } = require('mongodb');

const getConnectionURL = ({ username, password, database, host, port }) => username
  ? `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
  : `mongodb://${host}:${port}`;

const createConnector = ({
  username = process.env.DBUSER,
  password = process.env.DBPASS || '',
  database = process.env.DBNAME || 'admin',
  host = process.env.DBHOST || 'localhost',
  port = process.env.DBPORT || '27017',
  options = JSON.parse(process.env.DBOPTS || '{}'),
  url = process.env.DBURL || getConnectionURL({ username, password, database, host, port }),  
  client = new MongoClient(url, Object.assign({ useNewUrlParser: true }, options)),
} = {}, conn = null) => async () => await client.isConnected() ? conn : conn = await client.connect();

const createCRUDFromOptions = ({ collection, connector = createConnector(), database = process.env.DBNAME }) => {
  if (typeof database !== 'string' || !database.trim()) throw new TypeError('Must provide the database name to create a CRUD');
  if (typeof collection !== 'string' || !collection.trim()) throw new TypeError('Must provide the collection name to create a CRUD');

  const conn = async () => (await connector()).db(database.trim()).collection(collection.trim());

  const insertOne = async (...args) => (await conn()).insertOne(...args);
  const findOne = async (...args) => (await conn()).findOne(...args);
  const findToArray = async (...args) => (await conn()).find(...args).toArray();
  const replaceOne = async (...args) => (await conn()).replaceOne(...args);
  const updateOne = async (...args) => (await conn()).updateOne(...args);
  const updateMany = async (...args) => (await conn()).updateMany(...args);
  const deleteOne = async (...args) => (await conn()).deleteOne(...args);
  const deleteMany = async (...args) => (await conn()).deleteMany(...args);

  return {
    async create(document) {
      return await insertOne(document), document._id;
    },
    async read(queryOrDocId = {}, { skip = 0, limit = 100, sort } = {}) {
      let op, args;

      if (typeof queryOrDocId === 'string' || queryOrDocId instanceof ObjectId || queryOrDocId._id) {
        op = findOne;
        args = [{ _id: ObjectId(queryOrDocId._id || queryOrDocId) }];
      } else {
        op = findToArray;
        args = [queryOrDocId, { skip, limit, sort }];
      }

      return op(...args);
    },
    async update(queryOrDocOrId, docFragment = queryOrDocOrId) {
      let op, args;

      if (docFragment === queryOrDocOrId) {
        op = replaceOne;
        args = [{ _id: ObjectId(queryOrDocOrId._id) }, docFragment];
      } else if (typeof queryOrDocOrId === 'string' || queryOrDocOrId instanceof ObjectId || queryOrDocOrId._id) {
        op = updateOne;
        args = [{ _id: ObjectId(queryOrDocOrId._id || queryOrDocOrId) }, { $set: docFragment }];
      } else {
        op = updateMany;
        args = [queryOrDocOrId, { $set: docFragment }];
      }
      delete docFragment._id;

      return (await op(...args)).modifiedCount;
    },
    async delete(queryOrDocOrId) {
      let op, args;

      if (typeof queryOrDocOrId === 'string' || queryOrDocOrId instanceof ObjectId || queryOrDocOrId._id) {
        op = deleteOne;
        args = [{ _id: ObjectId(queryOrDocOrId._id || queryOrDocOrId) }];
      } else {
        op = deleteMany;
        args = [queryOrDocOrId];
      }

      return (await op(...args)).deletedCount;
    }
  };
};

const createCRUD = (connector, database, collection) =>
  createCRUDFromOptions(typeof connector === 'function' ? { connector, database, collection } : connector);

module.exports = { createCRUD, createConnector, getConnectionURL };
