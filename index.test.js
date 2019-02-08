const { describe, it } = require('mocha');
const { expect } = require('chai');
const { MongoClient } = require('mongodb');
const { createConnector, createCRUD } = require('./index');

describe('createConnector', () => {

  it('connects to localhost:27017 when no argument is given', async () => {
    const connector = createConnector();
    const conn = await connector();

    expect(conn.s.url).to.be.equal('mongodb://localhost:27017');
    expect(await conn.isConnected()).to.be.true;

    conn.close();
  });

  it('connects to url defined by env var when no argument is given', async () => {
    process.env.DBURL = 'mongodb://127.0.0.1:27017';

    const connector = createConnector();
    const conn = await connector();

    expect(conn.s.url).to.be.equal('mongodb://127.0.0.1:27017');
    expect(await conn.isConnected()).to.be.true;

    conn.close();
    delete process.env.DBURL;
  });

  it('connects to host and port defined by env var when no argument is given', async () => {
    process.env.DBHOST = '127.0.0.1';
    process.env.DBPORT = '27017';

    const connector = createConnector();
    const conn = await connector();

    expect(conn.s.url).to.be.equal('mongodb://127.0.0.1:27017');
    expect(await conn.isConnected()).to.be.true;

    conn.close();
    delete process.env.DBHOST;
    delete process.env.DBPORT;
  });

  it('connects to host and port with authentication defined by env var when no argument is given', async () => {
    process.env.DBUSER = 'admin';
    process.env.DBPASS = 'pass';
    process.env.DBHOST = '127.0.0.1';
    process.env.DBPORT = '27017';

    const connector = createConnector();
    const conn = await connector();

    expect(conn.s.url).to.be.equal('mongodb://admin:pass@127.0.0.1:27017');
    expect(await conn.isConnected()).to.be.true;

    conn.close();
    delete process.env.DBUSER;
    delete process.env.DBPASS;
    delete process.env.DBHOST;
    delete process.env.DBPORT;
  });

  it('connects to given url', async () => {
    process.env.DBURL = 'mongodb://dummyhost:12345';
    process.env.DBHOST = 'dummyhost';
    process.env.DBPORT = '12345';

    const connector = createConnector({
      host: 'ignorehost',
      port: 54321,
      url: 'mongodb://127.0.0.1:27017',
    });
    const conn = await connector();

    expect(conn.s.url).to.be.equal('mongodb://127.0.0.1:27017');
    expect(await conn.isConnected()).to.be.true;

    conn.close();
    delete process.env.DBURL;
    delete process.env.DBHOST;
    delete process.env.DBPORT;
  });

  it('connects to given host and port', async () => {
    process.env.DBHOST = 'dummyhost';
    process.env.DBPORT = '12345';

    const connector = createConnector({
      host: '127.0.0.1',
      port: 27017,
    });
    const conn = await connector();

    expect(conn.s.url).to.be.equal('mongodb://127.0.0.1:27017');
    expect(await conn.isConnected()).to.be.true;

    conn.close();
    delete process.env.DBHOST;
    delete process.env.DBPORT;
  });

  it('connects to given host and port with authentication', async () => {
    process.env.DBUSER = 'dummyuser';
    process.env.DBPASS = 'dummypass';
    process.env.DBHOST = 'dummyhost';
    process.env.DBPORT = '12345';

    const connector = createConnector({
      username: 'admin',
      password: 'pass',
      host: '127.0.0.1',
      port: 27017,
    });
    const conn = await connector();

    expect(conn.s.url).to.be.equal('mongodb://admin:pass@127.0.0.1:27017');
    expect(await conn.isConnected()).to.be.true;

    conn.close();
    delete process.env.DBUSER;
    delete process.env.DBPASS;
    delete process.env.DBHOST;
    delete process.env.DBPORT;
  });

  it('connects to given client', async () => {
    process.env.DBURL = 'mongodb://dummyhost:12345';
    process.env.DBHOST = 'dummyhost';
    process.env.DBPORT = '12345';

    const connector = createConnector({
      host: 'ignorehost',
      port: 54321,
      url: 'mongodb://unknownhost:10000',
      client: new MongoClient('mongodb://127.0.0.1:27017', { useNewUrlParser: true }),
    });
    const conn = await connector();

    expect(conn.s.url).to.be.equal('mongodb://127.0.0.1:27017');
    expect(await conn.isConnected()).to.be.true;

    conn.close();
    delete process.env.DBURL;
    delete process.env.DBHOST;
    delete process.env.DBPORT;
  });

  it('connects once, keeps connection open, and returns the same connection every time', async () => {
    const connector = createConnector();
    const conn1 = await connector();
    const conn2 = await connector();

    expect(conn1).to.equal(conn2);
    expect(await conn1.isConnected()).to.be.true;

    conn1.close();

    expect(await conn2.isConnected()).to.be.false;
  });
});

describe('createCRUD', () => {
  const connector = createConnector();

  before(async () => {
    await connector();
  });

  const crud = createCRUD(connector, 'test', 'test');

  it('returns an object of CRUD functions', () => {
    expect(crud).to.have.property('create').that.is.a('function');
  });

  it('creates a document', async () => {
    const doc = {
      propA: 'prop A of document',
      propB: 'prop B of document',
    };
    const _id = await crud.create(doc);

    expect(doc).to.have.property('_id');
    expect(doc._id.toString()).to.match(/^[0-9a-f]{24}$/);
    expect(doc._id).to.equal(_id);
  });

  after(async () => {
    (await connector()).close();
  });
});
