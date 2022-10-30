
// Common variable begin
const stringToMB = (str) => {
  const num = Number.parseFloat('' + str.match(/^\d+\.?\d+/g), 10);
  const unit = (str.match(/[a-z]+$/gi) + '').toUpperCase();
  let retVal = 0;
  
  switch (unit) {
    case 'TB':
      retVal = num * 1024 * 1024;
      break;
    case 'GB':
      retVal = num * 1024;
      break;
    case 'MB':
      retVal = num;
      break;
  case 'KB':
      retVal = num / 1024;
      break;
    default:
      console.warning('no unit matched - str: ${str}');
      break;
  }
  return retVal;
};

const extractFileInfo = (liDom) => {
  const fileName = liDom.childNodes[0].textContent.replaceAll('\n', '').trim();
  const fileSize = liDom.querySelector(':scope > span').innerText;
  const fileSizeInMB = stringToMB(fileSize);
  return {
  fileName,
  fileSize,
  fileSizeInMB,
  };
};

const MAGNET_PREFIX = 'magnet:?xt=urn:btih:';
// Common variable end


const extractTorrentList = () => {
  var allItems = Array.from(document.querySelectorAll('main > .container > .row:nth-of-type(3) > .col.s12 > div:nth-of-type(n+2)'));

  var resultTorrent = [];
  allItems.forEach(ele => {
    const torrentName = ele.querySelector('h5:nth-child(1)').innerText;
    const torrentHref = ele.querySelector('h5:nth-child(1) > a').href.match(/(?<=\/magnet\/)[^\/]+$/g)[0];
    const torrentDetailLink = `https://bt4g.org/magnet/${torrentHref}`;
    const torrentType = ele.querySelector(':scope > span:nth-of-type(1)').innerText;
    
    const torrentCreateTime = ele.querySelector(':scope > span:nth-of-type(2) > b').innerText;
    const torrentFileCnt = ele.querySelector(':scope > span:nth-of-type(3) > b').innerText;
    const torrentSize = ele.querySelector(':scope > span:nth-of-type(4) > b').innerText;
    const torrentSeeders = ele.querySelector(':scope > span:nth-of-type(5) > b').innerText;
    const torrentLeechers = ele.querySelector(':scope > span:nth-of-type(6) > b').innerText;
    
    const fileLIs = Array.from(ele.querySelectorAll(':scope > ul > li'));
    
    const files = fileLIs.map(fileItem => {
    return extractFileInfo(fileItem);
    });

    let torrentTypeInt = 0;

    switch (torrentType.toUpperCase()) {
      case 'VIDEO':
        torrentTypeInt = 0;
        break;
      case 'AUDIO':
        torrentTypeInt = 1;
        break;
      case 'ARCHIVE FILE':
        torrentTypeInt = 2;
        break;
    case 'APPLICATION':
        torrentTypeInt = 3;
        break;
    case 'OTHER':
      default:
      torrentTypeInt = 5;
        console.warning('no torrentType matched - torrentType: ${torrentType}');
        break;
    }
    const torrentSizeInMB = stringToMB(torrentSize);
    
    resultTorrent.push({
      torrentName,
    torrentHref,
    torrentDetailLink,
    torrentType,
    torrentTypeInt,
    torrentCreateTime,
    torrentFileCnt,
    torrentSize,
    torrentSizeInMB,
    torrentSeeders,
    torrentLeechers,
    files,
    });
  });
  console.info(JSON.stringify(resultTorrent, null, 2));
  // console.info(resultTorrent.join('\n'));
};

return extractTorrentList();

// module.exports = {
//   extractTorrentList,
// };
