const { MongoClient, ObjectId } = require('mongodb');

exports.createConnector = ({
  username = process.env.DBUSER,
  password = process.env.DBPASS || '',
  host = process.env.DBHOST || 'localhost',
  port = process.env.DBPORT || '27017',
  options = JSON.parse(process.env.DBOPTS || '{}'),
  url = process.env.DBURL || (username ? `mongodb://${username}:${password}@${host}:${port}` : `mongodb://${host}:${port}`),
  client = new MongoClient(url, Object.assign({ useNewUrlParser: true }, options)),
} = {}, conn = null) => async () => await client.isConnected() ? conn : conn = await client.connect();

exports.createCRUD = exports.createCrud = (connector, database, collection) => {
  const conn = async () => (await connector()).db(database).collection(collection);

  const insertOne = async (...args) => (await conn()).insertOne(...args);
  const findOne = async (...args) => (await conn()).findOne(...args);
  const findToArray = async (...args) => (await conn()).find(...args).toArray();

  return {
    async create(document) {
      return await insertOne(document), document._id;
    },
    async read(queryOrDocId, { skip = 0, limit = 100, sort } = {}) {
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
  };
};
