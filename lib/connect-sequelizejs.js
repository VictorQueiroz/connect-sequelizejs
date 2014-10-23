/**
 * Sequelize based session store.
 *
 * Author: Michael Weibel <michael.weibel@gmail.com>
 * License: MIT
 */

var util = require('util'),
path = require('path'),
debug = require('debug')('connect:session-sequelize');

function SequelizeStoreException(message) {
	this.name = 'SequelizeStoreException';
	this.message = message;
	Error.call(this);
}

util.inherits(SequelizeStoreException, Error);

module.exports = function SequelizeSessionInit(Store) {
	var Session;

	function SequelizeStore(options) {
		options = options || {};
		
		if (!options.db) {
			throw new SequelizeStoreException('Database connection is required');
		}
		
		Store.call(this, options);

		Session = options.db.import(path.join(__dirname, 'model'));
	}

	util.inherits(SequelizeStore, Store);

	SequelizeStore.prototype.sync = function sync() {
		return Session.sync();
	};

	SequelizeStore.prototype.get = function getSession(sid, fn) {
		debug('SELECT "%s"', sid);
		
		Session.find({where: {'sid': sid}}).then(function(session) {
			if(!session) {
				debug('Did not find session %s', sid);
				return fn();
			}
			debug('FOUND %s with data %s', session.sid, session.data);
			try {
				var data = JSON.parse(session.data);
				debug('Found %s', data);
				fn(null, data);
			} catch(e) {
				debug('Error parsing data: %s', e);
				return fn(e);
			}
		}, function(error) {
			debug('Error finding session: %s', error);
			fn(error);
		});
	};

	SequelizeStore.prototype.set = function setSession(sid, data, fn) {
		debug('INSERT "%s"', sid);
		
		var stringData = JSON.stringify(data);
		var sessionModel = Session;

		sessionModel.find({
			where: {
				'sid': sid
			}
		}).done(function (err, session) {
			if(err) return done(err);

			if(!session) {
				return sessionModel.create({
					sid: sid,
					data: stringData
				}).then(function sessionCreated(session) {
					fn(null, session);
				}, function sessionCreatedError(err) {
					debug('Error creating session: %s', error);
					if (fn) {
						fn(err);
					}
				});
			}

			if(session.data !== stringData) {
				return session.updateAttributes({
					'data': stringData
				}).then(function (session) {
					if(session && session.data === stringData) {
						fn(null, data);
					}
				}, function errorUpdating(err) {
					debug('Error updating session: %s', error);
					if (fn) {
						fn(err);
					}
				});
			}

			return fn(null, data);
		});
	};

	SequelizeStore.prototype.destroy = function destroySession(sid, fn) {
		debug('DESTROYING %s', sid);
		Session.find({where: {'sid': sid}}).then(function foundSession(session) {
			// If the session wasn't found, then consider it destroyed already.
			if (session === null) {
				debug('Session not found, assuming destroyed %s', sid);
				fn();
			}
			else {
				session.destroy().then(function destroyedSession() {
					debug('Destroyed %s', sid);
					fn();
				}, function errorDestroying(error) {
					debug('Error destroying session: %s', error);
					fn(error);
				});
			}
		}, function errorFindingSession(error) {
			debug('Error finding session: %s', error);
			fn(error);
		});
	};

	SequelizeStore.prototype.length = function calcLength(fn) {
		Session.count().then(function sessionsCount(c) {
			fn(null, c);
		}, function countFailed(error) {
			fn(error);
		});
	};

	return SequelizeStore;
};
