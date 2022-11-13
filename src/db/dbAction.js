const rfr = require('rfr');
const fs = require('fs');
const _ = require('lodash');

const dbUtil = rfr('/src/util/dbUtil.js');
const { generateNaoid } = rfr('/src/util/commonUtil.js');

// const INSERT_TORRENT = `
// INSERT INTO t_torrent (
//   torrentName,
//   torrentHref,
//   torrentType,
//   torrentTypeInt,
//   torrentFileCnt,
//   torrentSize,
//   torrentSizeInMB,
//   torrentCreateTime,
//   torrentSeeders,
//   torrentLeechers,
//   website,
//   pageIndex
// )
// VALUES (
//   ?,
//   ?,
//   ?,
//   ?,
//   ?,
//   ?,
//   ?,
//   ?,
//   ?,
//   ?,
//   ?,
//   ?
// )
// `.replaceAll('\n', '');

const SELECT_TORRECT_BY_HREF = `
  select * from t_torrent where torrentHref = ?
`.replaceAll('\n', '');

const website = 'bt4g';

const insert1Torrent = async (pageIndex, torrent) => {
  const {
    torrentName,
    torrentHref,
    torrentType,
    torrentTypeInt,
    torrentFileCnt,
    torrentSize,
    torrentSizeInMB,
    torrentCreateTime,
    torrentSeeders,
    torrentLeechers,
    files,
  } = torrent;
  const queryRes = await dbUtil.poolQuery(SELECT_TORRECT_BY_HREF, [torrentHref]);
  // console.info(`queryRes: ${JSON.stringify(queryRes)}`);
  if (queryRes.length !== 0) {
    console.info(`record for href: ${torrentHref}, already exists, won't insert this time: ${JSON.stringify(queryRes)}`);
    return false;
  }

  const conn = await dbUtil.getConnection();
  try {
    await dbUtil.beginTransaction(conn);
    const insertId = generateNaoid();
    const insertRes = await dbUtil.insert(conn, 't_torrent', {
      id: insertId,
      torrentName,
      torrentHref,
      torrentType,
      torrentTypeInt,
      torrentFileCnt: Number.parseInt(torrentFileCnt, 10),
      torrentSize,
      torrentSizeInMB,
      torrentCreateTime,
      torrentSeeders: Number.parseInt(torrentSeeders, 10),
      torrentLeechers: Number.parseInt(torrentLeechers, 10),
      website,
      pageIndex,
    });

    // insertRes: 1, 1, 0
    console.info(`insertRes: ${insertRes.insertId}, ${insertRes.affectedRows}, ${insertRes.changedRows}`);

    // insertRes: {"fieldCount":0,"affectedRows":1,"insertId":1,"serverStatus":3,"warningCount":0,"message":"","protocol41":true,"changedRows":0}
    console.info(`insertRes: ${JSON.stringify(insertRes)}`);
    // const { insertId } = insertRes;

    const { length } = files;
    for (let i = 0; i < length; i++) {
      const file = files[i];
      const {
        fileName,
        extension,
        fileSize,
        fileSizeInMB,
      } = file;

      const insertFilesRes = await dbUtil.insert(conn, 't_torrent_files', {
        id: generateNaoid(),
        fileName,
        extension,
        fileSize,
        fileSizeInMB,
        torrentId: insertId,
      });
    }
    await dbUtil.commit(conn);
    return `magnet:?xt=urn:btih:${torrentHref}`;
  } catch (e) {
    console.error(e);
    await dbUtil.rollback(conn);
    throw e;
  } finally {
    await dbUtil.closeConnection(conn);
  }
};

const insertTorrent1Page = async (pageIndex, pageResult) => {
  const { status, torrents } = pageResult;
  if (status !== 'succeed') {
    throw new Error(`page ${pageIndex} failed! Won't process`);
  }
  const addedHrefThisTime = [];
  const { length } = torrents;
  for (let i = 0; i < length; i++) {
    const torrent = torrents[i];
    const isSucceed = await insert1Torrent(pageIndex, torrent);
    if (isSucceed) {
      addedHrefThisTime.push(`magnet:?xt=urn:btih:${torrent.torrentHref}`);
    }
  }
  return addedHrefThisTime;
};

const insertTorrentFrmFile = async (file) => {
  const srcTxt = await fs.readFileSync(file, {
    encoding: 'utf8',
    // http://nodejs.cn/api/fs.html#fs_file_system_flags
    flag: 'r+',
  });
  const srcJson = JSON.parse(srcTxt);
  let addHrefThisTime = [];

  const pageIndexes = Object.keys(srcJson);
  const { length } = pageIndexes;

  for (let i = 0; i < length; i++) {
    const pageIndex = pageIndexes[i];
    const pageResult = srcJson[pageIndex];
    const added = await insertTorrent1Page(pageIndex, pageResult);
    addHrefThisTime = addHrefThisTime.concat(added);
  }

  /** eslint-disable guard-for-in */
  // for (const pageIndex in srcJson) {
  //  const pageResult = srcJson[pageIndex];
  //  const added = await insertTorrent1Page(pageIndex, pageResult);
  //  addHrefThisTime = addHrefThisTime.concat(added);
  // }
  /// ** eslint-enable guard-for-in */

  console.info(`insert done. addHrefThisTime:\n${addHrefThisTime.join('\n')}`);

};

module.exports = {
  insertTorrentFrmFile,
};
