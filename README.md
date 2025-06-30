# web-crawl-for-p2p

A Private Project to Iterate every product id of given serial.

## About gonow

1. find the target columnIds via the json files, then use javascript array map to get the columnIs list: [foundJsonArrayOfColumnsDetails].map(item => item.columnId).join(',')
2. configured in the gonow.js
3. run gonow.js to fetch the full downloadLinks, which will be printed in the console.
4. extracted the download 8k links from the console.
5. remove existed one from the extracted content, as `newly updated content`
6. download the `newly updated content` via idm or aria2c.

### About how to select all

1. use mouse to select the first line
2. use the keyboard to navigate to the page down.....
3. copy + c

### About how to exract the download 8k links


