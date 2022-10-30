const cookie = 'theme=; _ga=GA1.2.1606020492.1633308368; _gid=GA1.2.1871150822.1667047545; cf_chl_2=0e0c0d49f9b59b4; cf_chl_prog=x13; cf_clearance=a996e8f5bf113247b8a12d0d23d354f591479612-1667148595-0-150; _gat_gtag_UA_163225115_1=1';

const maxRetrytimes = 3;

const keyword = 'taboo%20vr';
const startPage = 1;
const endPage = 2;
const sort = 'bysize';

// https://bt4g.org/search/taboo%20vr/bysize/1

const dbConfig = {
  host: 'mysql-host',
  port: 3306,
  user: 'root',
  password: 'passw0rd',
  database: 'torrent',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 20,
  supportBigNumbers: true,
  bigNumberStrings: true,
};

module.exports = {
  cookie,
  maxRetrytimes,
  keyword,
  startPage,
  endPage,
  sort,
  dbConfig,
};
