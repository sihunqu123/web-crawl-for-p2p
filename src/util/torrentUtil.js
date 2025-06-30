const rfr = require('rfr');

const fetchBT4GRetry = require('./commonUtil');
const extractExtraTorrentInfo = require('./domUtil');

const fetchTorrentDetails = async (torrent) => {
  if (torrent.torrentFileCnt < 4) {
    console.debug(`no need to fetch file list for ${torrent.torrentName}, since torrent.torrentFileCnt is ${torrent.torrentFileCnt}`);
    torrent.files = torrent.filesPartial;
    return torrent;
  }

  // let htmlStr = null;
  // htmlStr = await fetchBT4GRetry(torrent.torrentDetailLink);
  const { body: htmlStr, statusCode } = await fetchBT4GRetry(torrent.torrentDetailLink);
  if (statusCode === 404) { // some fileDetails might have been removed.
    torrent.files = torrent.filesPartial;
    console.info(`The detail page of ${torrent.torrentName} has been removed`);
    // return callback(null, torrent);
    return torrent;
  }

  if (statusCode !== 200) {
    throw new Error(`failed to fetch fileList for torrent: ${torrent.torrentName}`);
  } // else 200

  const files = extractExtraTorrentInfo(htmlStr);
  torrent.files = files;
  // return callback(null, torrent);
  return torrent;
};

module.exports = {
  fetchTorrentDetails,
};
