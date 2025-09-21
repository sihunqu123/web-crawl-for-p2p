// call all the required packages
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');

const dbUtil = require('./src/util/dbUtil');
const dbAction = require('./src/db/dbAction');
const cors = require('cors');

const port = 8180;

// CREATE EXPRESS APP
const app = express();

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// enable CORS for local frontend calls
app.use(cors());

// Explicit CORS headers middleware (in case preflight or proxies strip headers)
app.use((req, res, next) => {
  // Allow from any origin for development. Change to specific origin(s) in production.
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

// ROUTES WILL GO HERE
// app.get('/', (req, res) => {
//   res.json({ message: 'WELCOME' });
// });

// ROUTES
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/html/index.html`);
});

const saveFolder = path.join(__dirname, 'upload');
console.info(saveFolder);
app.use('/static', express.static(saveFolder));

// SET STORAGE
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // will be saved to the `${root directory of project}/uploads` folder
    //    cb(null, 'uploads');
    cb(null, saveFolder);
  },
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

app.post('/add-torrent', async (req, res, next) => {
  // console.info(`req.body: ${JSON.stringify(req.body)}`);
  const { website, torrents } = req.body;
  const pageIndex = 1;
  // console.info(`torrents: ${JSON.stringify(torrents)}`);
  try {
    const added = await dbAction.insertTorrent1PageForce(pageIndex, Object.values(torrents), website);
    const retVal = added.join('\n');
    res.status(200);
    console.info('request done');
    // const retVal = [
    //  'line1',
    //  'line2',
    //  'line3',
    // ].join('\n');
    return res.send(retVal);
  } catch (e) {
    res.status(500);
    console.error(e);
    return res.send(e);
  }
});

// Uploading single files
app.post('/uploadAFile', upload.single('myfile'), (req, res, next) => {
  // app.post('/uploadfile', upload.single('file'), (req, res, next) => {
  console.info(`req.body: ${JSON.stringify(req.body)}`);
  console.info(`req.file: ${req.file}`);
  const { file } = req;
  if (!file) {
    const error = new Error('Please upload a file');
    error.httpStatusCode = 400;
    return next(error);
  }
  return res.send(file);
});

// Uploading multiple files.  PS:  also support only upload ONE file, and the response will be an array.
// .array(fieldname[, maxCount])
// Accept an array of files, all with the name fieldname.
// Optionally error out if more than maxCount files are uploaded. The array of files will be stored in req.files.
// app.post('/uploadFiles', upload.array('myfiles', 12), (req, res, next) => {
app.post('/uploadFiles', upload.array('content', 12), (req, res, next) => {
  // req.files is an object (String -> Array) where fieldname is the key, and the value is array of files
  //
  // e.g.
  //  req.files['avatar'][0] -> File
  //  req.files['gallery'] -> Array
  //
  // req.body will contain the text fields, if there were any
  const { files } = req;
  console.info(`req.files: ${files} END`);
  console.info(`req.body: ${JSON.stringify(req.body)} END`);
  if (!files) {
    const error = new Error('Please choose files');
    error.httpStatusCode = 400;
    return next(error);
  }

  console.info(`req.files.length: ${files.length} END`);

  const response = {
    files,
    body: req.body,
  };

  return res.send(response);
});

// API: get paginated torrents
// query params: page (1-based), pageSize
app.get('/api/torrents', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.max(1, parseInt(req.query.pageSize, 10) || 50);
  const offset = (page - 1) * pageSize;

  // field-level filters (optional)
  const torrentName = req.query.torrentName ? String(req.query.torrentName).trim() : '';
  const website = req.query.website ? String(req.query.website).trim() : '';
  const torrentType = req.query.torrentType ? String(req.query.torrentType).trim() : '';
  const hasDownloaded = req.query.hasDownloaded !== undefined && req.query.hasDownloaded !== '' ? req.query.hasDownloaded : '';

  // date range filters (expecting ISO-like strings, frontend should format as 'YYYY-MM-DD HH:mm:ss')
  const beginAdded = req.query.beginAdded ? String(req.query.beginAdded).trim() : '';
  const endAdded = req.query.endAdded ? String(req.query.endAdded).trim() : '';
  const beginCreated = req.query.beginCreated ? String(req.query.beginCreated).trim() : '';
  const endCreated = req.query.endCreated ? String(req.query.endCreated).trim() : '';

  const sortField = req.query.sortField ? String(req.query.sortField).trim() : 'added_time';
  const sortDir = req.query.sortDir === 'asc' ? 'ASC' : 'DESC';

  // allow-list for sortable fields to prevent SQL injection
  const allowedSortFields = new Set([
    'added_time', 'torrentName', 'torrentSizeInMB', 'torrentSeeders', 'torrentLeechers', 'torrentCreateTime'
  ]);
  const orderBy = allowedSortFields.has(sortField) ? `${sortField} ${sortDir}` : `added_time DESC`;

  try {
    const whereClauses = [];
    const params = [];

    // Define known columns and their types for safe handling
    const columns = {
      id: 'number',
      torrentName: 'string',
      torrentHref: 'string',
      torrentHrefFull: 'string',
      torrentType: 'string',
      torrentTypeInt: 'number',
      torrentFileCnt: 'number',
      torrentSize: 'string',
      torrentSizeInMB: 'number',
      torrentCreateTime: 'date',
      torrentSeeders: 'number',
      torrentLeechers: 'number',
      website: 'string',
      added_time: 'date',
      pageIndex: 'number',
      hasDownloaded: 'number',
      last_modified_time: 'date'
    };

    // Helper to push a date range when params provided as field_begin/field_end (snake) or legacy params
    function pushDateRange(fieldName, legacyBegin, legacyEnd) {
      const beginSnake = req.query[`${fieldName}_begin`] ? String(req.query[`${fieldName}_begin`]).trim() : '';
      const endSnake = req.query[`${fieldName}_end`] ? String(req.query[`${fieldName}_end`]).trim() : '';
      const beginLegacy = legacyBegin ? String(req.query[legacyBegin] || '').trim() : '';
      const endLegacy = legacyEnd ? String(req.query[legacyEnd] || '').trim() : '';

      const begin = beginSnake || beginLegacy;
      const end = endSnake || endLegacy;
      if (begin) {
        whereClauses.push(`${fieldName} >= ?`);
        params.push(begin);
      }
      if (end) {
        whereClauses.push(`${fieldName} <= ?`);
        params.push(end);
      }
    }

    // Iterate known columns and check for query params with the same name
    for (const [col, type] of Object.entries(columns)) {
      const raw = req.query[col];
      if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
        const v = String(raw).trim();
        if (type === 'string') {
          whereClauses.push(`${col} LIKE ?`);
          params.push(`%${v}%`);
        } else if (type === 'number') {
          if (col === 'id' && v.indexOf(',') >= 0) {
            // support comma-separated id list
            const ids = v.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
            if (ids.length > 0) {
              const placeholders = ids.map(() => '?').join(',');
              whereClauses.push(`${col} IN (${placeholders})`);
              params.push(...ids);
            }
          } else {
            const n = Number(v);
            if (!Number.isNaN(n)) {
              whereClauses.push(`${col} = ?`);
              params.push(n);
            }
          }
        } else if (type === 'date') {
          // allow direct equality or range via *_begin/*_end handled below
          whereClauses.push(`${col} = ?`);
          params.push(v);
        }
      }
      // For date columns also support begin/end query params
      if (type === 'date') {
        // map legacy names to maintain backward compatibility
        if (col === 'added_time') {
          pushDateRange(col, 'beginAdded', 'endAdded');
        } else if (col === 'torrentCreateTime') {
          pushDateRange(col, 'beginCreated', 'endCreated');
        } else if (col === 'last_modified_time') {
          pushDateRange(col, 'beginLastModified', 'endLastModified');
        } else {
          pushDateRange(col, null, null);
        }
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let total = 0;
    let rows = [];

    if (whereSql) {
      const totalRes = await dbUtil.poolQuery(`SELECT COUNT(*) as cnt FROM t_torrent ${whereSql}`, params);
      total = totalRes && totalRes[0] ? totalRes[0].cnt : 0;
      // add LIMIT/OFFSET params
      const selectParams = params.slice();
      selectParams.push(pageSize, offset);
      rows = await dbUtil.poolQuery(`SELECT * FROM t_torrent ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`, selectParams);
    } else {
      const totalRes = await dbUtil.poolQuery('SELECT COUNT(*) as cnt FROM t_torrent');
      total = totalRes && totalRes[0] ? totalRes[0].cnt : 0;
      rows = await dbUtil.poolQuery(`SELECT * FROM t_torrent ORDER BY ${orderBy} LIMIT ? OFFSET ?`, [pageSize, offset]);
    }

    return res.json({ page, pageSize, total, rows, sortField, sortDir });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || e });
  }
});

// API: get single torrent and its files
app.get('/api/torrents/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const torrents = await dbUtil.poolQuery('SELECT * FROM t_torrent WHERE id = ?', [id]);
    if (!torrents || torrents.length === 0) {
      return res.status(404).json({ error: 'not found' });
    }
    const torrent = torrents[0];
    const files = await dbUtil.poolQuery('SELECT * FROM t_torrent_files WHERE torrentId = ?', [id]);
    torrent.files = files;
    return res.json(torrent);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || e });
  }
});

// API: bulk update hasDownloaded for multiple torrent ids
// POST body: { ids: [1,2,3], value: 0|1 }
app.post('/api/torrents/mark-downloaded', async (req, res) => {
  const { ids, value } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'ids must be a non-empty array' });
  }
  const v = Number(value) === 1 ? 1 : 0;
  const numericIds = ids.map((i) => Number(i)).filter((n) => !Number.isNaN(n));
  if (numericIds.length === 0) {
    return res.status(400).json({ error: 'ids must contain numeric values' });
  }
  try {
    const placeholders = numericIds.map(() => '?').join(',');
    const sql = `UPDATE t_torrent SET hasDownloaded = ? WHERE id IN (${placeholders})`;
    const params = [v, ...numericIds];
    const result = await dbUtil.poolQuery(sql, params);
    return res.json({ affectedRows: result && result.affectedRows ? result.affectedRows : 0 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || e });
  }
});

dbUtil.init().then(() => {
  app.listen(port, () => console.log(`Server started on port ${port}`));
});

// https://code.tutsplus.com/tutorials/file-upload-with-multer-in-node--cms-32088
