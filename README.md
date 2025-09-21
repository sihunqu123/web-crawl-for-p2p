# web-crawl-for-p2p

A Private Project to Iterate every product id of given serial.

## About gonow

+ find the target columnIds via the json files, then use javascript array map to get the columnIs list: [foundJsonArrayOfColumnsDetails].map(item => item.columnId).join(',')
+ configured in the gonow.js
+ run gonow.js to fetch the full downloadLinks, which will be printed in the console.
+ create a new folder for the logs that we printed. e.g. 20250901
+ create a `SNH_Meta.log` file in that newly created folder
+ paste the logs into `SNH_Meta.log`
+ update the input file of the `extractLinksToDB.js` and execute it, which will extrating the meta info of each link and added them into the `meta8k` talbe of gonow.db, which is a file based databse.
+ the `meta8k` table has a field `createdDate` and we can read those new links via:
  `SELECT a.*, a.link from meta8k a where a.createdDate > replace(strftime('%Y-%m-%dT%H:%M:%SZ', '2025-08-24 14:10:00'), ' ', 'T') order by a.createdDate ASC;`, where `2025-08-24 14:10:00` is the datetime that result much be `after`.
+ now, after your checked those links are expected, just remove th unwant `a.*`, and only leave the `a.link` there to a list of new links we want to download this time. e.g.
  `SELECT a.link from meta8k a where a.createdDate > replace(strftime('%Y-%m-%dT%H:%M:%SZ', '2025-08-24 14:10:00'), ' ', 'T') order by a.createdDate ASC;`
+ download the new links via idm or aria2c.

### About how to select all

1. use mouse to select the first line
2. use the keyboard to navigate to the page down.....
3. copy + c

### About how to exract the download 8k links

Run `extractLinksToDB.js`.

### How to get a list of downloaded file name and the corresponding expected file name:

`SELECT a.fileName, a.category || '_' || a.contentName || '_' || a.fileName as expected_name from meta8k a;`