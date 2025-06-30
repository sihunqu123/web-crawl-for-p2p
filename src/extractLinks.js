const fs = require("fs");
const { add } = require("lodash");
const path = require("path");
const { readFile, writeFile } = require('./util/fileUtils');

// Check if a string contains Chinese characters
function containsChinese(str) {
  const reg = /[\u4e00-\u9fa5]/;
  return reg.test(str);
}

const exractContentName = (line = "") => {
  // Example line containing contentName:
  // --fetch start filmId: 123518, columnId: 2480, name: undefined, undefined, contentName: 250104 X队 杨冰怡《SuperTATA》生日公演 三机位 i: 13
  const matchResult = line.match(/(?<=contentName: )[^\n]+(?=i: )/);
  if (matchResult && matchResult.length > 0) {
    const contentName = matchResult[0].trim();
    console.log("extracted contentName:", contentName);
    return contentName;
  }
  return "";
};

const extractLink = (line = "") => {
  // Example line containing the link:
  // ------fetched videosURL in - columnId: 2481, filmId: 123518, columnTag: 20241227222657, contentNumber: 29974930, name: GNZ48 - http://ucdn.letinvr.com/gnzlive/2025-1yue/8k/250111Zscam.MP4
  const matchResult = line.match(/(?<= )http:\/\/ucdn\.letinvr\.com\/[^\n]+/);
  if (matchResult && matchResult.length > 0) {
    const link = matchResult ? matchResult[0].trim() : "";
    console.log("extracted link:", link);
    return link;
  }
  return "";
};

const isLink8K = (link) => {
	return /\/8k\//i.test(link);
}

/**
 * Example output:
 * {
 *  "GNZ48 - 250111Zscam": ["http://ucdn.letinvr.com/gnzlive/2025-1yue/8k/250111Zscam.MP4"],
 *  "GNZ48 - 250111Zscam2": ["http://ucdn.letinvr.com/gnzlive/2025-1yue/8k/250111Zscam2.MP4"]
 * }
 * Each name can map to multiple links, but a link can only map to one name
 * @param {*} name
 * @param {*} link
 * @param {*} nameToLinkMap
 */
const addToNameToLinkMap = (name, link, nameToLinkMap) => {
  if (!nameToLinkMap[name]) {
    nameToLinkMap[name] = [];
  }
  if (nameToLinkMap[name].includes(link)) {
    console.error(`=====Duplicate link found for name: ${name}, link: ${link}`);
  } else {
    nameToLinkMap[name].push(link);
  }
};

/**
 * Example output:
 * {
 *  "http://ucdn.letinvr.com/gnzlive/2025-1yue/8k/250111Zscam.MP4": "GNZ48 - 250111Zscam",
 *  "http://ucdn.letinvr.com/gnzlive/2025-1yue/8k/250111Zscam2.MP4": "GNZ48 - 250111Zscam2",
 * }
 * Each link can only map to one name, but a name can map to multiple links
 * @param {*} name
 * @param {*} link
 * @param {*} linkToNameMap
 */
const addToLinkToNameMap = (name, link, linkToNameMap) => {
  if (linkToNameMap[link]) {
    console.error(`=====Duplicate name found for link: ${link}, name: ${name}`);
  } else {
    linkToNameMap[link] = name;
  }
};

async function main() {
  // Use path.resolve to ensure absolute path on Windows
  const parentDir = 'T:\\book\\20252206';
  const inputFilePath = path.join(parentDir, "logs.txt"); // Input file path
  const nameToLinkMapOutputPath = path.join(parentDir, "nameToLinkMap.json");
  const linkToNameMapOutputPath = path.join(parentDir, "linkToNameMap.json");

	const nameToLinkMap8KOutputPath = path.join(parentDir, "nameToLinkMap8k.json");
  const linkToNameMap8KOutputPath = path.join(parentDir, "linkToNameMap8k.json");

  const nameToLinkMapNot8KOutputPath = path.join(parentDir, "nameToLinkMapNot8k.json");
  const linkToNameMapNot8KOutputPath = path.join(parentDir, "linkToNameMapNot8k.json");

  const nameToLinkMap = {};
  const linkToNameMap = {};

	const nameToLinkMap8K = {};
  const linkToNameMap8K = {};

  const nameToLinkMapNot8K = {};
  const linkToNameMapNot8K = {};

  let currentContentName = "";
  const udpateContentName = (line) => {
    const contentName = exractContentName(line);
    if (contentName) {
      currentContentName = contentName;
      console.log("Updated currentContentName:", currentContentName);
    }
  };
  try {
    const inputContent = await readFile(inputFilePath);
    let inputLines = inputContent.split("\n");

    for (let i = 0; i < inputLines.length; i++) {
      const lineRaw = inputLines[i];
      const line = (lineRaw + "").trim();

      // Update the current contentName if it is not empty
      udpateContentName(line);

      // Then try to extract the link
      const link = extractLink(line);
      if (link) {
        // If the link is not empty, add it to the nameToLinkMap and linkToNameMap
        addToNameToLinkMap(currentContentName, link, nameToLinkMap);
        addToLinkToNameMap(currentContentName, link, linkToNameMap);

        // If the link is an 8K link, also add it to the 8K maps
        if (isLink8K(link)) {
          addToNameToLinkMap(currentContentName, link, nameToLinkMap8K);
          addToLinkToNameMap(currentContentName, link, linkToNameMap8K);
        } else {
          addToNameToLinkMap(currentContentName, link, nameToLinkMapNot8K);
          addToLinkToNameMap(currentContentName, link, linkToNameMapNot8K);
          console.info(`=====Ignore 2k-4k link: ${link}`);
        }
      }
    }

    await writeFile(nameToLinkMapOutputPath, JSON.stringify(nameToLinkMap, null, 2));
    await writeFile(linkToNameMapOutputPath, JSON.stringify(linkToNameMap, null, 2));

    // Write the filtered 8K maps to the specified output paths
    await writeFile(nameToLinkMap8KOutputPath, JSON.stringify(nameToLinkMap8K, null, 2));
    await writeFile(linkToNameMap8KOutputPath, JSON.stringify(linkToNameMap8K, null, 2));

    // Write the filtered not-8K maps to the specified output paths
    await writeFile(nameToLinkMapNot8KOutputPath, JSON.stringify(nameToLinkMapNot8K, null, 2));
    await writeFile(linkToNameMapNot8KOutputPath, JSON.stringify(linkToNameMapNot8K, null, 2));

    // Output a new file with all unique 8K links (one per line)
    const all8kLinks = Object.keys(linkToNameMap8K);
    const all8kLinksOutputPath = path.join(parentDir, "all_8k_links.txt");
    await writeFile(all8kLinksOutputPath, all8kLinks.join("\n"));

    // Output a new file mapping file name (from 8K link) to content name
    const fileNameToContentNameMap = {};
    for (const [link, contentName] of Object.entries(linkToNameMap8K)) {
      const fileName = link.split("/").pop();
      if (fileName) {
        fileNameToContentNameMap[fileName] = contentName;
      }
    }
    const fileNameToContentNameMapOutputPath = path.join(parentDir, "fileNameToContentName_8k.json");
    await writeFile(fileNameToContentNameMapOutputPath, JSON.stringify(fileNameToContentNameMap, null, 2));
  } catch (err) {
    console.error("Error occurred: ", err);
  }
}

main();
