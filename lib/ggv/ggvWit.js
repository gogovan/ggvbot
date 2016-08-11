'use strict';
var firebase = require("firebase");
var util = require('util');
let GGVAPI = require('./api');

let accessTokenENV = process.env.WIT_TOKEN;
let firebaseConfig = process.env.FIREBASE;
firebase.initializeApp(JSON.parse(firebaseConfig));

let Wit = null;
try {
  // if running from repo
  Wit = require('../').Wit;
} catch (e) {
  Wit = require('node-wit').Wit;
}

var db = firebase.database();
const dbPATH = "locations/searched";
var locationRef = db.ref(dbPATH);
var contactRef = db.ref("contacts");

const getEntityValue = (entities, entity, index=0) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > index &&
    entities[entity][index].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const addressStr = function( location ){
  return '{0},{1},"{2}"'.format(location['geometry'].location.lat,location['geometry'].location.lng,location.vicinity);
}


const accessToken = (() => {
  var key = accessTokenENV;
  if (process.argv.length !== 3 ) {
    if (!accessTokenENV){
      console.log('usage: node examples/basic.js <wit-access-token>');
      process.exit(1);
    }
  } else {
     key = process.argv[2];
  }
  return key;
})();

const actions = {
  send(request, response) {
    const {sessionId, context, entities} = request;
    const {text, quickreplies} = response;
    return new Promise(function(resolve, reject) {
      //console.log( util.inspect(request, {showHidden: false, depth: null}));
      console.log('user said...', request.text);
      console.log('sending...', JSON.stringify(response));

      return resolve();
    });
  },
  saveName({context,entities}){
    return new Promise(function(resolve, reject) {
      var name = getEntityValue(entities, 'contact');
      if ( name ){
        context.name = name;
        delete context.missingName;
      } else {
        context.missingName = true;
      }
      return resolve(context);
    });
  },
  searchLocation({context, entities}) {
    return new Promise(function(resolve, reject) {
      if(  entities['yes_no'] && entities['yes_no'].value == 'no' ){
        console.log("poped a savedLocation!");
        context.savedLocation.pop();
      }
      // console.log( entities );
      var location = getEntityValue(entities, 'local_search_query',0)
      // console.log( getEntityValue(entities, 'local_search_query',0) );
      if (!location){
         context.missLocation = true;
         return resolve(context);
      }
      location = location.toLowerCase();
      let cb = function(data){
        if (data.results[0]){
          locationRef.update({[location]: data});
          context.location = '`'+location + "` : "+ data.results[0].vicinity;
          if (context.savedLocation){
            context.savedLocation.push( data.results[0] );
          }else{
            context.savedLocation = [data.results[0]] ;
          }
          delete context.missingLocation;
        } else {
          context.missingLocation = true;
        }
        return resolve(context);
      }
      var locationFound = db.ref(dbPATH+"/"+location);
      locationFound.on("value", function(snapshot) {
        console.log(snapshot.val());
        if ( snapshot.val() ) {
          cb(snapshot.val() );
        } else {
          GGVAPI.searchLocation(location,cb);
        }
      }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
      });
    });
  },
  checkLocationQuote({context, entities}){
    return new Promise(function(resolve, reject) {
      var currentdate = new Date();
      if( context.savedLocation ){
        var order = {
          "order": {
            "name": "test",
            "phone_number": "98765432",
            "pickup_time": currentdate,
            "vehicle": "van",
            "locations": '[['+addressStr(context.savedLocation[0])+'],['+addressStr(context.savedLocation[1])+']]'
          }
        };
        var cb = function(res){
          context.totalPrice = "'"+res.breakdown.fee.value+"`";
          return resolve(context);
        }
        GGVAPI.getOrderPrice( order, cb);
      }
    });
  },
  placeOrder({context,entities}){
    return new Promise(function(resolve, reject){
      if( context.savedLocation ){
        var currentdate = new Date();
        var name = context.name;
        var phone_number = getEntityValue(entities, 'phone_number');
        var order = {
          "order": {
            "name": name,
            "phone_number": phone_number,
            "pickup_time": ""+currentdate,
            "vehicle": "van",
            "locations": '[['+addressStr(context.savedLocation[0])+'],['+addressStr(context.savedLocation[1])+']]'
          }
        };
        if ( name && phone_number ){
          contactRef.update({[name]: phone_number});
        }
        console.log ( util.inspect(order, {showHidden: false, depth: null}) );
        var cb = function(res){
          context.status = "Order ID : "+ res.id;
          return resolve(context);
        }
        GGVAPI.createOrder( order, cb);
      }
    });
  }
};

const client = new Wit({accessToken, actions});
// client.interactive();
module.exports = client;
