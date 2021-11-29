const { JSDOM } = require('jsdom')
const axios = require('axios')

const gedo = require('./src/gedo')
const jup = require('./src/jup')
const shima = require('./src/shima')

const { document } = new JSDOM(
    '<h2 class="title">Hello world</h2>'
).window
const heading = document.querySelector('.title')
heading.textContent = 'Hello there!'
heading.classList.add('welcome')

// console.info(heading.innerHTML);


const start = 0;
const end = 1;
const result = {};

const doSleep = async (timeInMS) => {
  return new Promise(resolve => {
    setTimeout(() => {resolve()}, timeInMS);
  });  
}

const doDOMURL = async (url, res) => {

//async function getForum() {
//  try {
//    const response = await axios.get(
//      'https://www.reddit.com/r/programming.json'
//    )
//    console.log(response)
//  } catch (error) {
//    console.error(error)
//  }
//}

  return JSDOM.fromURL(url).then(dom => {
    console.log(dom.serialize());
  }).catch(err => {
    console.error(`failed to load url: ${url}`);
  });
}


shima.scrawlGEDO();
