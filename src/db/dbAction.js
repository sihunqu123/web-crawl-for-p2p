const rfr = require('rfr');
const fs = require('fs');
const _ = require('lodash');

const dbUtil = rfr('/src/util/dbUtil.js');
const { generateNaoid } = rfr('/src/util/commonUtil.js');

const testSuffix = '';
// const testSuffix = '';
const torrentTalbeName = `t_torrent${testSuffix}`;
const torrentFilesTalbeName = `t_torrent_files${testSuffix}`;

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
  select * from ${torrentTalbeName} where torrentHref = ?
`.replaceAll('\n', '');

// TODO: read as parameter
// const website = 'bt4g';
const hasDownloaded = 0;

const insert1Torrent = async (pageIndex, torrent, website = 'bt4g') => {
  const {
    torrentName,
    torrentHref,
    torrentHrefFull,
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
    console.info(`/////// record for href: ${torrentHref}, already exists, won't insert this time: ${JSON.stringify(queryRes)}`);
    return false;
  }

  const conn = await dbUtil.getConnection();
  try {
    await dbUtil.beginTransaction(conn);
    const insertId = generateNaoid();
    const insertRes = await dbUtil.insert(conn, torrentTalbeName, {
      id: insertId,
      torrentName,
      torrentHref,
      torrentHrefFull: torrentHrefFull || torrentHref,
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
      hasDownloaded,
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

      const insertFilesRes = await dbUtil.insert(conn, torrentFilesTalbeName, {
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

const insertTorrent1PageForce = async (pageIndex, torrents, website = 'bt4g') => {
  const addedHrefThisTime = [];
  const { length } = torrents;
  for (let i = 0; i < length; i++) {
    const torrent = torrents[i];
    const isSucceed = await insert1Torrent(pageIndex, torrent, website);
    if (isSucceed) {
      addedHrefThisTime.push(`magnet:?xt=urn:btih:${torrent.torrentHref}`);
    }
  }
  return addedHrefThisTime;
};

const insertTorrent1Page = async (pageIndex, pageResult, website = 'bt4g') => {
  const { status, torrents } = pageResult;
  if (status !== 'succeed') {
    throw new Error(`page ${pageIndex} failed! Won't process`);
  }
  return insertTorrent1PageForce(pageIndex, torrents, website);
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
  insertTorrent1PageForce,
};
