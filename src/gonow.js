const fs = require("fs");

const dir = "./result/gonow";

const COOKIE = "JSESSIONID=DF3EA01CC9D5A128B97D8AF9A15E9887";
const token =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdXRob3JpdGllcyI6IuinkuiJsuWIl-ihqCIsInN1YiI6IjE3NzIzNTYzNjU2JjlhMDNkNWUzY2QzODY0YzE3MzZmNDg5MTk1Nzk2NDliIiwiaWF0IjoxNzM2NjAxMTk4LCJpc3MiOiIyZmJkZmUxOGJiNjI0MTg2YWQwNTY2N2ZlM2Y4N2I2NyJ9.VJGTmCK0Y_aBrkpsSaqtzzXlmnctRzwFGS9MocBS_G4";

const URL_getContentList =
  "https://cvrapi.letinvr.com:10443/cmsClient/content/getContentList";
const URL_getContentDetail =
  "https://cvrapi.letinvr.com:10443/cmsClient/content/getContentDetail";

const whiteList = ["123518_2301_45761780_20230524212141"];

const sleepInMS = (timeInMS) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeInMS);
  });

function base64toBytesArray(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

const writeToFile = async (filename, content) => {
  const filepath = `${dir}/${filename}.json`;
  await fs.writeFileSync(
    filepath,
    JSON.stringify(JSON.parse(content), null, 2),
    {
      encoding: "utf8",
      mode: 0o666,
      // http://nodejs.cn/api/fs.html#fs_file_system_flags
      flag: "w+",
    }
  );
  console.info(`content write to ${filepath}`);
};

const makeRequest = async (url, headers, body) => {
  await sleepInMS(1000);
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "UnityPlayer/2020.3.37f1 (UnityWebRequest/1.0, libcurl/7.80.0-DEV)",
      Accept: "*/*",
      "Accept-Encoding": "deflate, gzip",
      Cookie: COOKIE,
      "Content-Type": "application/json",
      userId: "17723563656",
      token,
      mac: "00DB6261E347",
      "X-Unity-Version": "2020.3.37f1",
      ...headers,
    },
    body: JSON.stringify({
      appId: "100024",
      page: 1,
      size: 10000,
      mac: "00DB6261E347",
      clientModel: "OPPO PCRT00",
      appVersion: "2.4.0",
      deviceId: "9a03d5e3cd3864c1736f48919579649b",
      deviceType: 5,
      ...body,
    }),
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  const resbody = await response.text();
  // console.info(`${indent}fetched content of filmId: ${123518}`);

  // await writeToFile('123518', resbody);

  // console.info(resbody);
  return resbody;
};

let handleVideoItem = null;
let fetchChildList = null;
const fetchContent = async (
  indent,
  columnId = 2058,
  filmId = "123518",
  columnTag = "20210928210340",
  contentNumber = "2002933771mcp",
  contentType = 2
) => {
  indent += "--";
  const url = URL_getContentDetail;
  const headers = {
    filmId,
    columnTag,
  };
  const body = {
    columnId,
    page: 1,
    filmId,
    contentNumber,
    contentType,
  };
  const resbody = await makeRequest(url, headers, body);
  // console.info(`${indent}fetched content of filmId: ${123518}`);
  const fileId = `${filmId}_${columnId}_${contentNumber}_${columnTag}`;
  await writeToFile(fileId, resbody);
  const resJson = JSON.parse(resbody);
  const { msg } = resJson;
  if (!resJson.data) {
    console.error(
      `${indent}fetchContent filmId: ${filmId}, columnId: ${columnId}, msg: ${msg} Failed: no data`
    );
    debugger;
  }
  const videoInfo = resJson.data;
  const { child, programInfo, columnName, contentName, remark } = videoInfo;
  console.info(
    `${indent}fetchContent filmId: ${filmId}, columnId: ${columnId}, columnName: ${columnName}, contentName: ${contentName}, remark: ${remark}, msg: ${msg}`
  );
  const { broadcast8Address, broadcast4Address, liveBroadcastSeats } =
    videoInfo;
  let fetchedVideoCnt = 0;

  if (
    liveBroadcastSeats &&
    Array.isArray(liveBroadcastSeats) &&
    liveBroadcastSeats.length > 0
  ) {
    for (let i = 0; i < liveBroadcastSeats.length; i++) {
      const liveBroadcastSeat = liveBroadcastSeats[i];
      const { liveBroadcastSeatAddressList, name } = liveBroadcastSeat;
      const seatAddrList = liveBroadcastSeatAddressList.map(
        (item) => item.address
      );
      fetchedVideoCnt = seatAddrList.length;
      seatAddrList.forEach((item) => {
        console.info(
          `${indent}fetched videosURL in - columnId: ${columnId}, filmId: ${filmId}, columnTag: ${columnTag}, contentNumber: ${contentNumber}, name: ${name} - ${item}`
        );
      });
    }
  } else if (
    programInfo &&
    Array.isArray(programInfo) &&
    programInfo.length > 0
  ) {
    // only need to handle the first one
    const programInfoItem = programInfo[0];
    fetchedVideoCnt += await handleVideoItem(
      indent,
      programInfoItem,
      columnId,
      filmId,
      columnTag
    );
  } else {
    if (broadcast4Address) {
      fetchedVideoCnt++;
      console.info(
        `${indent}fetched videosURL in - columnId: ${columnId}, filmId: ${filmId}, columnTag: ${columnTag}, contentNumber: ${contentNumber} - 4k: ${broadcast4Address}`
      );
    }
    if (broadcast8Address) {
      fetchedVideoCnt++;
      console.info(
        `${indent}fetched videosURL in - columnId: ${columnId}, filmId: ${filmId}, columnTag: ${columnTag}, contentNumber: ${contentNumber} - 8k: ${broadcast8Address}`
      );
    }
  }

  if (fetchedVideoCnt === 0) {
    debugger;
    const shouldWeIgnore = false;
    if (whiteList.indexOf(fileId) === -1 && !shouldWeIgnore) {
      throw new Error(
        `${indent}Failed to fetch downloadURL from columnId: ${columnId}, columnTag: ${columnTag}, contentNumber: ${contentNumber}`
      );
    } else {
      fetchedVideoCnt++; // increase the count to avoid throwing error.
      console.info(`${indent}${fileId} is in whiteList, ignore the error`);
    }
  }
  // console.info(resbody);
  return fetchedVideoCnt;
};

handleVideoItem = async (indent, videoItem, columnId, filmId, columnTagArg) => {
  indent += "--";
  let fetchedVideoCnt = 0;
  const {
    contentNumber,
    contentType = 2,
    child,
    programInfo,
    name,
    columnName,
    contentName,
    remark,
  } = videoItem;
  const columnTag = videoItem.columnTag || columnTagArg;

  // if still need to fetch sub list
  if (child && Array.isArray(child) && child.length > 0) {
    fetchedVideoCnt = await fetchChildList(indent, child, filmId);
  } else if (
    programInfo &&
    Array.isArray(programInfo) &&
    programInfo.length > 0
  ) {
    // for(let i = 0; i < programInfo.length; i++) {
    //   const programInfoItem = programInfo[i];
    //   fetchedVideoCnt = fetchedVideoCnt + await handleVideoItem(indent, programInfoItem, columnId, filmId, columnTag);
    // }
    // only need to handle the first one
    const programInfoItem = programInfo[0];
    fetchedVideoCnt += await handleVideoItem(
      indent,
      programInfoItem,
      columnId,
      filmId,
      columnTag
    );
  } else if (contentType === 7) {
    // 7 stands for list
    // fetchedVideoCnt = await fetchChildList(indent, videoItem, filmId);
    fetchedVideoCnt = await fetchList(indent, videoItem.columnId, filmId);
  } else {
    // if it's time to fetch the final content
    console.info(
      `${indent}fetchContent filmId: ${filmId}, columnId: ${columnId}, name: ${name}, ${columnName}, contentName: ${contentName}, remark: ${remark}`
    );
    fetchedVideoCnt = await fetchContent(
      indent,
      columnId,
      filmId,
      columnTag,
      contentNumber,
      contentType
    );
  }
  if (fetchedVideoCnt === 0) {
    console.error(
      `${indent}handleVideoItem failed!!!! filmId: ${filmId}, columnId: ${columnId}, name: ${name}, ${columnName}, contentName: ${contentName}, remark: ${remark} fetched 0!!!!!!`
    );
    debugger;
  }
  return fetchedVideoCnt;
};

const fetchList = async (indent = "", columnId = 2058, filmId = "123518") => {
  indent += "--";
  let fetchedVideoCnt = 0;
  const url = URL_getContentList;
  const headers = {
    filmId: "123518",
  };
  const body = {
    columnId,
    page: 1,
    filmId,
  };
  const resbody = await makeRequest(url, headers, body);
  console.info(`${indent}fetched content list of columnId: ${columnId}`);

  await writeToFile(`${filmId}_${columnId}`, resbody);

  const resJson = JSON.parse(resbody);
  const videoList = resJson.data;
  console.info(
    `${indent}${videoList.length} videos in list - filmId: ${filmId}, columnId: ${columnId} - fetch start`
  );

  for (let i = 0; i < videoList.length; i++) {
    const videoItem = videoList[i];
    const { name, columnName, contentName } = videoItem;
    console.info(
      `${indent}fetch start filmId: ${filmId}, columnId: ${columnId}, name: ${name}, ${columnName}, contentName: ${contentName} i: ${i}`
    );
    fetchedVideoCnt += await handleVideoItem(
      indent,
      videoItem,
      columnId,
      filmId
    );
  }
  console.info(
    `${indent}${videoList.length} videos in list - filmId: ${filmId}, columnId: ${columnId} - fetch end`
  );
  // console.info(resbody);
  if (fetchedVideoCnt === 0) {
    console.error(
      `${indent}fetchList failed!!!! filmId: ${filmId}, columnId: ${columnId} fetched 0!!!!!!`
    );
    debugger;
  }
  return fetchedVideoCnt;
};

let isSkipDone = false;
fetchChildList = async (indent, child, filmId) => {
  indent += "--";
  let fetchedVideoCnt = 0;
  for (let i = 0; i < child.length; i++) {
    if (!isSkipDone) {
      isSkipDone = true;
      i = 45;
    }
    const childInfo = child[i];
    const { columnId, name, columnName } = childInfo;
    console.info(
      `${indent}fetchList filmId: ${filmId}, columnId: ${columnId}, name: ${name}, ${columnName}, i: ${i}`
    );
    fetchedVideoCnt += await fetchList(indent, columnId, filmId);
  }
  if (fetchedVideoCnt === 0) {
    console.error(
      `${indent}fetchChildList failed!!!! filmId: ${filmId}, child: ${JSON.stringify(
        child
      )} fetched 0!!!!!!`
    );
    debugger;
  }
  return fetchedVideoCnt;
};

const indent = "";

// fetchList(indent, 2153, '123518'); // done
// fetchList(indent, 2301, '123518'); // done
// fetchList(indent, 2437, '123518'); // done
// fetchList(indent, 2438, '123518');
// fetchList(indent, 2453, '123518');
// fetchList(indent, 2470, '123518'); // done
// fetchList(indent, 2249, '123518'); // done
// fetchList(indent, 2366, '123518'); // done
// fetchList(indent, 2371, '123518'); // done
// fetchList(indent, 2375, '123518'); // done
// fetchList(indent, 2343, '123518'); // done
// fetchList(indent, 2182, '123518'); // done
// fetchList(indent, 2229, '123518'); // done
// fetchList(indent, 2058, '123518'); // done
// fetchList(indent, 2383, '123518'); // done
// fetchList(indent, 2384, '123518'); // done
// fetchList(indent, 2446, '123518'); // done
// fetchList(indent, 2445, '123518'); // done
// fetchList(indent, 2452, '123518'); // done
// fetchList(indent, 2447, '123518'); // done

// const columnIds = [2490,2491,2488,2489,2486,2487,2484,2485,2482,2483,2480,2481]; // done
const columnIds = [
  // 2153, 2301, 2437, 2438, 2453, 2470, 2249, 2366, 2371, 2375, 2343, 2182, 2229,
  // 2058, 2383, 2384, 2446, 2445, 2452, 2447,
  // 2089, 
  2481, 2482, 2483, 2484, 2485, 2486, 2487, 2488, 2489, 2490, 2491, 2492, 2493, 2494, 2495
];

const main = async () => {
  console.info(`gonow.js start at ${new Date().toLocaleString()}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  for (let i = 0; i < columnIds.length; i++) {
    const columnId = columnIds[i];
    console.info(`fetchList columnId: ${columnId}`);
    await fetchList(indent, columnId, "123518");
  }
  console.info(`gonow.js end at ${new Date().toLocaleString()}`);
};
main();

// fetchList(2058, '123518');
// fetchList();
// fetchContent();
