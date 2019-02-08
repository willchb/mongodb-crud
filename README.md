[![npm][npm]][npm-url]
[![node][node]][node-url]

# mongodb-crud

An easy to use [CRUD] for [MongoDB].

<h2 id="introduction">
  Introduction
</h2>

This package provides methods to [create], [read], [update] and [delete]
documents in a [MongoDB] database.

<h2 id="create-a-connector">
  Create a connector
</h2>

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
      url: 'mongodb://user:pass@host:port',
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


### Getting a persistent connection

If you want a persistent connection for any operation that is not part of the
[CRUD], you can get one by simply calling the connector.

Here's how you'd create a new user in the database:

```js
const { createConnector } = require('mongodb-crud');

const connector = createConnector({ url: 'mongodb://user:pass@host:port' });
const conn = await connector();

await conn.db('admin').addUser('newuser', 's3cr3t');
```

## Maintainer

| [![willchb-avatar]][willchb] |
|:----------------------------:|
| [Willian Balmant]([willchb]) |


<!-- External references -->
[npm]: https://img.shields.io/npm/v/mongodb-crud.svg
[npm-url]: https://npmjs.com/package/mongodb-crud
[node]: https://img.shields.io/node/v/mongodb-crud.svg
[node-url]: https://nodejs.org
[willchb]: https://github.com/willchb
[willchb-avatar]: https://avatars1.githubusercontent.com/u/16672319?v=3&s=150

[CRUD]: https://en.wikipedia.org/wiki/Create,_read,_update_and_delete
[MongoDB]: https://www.mongodb.com/
[Connection String]: https://docs.mongodb.com/manual/reference/connection-string/

<!-- Internal references -->
[create]: #create-a-document
[read]: #read-a-document
[update]: #update-a-document
[delete]: #delete-a-document
