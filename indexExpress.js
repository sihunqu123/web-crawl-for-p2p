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
  try {
    const totalRes = await dbUtil.poolQuery('SELECT COUNT(*) as cnt FROM t_torrent');
    const total = totalRes && totalRes[0] ? totalRes[0].cnt : 0;
    const rows = await dbUtil.poolQuery(
      'SELECT * FROM t_torrent ORDER BY added_time DESC LIMIT ? OFFSET ?',
      [pageSize, offset]
    );
    return res.json({ page, pageSize, total, rows });
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

dbUtil.init().then(() => {
  app.listen(port, () => console.log(`Server started on port ${port}`));
});

// https://code.tutsplus.com/tutorials/file-upload-with-multer-in-node--cms-32088
