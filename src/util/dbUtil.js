/* eslint-disable no-unused-vars  */
const rfr = require('rfr');
const _ = require('lodash');

const { cookie, maxRetrytimes, dbConfig } = rfr('/src/config/config.js');

/* eslint-enable no-unused-vars  */

// get the client
const mysql = require('mysql');

let connPool;

const init = async () => {
  // Ensure DATETIME/TIMESTAMP columns are returned as strings to avoid
  // automatic conversion to JS Date objects (which then serialize to UTC
  // and can shift the displayed value). This preserves the DB's stored
  // representation like 'YYYY-MM-DD HH:mm:ss'.
  const poolConfig = Object.assign({}, dbConfig, { dateStrings: true });
  connPool = mysql.createPool(poolConfig);
};

const formInsertSql = (tableName, columns) => {
  let sql = `INSERT INTO ${tableName} (`;
  sql += columns[0];
  for (let i = 1; i < columns.length; i++) {
    const field = columns[i];
    sql += `,${field} `;
  }
  sql += ') VALUES (';
  sql += '?';
  for (let i = 1; i < columns.length; i++) {
    sql += ',?';
  }

  sql += ')';

  return sql;
};

const poolQuery = async (sql = '', substitution = []) => new Promise((resolve, reject) => {
  // Optional debug logging: when DEBUG_SQL env var is truthy, log the query,
  // parameter substitution and execution time. Keep this non-throwing and
  // avoid leaking large binary blobs.
  const debug = !!process.env.DEBUG_SQL;
  const start = debug ? Date.now() : null;
  if (debug) {
    try {
      // Safely stringify substitutions (avoid circular and huge objects)
      const safeSub = substitution && substitution.length ? substitution.map((s) => {
        try {
          if (typeof s === 'string' && s.length > 2000) return `${s.slice(0, 2000)}...[truncated]`;
          if (s && typeof s === 'object') return JSON.stringify(s);
          return String(s);
        } catch (e) {
          return '[unstringifiable]';
        }
      }) : [];
      console.info(`[dbUtil] SQL -> ${sql}`);
      if (safeSub.length) console.info(`[dbUtil] Params -> ${safeSub.join(', ')}`);
    } catch (e) {
      // swallow logging errors
    }
  }

  connPool.query(sql, substitution, (error, results) => {
    if (debug && start !== null) {
      try {
        const dur = Date.now() - start;
        console.info(`[dbUtil] Query completed in ${dur}ms`);
      } catch (e) {
        // ignore
      }
    }
    if (error) {
      return reject(error);
    }
    return resolve(results);
  });
});

const query = async (connection, sql = '', substitution = []) => new Promise(((resolve, reject) => {
  connection.query(sql, substitution, (error, results, fields) => {
    if (error) {
      return reject(error);
    }
    console.info(`fields: ${fields}`);
    return resolve(results);
  });
}));

const insert = async (connection, tableName, keyValMap) => {
  const keys = Object.keys(keyValMap);
  const values = keys.map((key) => keyValMap[key]);

  const sql = formInsertSql(tableName, keys);
  return new Promise(((resolve, reject) => {
    connection.query(sql, values, (error, results, fields) => {
      if (error) {
        return reject(error);
      }
      // console.info(`fields: ${fields}`);
      return resolve(results);
    });
  }));

};

// TODO: is this implementation OK?
const getConnection = async () => new Promise((resolve, reject) => {
  connPool.getConnection((err, connection) => {
    if (err) {
      return reject(err);
    }
    return resolve(connection);
  });
});

const closeConnection = async (connection) => new Promise((resolve, reject) => {
  if (connection) {
    connection.release((err) => {
      if (err) {
        return reject(err);
      }
      return resolve('ok');
    });
  }
  resolve('ok');
});

const beginTransaction = async (connection) => new Promise((resolve, reject) => {
  connection.beginTransaction((err) => {
    if (err) {
      return reject(err);
    }
    return resolve();
  });
});

const commit = async (connection) => new Promise((resolve, reject) => {
  connection.commit((err) => {
    if (err) {
      return reject(err);
    }
    return resolve();
  });
});

const rollback = async (connection) => new Promise((resolve, reject) => {
  connection.rollback((err) => {
    if (err) {
      return reject(err);
    }
    return resolve();
  });
});

module.exports = {
  init,
  poolQuery,
  query,
  getConnection,
  closeConnection,
  beginTransaction,
  commit,
  rollback,
  formInsertSql,
  insert,
};
