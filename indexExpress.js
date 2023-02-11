// call all the required packages
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');

const dbUtil = require('./src/util/dbUtil');
const dbAction = require('./src/db/dbAction');


const port = 8180;

// CREATE EXPRESS APP
const app = express();

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
    console.info(`request done`);
  //const retVal = [
  //  'line1',
  //  'line2',
  //  'line3',
  //].join('\n');
    return res.send(retVal);
  } catch(e) {
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
  const file = req.file;
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
  const files = req.files;
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

dbUtil.init().then(() => {
  app.listen(port, () => console.log(`Server started on port ${port}`));
});

// https://code.tutsplus.com/tutorials/file-upload-with-multer-in-node--cms-32088


