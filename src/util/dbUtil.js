/* eslint-disable no-unused-vars  */
const rfr = require('rfr');
const _ = require('lodash');

const { cookie, maxRetrytimes, dbConfig } = rfr('/src/config/config.js');

/* eslint-enable no-unused-vars  */

// get the client
const mysql = require('mysql');

let connPool;

const init = async () => {
  connPool = mysql.createPool(dbConfig);
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
  connPool.query(sql, substitution, (error, results) => {
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

const insert = async (connection, tableName, map) => {
  const keys = [];
  const values = [];
  for (const key in map) {
    keys.push(key);
    values.push(map[key]);
  }
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
