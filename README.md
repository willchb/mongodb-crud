[![npm][npm]][npm-url]
[![node][node]][node-url]
[![license][license]][license-url]

# mongodb-crud

An easy to use [CRUD] for [MongoDB].


> ## TL;DR
>
> If you're in a rush to start using this package, or just need a quick sample
> code to start, jump to the [Complete sample] section. If after looking at the
> [complete sample] you still have questions, then read this whole document.

## Introduction

This package provides methods to [create], [read], [update] and [delete]
documents in a [MongoDB] database.

In short, you [create a connector] and use it to [create a crud] for a specific [database] and [collection]. Then you call any of the four methods of the crud
you created to perform any of the four [CRUD] operations.

## Create a connector

First thing you need is a connector. A connector is a method that returns a
persistent connection to a [MongoDB] host. The connector is required to
[create a crud].

In order to create a connector, call the `createConnector` method with an
optional options object containing the information to connect, such as: host,
port, etc.

A [connection string] may be set by the property `url` of the options object.
If it's not, `createConnector` still looks it up from the environment variable
`DBURL`. Therefore, if you want to use a [connection string] you should set
either:

  - the `url` property of the options object;

    ```js
    const connector = createConnector({
      url: 'mongodb://user:pass@host:port/database',
    });
    ```

  - or the environment variable `DBURL`

However, if no [connection string] is provided, `createConnector` creates it
from the following individual parameters: host, port, username and password.
Here's how you could set them:

- **host**: it's `'localhost'`, unless either of the below is provided:

  - a `host` property in the options object:

    ```js
    const connector = createConnector({
      host: 'my-mongodb-host',
    });
    ```

  - an environment variable `DBHOST`

- **port**: by default it's `'27017'`, unless either of the below is provided:
  - a `port` property in the options object:

    ```js
    const connector = createConnector({
      port: '20118',
    });
    ```

  - an environment variable `DBPORT`

- **username**: it's not set nor part of the [connection string] by default. If
  you need username to connect, provide either:

  - a `username` property in the options object:

    ```js
    const connector = createConnector({
      username: 'my-username',
    });
    ```

  - an environment variable `DBUSER`

- **password**: it's not set nor part of the [connection string] by default.
  It's ignored if username isn't given. If you need password to connect,
  provide a username and either:

  - a `password` property in the options object:

    ```js
    const connector = createConnector({
      password: 'my-secret-pass',
    });
    ```

  - an environment variable `DBPASS`

- **database**: by default it's `'admin'`. It's ignored if username isn't
  given. If you need a username that is not in the `'admin'` database, provide
  either:

  - a `database` property in the options object:

    ```js
    const connector = createConnector({
      database: 'database-where-user-belongs',
    });
    ```

  - an environment variable `DBNAME`


### Getting a persistent connection

If you want a persistent connection for any operation that is not part of the
[CRUD], you can get one by simply calling the connector.

Here's how you'd create a new user in the database:

```js
const { createConnector } = require('@midion/mongodb-crud');

const connector = createConnector({ url: 'mongodb://user:pass@host:port' });
const conn = await connector();

await conn.db('admin').addUser('newuser', 's3cr3t');
```

## Create a CRUD

Once you have a connector, you need to create a crud, which is just a plain
object with these methods: [create], [read], [update], [delete].

A crud only operates on one [collection]. That means you need to create a crud
for each [collection] you want to [create] documents in, [read] documents from,
[update/save] documents to, and [delete] documents from.


```js
const { createConnector, createCRUD } = require('@midion/mongodb-crud');

const connector = createConnector({ url: 'mongodb://user:pass@host:port' });

// this crud has methods create, read, update and delete, for operating
// on the 'users' collection of the 'my-app-db' database
const usersCRUD = createCRUD(connector, 'my-app-db', 'users');

// this crud has methods create, read, update and delete, for operating
// on the 'orders' collection of the 'my-app-db' database
const ordersCRUD = createCRUD({
  collection: 'orders',
  connector,
  database: 'my-app-db',
});
```

If you set the environment variables `DBUSER`, `DBPASS`, `DBNAME`, `DBHOST` and
`DBPORT`, or if you don't and the default values for them work for you,
creating a crud could be as simple as in the below code snippet:

```js
const { createCRUD } = require('@midion/mongodb-crud');
const crud = createCRUD({ collection: 'users' });
```

## Create a document

Once you have [a crud] for your [database] and [collection], you just need to
call the method `create` with a plain object representing the document you
want to add to the [collection].

The create operation changes the document by adding an `_id` property to it.
The value of that property is the auto generated `_id` — the primary key in
[MongoDB] collections. It also returns that `_id`. The `_id` is an [ObjectId]
that can be converted to a [String] representation via the method `toString`.

```js
// create a document
const document = {
  username: 'john',
  password: 'secret',
  name: 'John Bart',
  email: 'john@example.com',
};
// _id is auto-generated and set to the document by the connector
const _id = await crud.create(document);
```

## Read a document

Assuming you have [a crud] for your [database] and [collection], you obtain a
document from that [collection] by calling the method `read` with the
document's `_id`.

```js
// get document by _id
const document = await crud.read('507f191e810c19729de860ea');
```

You could also obtain documents by a criteria. This retrieves all users with
email `'john@example.com'`:

```js
// get documents by email
const documents = await crud.read({
  email: 'john@example.com',
});
```

It's also possible to skip the first N documents, to limit the number of
results, and even sort the results by certain fields:

```js
// get all documents from 11th to 20th sorted by name
const documents = await crud.read({}, {
  skip: 10,
  limit: 10,
  sort: { name: 1 },
});
```

## Update a document

If you need to update a document in a [collection], get [a crud] for that
[collection], then [read] the document by `_id`, change it, and call `update`
with the amended document.

The update operation returns the number of modified documents.

```js
const document = await crud.read('507f191e810c19729de860ea');

document.password = 's3cRet';

// replace document which _id is 507f191e810c19729de860ea
const modifiedCount = await crud.update(document);
```

A more efficient way of doing the same as above would be to update only the password, rather than replacing the whole document.

```js
// update the password of the document which _id is 507f191e810c19729de860ea
const modifiedCount = await crud.update('507f191e810c19729de860ea', {
  password: 's3cRet',
});
```

It's also possible to update one or more fields of multiple documents matching a
certain criteria, all at once.

```js
// update the password of all users named 'John'
const modifiedCount = await crud.update(
  { name: 'John' }, // criteria
  { password: "john's secret" } // props and values to update
);
```

## Delete a document

You have [a crud] for your [database] and [collection], then you could delete a
document from that [collection] by calling the method `delete` with the
document or the document's `_id`.

The delete operation returns the number of deleted documents.

```js
// get a document
const document = await crud.read('507f191e810c19729de860ea');
// delete the document
const deletedCount = await crud.delete(document);
```

```js
// delete a document by id
const deletedCount = await crud.delete('507f191e810c19729de860ea');
```

You could also delete multiple documents by a certain criteria.

```js
// delete all users named 'John'
const deletedCount = await crud.delete({ name: 'John' });
```

## Complete sample

Create a document in the `users` collection of the `my-app-db` database. Then
obtain it, modify it, save it, and finally delete it from the database.

```js
const { createConnector, createCRUD } = require('@midion/mongodb-crud');
const connector = createConnector({ url: 'mongodb://user:pass@host:port/database' });
const crud = createCRUD(connector, 'my-app-db', 'users');

// create a document
const _id = await crud.create({
  username: 'john',
  password: 'secret',
  name: 'John Bart',
  email: 'john@example.com',
});

// read the document
const document = await crud.read(_id);

// modify the document
document.password = 's3cRet';

// save the document
await crud.update(document);

// delete the document
await crud.delete(_id);
```

## Maintainer

| [![willchb-avatar]][willchb] |
|:----------------------------:|
| [Willian Balmant]([willchb]) |


<!-- External references -->
[npm]: https://img.shields.io/npm/v/@midion/mongodb-crud.svg
[npm-url]: https://npmjs.com/package/@midion/mongodb-crud
[node]: https://img.shields.io/node/v/@midion/mongodb-crud.svg
[node-url]: https://nodejs.org
[license]: https://img.shields.io/npm/l/@midion/mongodb-crud.svg
[license-url]: https://gitlab.com/midion/mongodb-crud/raw/master/LICENSE.md
[willchb]: https://github.com/willchb
[willchb-avatar]: https://avatars1.githubusercontent.com/u/16672319?v=3&s=150

[CRUD]: https://en.wikipedia.org/wiki/Create,_read,_update_and_delete
[MongoDB]: https://www.mongodb.com/
[Connection String]: https://docs.mongodb.com/manual/reference/connection-string/
[ObjectId]: https://docs.mongodb.com/manual/reference/method/ObjectId/
[database]: https://docs.mongodb.com/manual/core/databases-and-collections/#databases
[collection]: https://docs.mongodb.com/manual/core/databases-and-collections/#collections
[String]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String

<!-- Internal references -->
[Create a CRUD]: #create-a-crud
[a crud]: #create-a-crud
[Create a connector]: #create-a-connector
[create]: #create-a-document
[read]: #read-a-document
[update]: #update-a-document
[update/save]: #update-a-document
[delete]: #delete-a-document
[Complete sample]: #complete-sample
