var axios = require('axios');
var util = require('util');
require('dotenv').config();

const BASE_URL = 'https://gogovan-dev.herokuapp.com/api/v0/';

const HEADER = {
  'GoGoVan-API-Key': process.env.GGV_TOKEN,
  'GoGoVan-User-Language': 'en-US'
}
var hr = '2016-06-28T12:00:00H';

var order_template = {
  "order": {
    "name": "Din",
    "phone_number": "98765432",
    "pickup_time": hr,
    "vehicle": "van",
    "locations": '[[22.312516,114.217874,"Seaview Center, 139 Hoi Bun Road, Hong Kong"],[22.282224,114.129262,"Kennedy Town, Hong Kong"]]'
  }
}
function call( method, path, data ){
  console.log( "%%%% : " +method +" > "+BASE_URL+path);
  return axios({
    headers: HEADER,
    method: method,
    url: BASE_URL+path,
    data: data
  }).catch(function (error) {
    console.log(util.inspect(error, {showHidden: false, depth: null}));
  });
}

var api = {
  get: function (path, data, cb) {
    return axios.all([call('get', path, order_template)])
    .then(axios.spread(function (info) {
      // Both requests are now complete
      console.log( info );
      })
    ).catch(function (res) {
        console.log("SH*******"+res.message);
      if (res instanceof Error) {
        console.log(res.message)
      }
    })
  },
  post: function (path, data, cb) {
    return axios.all([call('post', path, order_template )])
    .then(function (info) {
      // console.log(res)
      return info.map(function (res) {
        return cb(res)
      })
    }).catch(function (res) {
      if (res instanceof Error) {
        console.log(res.message)
      }
    })
  }
}

module.exports = api;
