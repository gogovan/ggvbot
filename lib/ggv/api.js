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
function googleAPI( textSearch ){
  var mapURL = 'https://maps.googleapis.com/maps/api/place/textsearch/json?';
  mapURL+= 'key='+process.env.GOOGLE_TOKEN+"&query="+encodeURIComponent(textSearch);
  console.log( "%%%% : " +textSearch +" > "+mapURL);
  return axios.get(mapURL)
  .then(function (response) {
    console.log(response);
    return response;
  })
  .catch(function (error) {
    console.log(error);
  });
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
        console.log(BASE_URL+path +" |||||| : " +util.inspect(info.data, {showHidden: false, depth: null}));
        return cb(info.data);
      })
    ).catch(function (res) {
      if (res instanceof Error) {
        console.log(res.message)
      }else {
        console.log(util.inspect(res, {showHidden: false, depth: null}));
      }
    })
  },
  post: function (path, data, cb) {
    return axios.all([call('post', path, order_template )])
    .then(function (info) {
      // console.log(res)
      return info.map(function (res) {
        return cb(res.data)
      })
    }).catch(function (res) {
      if (res instanceof Error) {
        console.log(res.message)
      }
    })
  },
  searchLocation: function( textSearch, cb ){
    return axios.all([googleAPI(textSearch)])
    .then(function (info) {
      // console.log(res)
      return info.map(function (res) {
        return cb(res.data)
      })
    }).catch(function (res) {
      if (res instanceof Error) {
        console.log(res.message)
      }
    })
  }
}

module.exports = api;
