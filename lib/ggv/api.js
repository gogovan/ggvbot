var axios = require('axios');

const BASE_URL = 'https://gogovan-dev.herokuapp.com/api/v0/';
const GGV_API_KEY = "98402635-90ca-4c25-814d-2774450953f9";

const HEADER = {
  'Accept-Charset': 'utf-8',
  'GoGovan-API-Key': GGV_API_KEY
}


var order_template = {
  "order": {
    "name": "Ben Sharman",
    "phone_number": "010-9867-2322",
    "vehicle": "motorcycle",
    "pickup_time": Date.now(),
    "remark": "something",
    "coupon_code": "",
    "item_type": "documents",
    "service_type": "transport",
    "number_of_items": 4,
    "locations": [
      [
        22.2838583,
        114.1546328,
        "香港中環皇后大道中118"
      ],
      [
        22.2786395,
        114.1815929,
        "香港堅拿道東2000年廣場"
      ]
    ],
    "extra_requirements": {
      "is_raining": false,
      "is_snowing": false,
      "express_service": false
    }
  }
}
function call( method, path, data ){
  console.log( "%%%% : " +method +" > "+BASE_URL+path);
  return axios({
    headers: HEADER,
    method: method,
    url: BASE_URL+path,
    data: JSON.stringify(data)
  }).catch(function (error) {
    console.log(error);
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
