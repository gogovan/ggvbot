/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
This is a sample Slack bot built with Botkit.
This bot demonstrates many of the core features of Botkit:
* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.
# RUN THE BOT:
  Get a Bot token from Slack:
    -> http://my.slack.com/services/new/bot
  Get a Wit token from Wit.ai
    -> https://wit.ai/apps/new
  Run your bot from the command line:
    wit=<MY WIT TOKEN> token=<MY TOKEN> node bot.js
# USE THE BOT:
  Train a "hello" intent inside Wit.ai.  Give it a bunch of examples
  of how someone might say "Hello" to your bot.
  Find your bot inside Slack to send it a direct message.
  Say: "Hello"
  The bot should reply "Hello!" If it didn't, your intent hasn't been
  properly trained - check out the wit.ai console!
  Make sure to invite your bot into other channels using /invite @<my bot>!
# EXTEND THE BOT:
  Botkit is has many features for building cool and useful bots!
  Read all about it here:
    -> http://howdy.ai/botkit
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
require('dotenv').config();
var util = require('util');
var witAi = require('./lib/ggv/ggvWit')

if (!process.env.SLACK_TOKEN) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

// if (!process.env.WIT_TOKEN) {
//     console.log('Error: Specify wit in environment');
//     process.exit(1);
// }

var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: true
});

var bot = controller.spawn({
    token: process.env.SLACK_TOKEN
}).startRTM();

// controller.middleware.receive.use(wit.interactive);

var context = {};
var sessionID = '';

function handleAction(sessionId, text, context ) {
    witAi.runActions(
      sessionId, // the user's current session
      text, // the user's message
      context // the user's current session state
    ).then((context) => {
      // Our bot did everything it has to do.
      // Now it's waiting for further messages to proceed.
      console.log('Waiting for next user messages');

      // Based on the session state, you might want to reset the session.
      // This depends heavily on the business logic of your bot.
      // Example:
      // if (context['done']) {
      //   delete sessions[sessionId];
      // }

      // Updating the user's current session state
      // sessions[sessionId].context = context;
      console.log (  util.inspect(context , {showHidden: false, depth: null}));
      console.log ( text );
    })
    .catch((err) => {
      console.error('Oops! Got an error from Wit: ', err.stack || err);
    })
}

controller.middleware.receive.use(function(bot, message, next) {
    sessionID = message.channel+'.'+ message.user;
    console.log('!!!!!!!!! Receive middleware!');
    console.log( util.inspect(message , {showHidden: false, depth: null}));
    // make changes to bot or message here before calling next
    if (message.text == 'hello' || message.text == 'hi' || message.text == 'howdy' || message.text == 'hey') {
        message.intent = 'hello';
    }
    if( message && message.text ){
      console.log( "calling WIT !!!!!!!!****** " );
      witAi.converse(sessionID, message.text, context)
      .then((data) => {
        console.log('Yay, got Wit.ai response: ' );
        console.log( util.inspect(data, {showHidden: false, depth: null}));
        if ( data.type == 'action' ){
          // var result = witAi.config.actions[data.action]({context, data.entities });
          //witAi.runActions(sessionID, '', context )
          witAi.interactive();
          next();
        }
        if ( data.msg) {
          bot.reply(message, data.msg);
          next();
        }

      })
      .catch(console.error);
    }

});

// Example send middleware
// make changes to bot or message here before calling next
// for example, do formatting or add additional information to the message
controller.middleware.send.use(function(bot, message, next) {

    console.log('Send middleware!');
    next();

});

/* note this uses example middlewares defined above */
controller.hears(['ggv, order'], 'direct_message,direct_mention,mention', function(bot, message) {
    // console.log( ">>>>>");
    // // console.log( message);
    // console.log( witAi);
    // console.log( "<<<<<");
});

controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.api.reactions.add({
        timestamp: message.ts,
        channel: message.channel,
        name: 'robot_face',
    }, function(err, res) {
        if (err) {
            bot.botkit.log('Failed to add emoji reaction :(', err);
        }
    });


    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Hello ' + user.name + '!!');
        } else {
            bot.reply(message, 'Hello.');
        }
    });
});
