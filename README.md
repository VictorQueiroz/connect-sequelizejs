It's a fork of [connect-session-sequelize](https://github.com/mweibel/connect-session-sequelize).

connect-sequelizejs is a SQL session store using [Sequelize.js](http://sequelizejs.com).

# Installation

```
npm install connect-sequelizejs
```

# Options

* `db` a successfully connected Sequelize instance

# Usage

With connect

```javascript
var connect = require('connect');

// for express, just call it with 'require('express-session').Store'
var SequelizeStore = require('connect-session-sequelize')(connect.session.Store);

connect().use(connect.session({
	store: new SequelizeStore(options),
	secret: 'CHANGEME'
}));
```

With Express 4:

```javascript

// load dependencies
var express = require('express');
var Sequelize = require('sequelize');
var cookieParser = require('cookie-parser');
var session = require('express-session');

// initalize sequelize with session store
var SequelizeStore = require('connect-session-sequelize')(session.Store);

// create database, ensure 'sqlite3' in your package.json
var sequelize = new Sequelize("database", "username", "password", {
  "dialect": "sqlite",
  "storage": "./session.sqlite"
});

// configure express
var app = express();
app.use(cookieParser());
app.use(session({
  secret: 'keyboard cat',
  store: new SequelizeStore({
    db: sequelize
  }),
  proxy: true // if you do SSL outside of node.
}));
// continue as normal
```

`SequelizeStore.sync()` - will run a sequelize `sync()` operation on the model for an initialized SequelizeStore object. Use this if you would like the the db table to be created for you.


# License

MIT
