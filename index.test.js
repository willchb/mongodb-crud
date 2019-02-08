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
    expect(crud).to.have.property('read').that.is.a('function');
    expect(crud).to.have.property('update').that.is.a('function');
    expect(crud).to.have.property('delete').that.is.a('function');
  });

  let _id;

  it('creates a document', async () => {
    const doc = {
      propA: 'prop A of document',
      propB: 'prop B of document',
    };
    _id = await crud.create(doc);

    expect(doc).to.have.property('_id');
    expect(doc._id.toString()).to.match(/^[0-9a-f]{24}$/);
    expect(doc._id).to.equal(_id);
  });

  it('reads the document', async () => {
    const actualDoc = await crud.read(`${_id}`);

    expect(actualDoc).to.deep.equal({
      _id,
      propA: 'prop A of document',
      propB: 'prop B of document',
    });
  });

  it('reads the document querying by propA', async () => {
    const actualDocs = await crud.read({ propA: 'prop A of document'});

    expect(actualDocs).to.be.an('array').that.deep.includes({
      _id,
      propA: 'prop A of document',
      propB: 'prop B of document',
    });
  });

  it('updates the document', async () => {
    const count = await crud.update({
      _id,
      propA: 'prop A of document modified',
      propB: 'prop B of document',
    });

    expect(count).to.equal(1);
    expect(await crud.read(`${_id}`)).to.deep.equal({
      _id,
      propA: 'prop A of document modified',
      propB: 'prop B of document',
    });
  });

  it('updates part of the document', async () => {
    const count = await crud.update(_id, {
      propB: 'prop B of document modified',
      propC: 'prop C of document',
    });

    expect(count).to.equal(1);
    expect(await crud.read(`${_id}`)).to.deep.equal({
      _id,
      propA: 'prop A of document modified',
      propB: 'prop B of document modified',
      propC: 'prop C of document',
    });
  });

  it('deletes the document', async () => {
    const count = await crud.delete(`${_id}`);

    expect(count).to.equal(1);
    expect(await crud.read(`${_id}`)).to.be.null;
  });

  let uid;

  it('creates a bunch of documents, then reads some of them in reverse order', async () => {
    const timestamp = new Date().getTime();
    const randNumber = Math.round(Math.random() * 1000000);

    uid = `${timestamp}-${randNumber}`;

    const docs = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(c => ({
      uid,
      propA: `prop A of document ${c}`,
      propB: `prop B of document ${c}`,
    }));

    for (const doc of docs) {
      await crud.create(doc);
    }

    const actualDocs = await crud.read({ uid }, { skip: 1, limit: docs.length - 2, sort: { propB: -1 } });

    expect(actualDocs).to.be.an('array')
      .that.has.deep.ordered.members(docs.slice(1, -1).reverse())
      .but.not.deep.include(docs[0])
      .and.not.deep.include(docs[docs.length - 1]);
  });

  it('updates a bunch of documents', async() => {
    const count = await crud.update({ uid }, {
      uid: uid + 1,
      propA: 'prop A of document',
      propC: 'prop C of document',
    });

    expect(count).to.equal(8);

    uid = uid + 1;

    const actualDocs = await crud.read({ uid }, { sort: { propA: 1 } });

    expect(actualDocs).to.be.an('array')
      .that.has.deep.ordered.members(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((c, i) => ({
        _id: actualDocs[i]._id,
        uid,
        propA: 'prop A of document',
        propB: `prop B of document ${c}`,
        propC: 'prop C of document',
      })));
  });

  it('deletes a bunch of documents', async () => {
    const count = await crud.delete({ uid });

    expect(count).to.equals(8);
    expect(await crud.read({ uid })).to.be.an('array').that.is.empty;
  });

  after(async () => {
    (await connector()).close();
  });
});
