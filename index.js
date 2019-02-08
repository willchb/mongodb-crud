const { MongoClient } = require('mongodb');

exports.createConnector = ({
  username = process.env.DBUSER,
  password = process.env.DBPASS || '',
  host = process.env.DBHOST || 'localhost',
  port = process.env.DBPORT || '27017',
  options = JSON.parse(process.env.DBOPTS || '{}'),
  url = process.env.DBURL || (username ? `mongodb://${username}:${password}@${host}:${port}` : `mongodb://${host}:${port}`),
  client = new MongoClient(url, Object.assign({ useNewUrlParser: true }, options)),
} = {}, conn = null) => async () => await client.isConnected() ? conn : conn = await client.connect();

