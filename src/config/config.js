const cookie = 'theme=; _ga=GA1.2.1606020492.1633308368; _gid=GA1.2.725348172.1668174248; cf_chl_2=d742eb62a227eb9; cf_chl_prog=x13; cf_clearance=gOEJyGGRNmX495nhAOXY9m3lF3vHShhaPwqTdfvEBkM-1668306195-0-150; _gat_gtag_UA_163225115_1=1';

const maxRetrytimes = 8;
const RESTConcurrency = 2;

const keyword = 'Uncensored-Leaked'.replaceAll('%20', '-');
const startPage = 1;
const endPage = 67;
// * @param sortColumn: bysize; (empty) -> bytime; byseeders; byrelevance;
// const sort = ''; // leave emtpy for sorting by date
// const sort = 'bysize';
// const sort = 'byseeders';
const sort = 'byrelevance';

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
  RESTConcurrency,
};
