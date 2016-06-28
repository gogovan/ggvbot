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

  Run your bot from the command line:

    token=<MY TOKEN> node slack_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it is running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
require('dotenv').config();

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

var ggvapi = require( './lib/ggv/api.js');

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('./lib/Botkit.js');
var os = require('os');

var controller = Botkit.slackbot({
    debug: true
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();


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

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});

controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {
  askName(bot,message,  'Your name is' + message.user.name );
});


controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});


controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
             '>. I have been running for ' + uptime + ' on ' + hostname + '.');

    });
controller.hears(['ggv', 'gogovan'], 'direct_message,direct_mention,mention', function(bot, message) {
  bot.startConversation(message, function(err, convo) {
      /***************
      convo.ask('May I ask who is the sender ?', function(response, convo) {

      }, {'key': 'senderContact'});
      convo.ask('What\'s the sender contact?', function(response, convo) {

      }, {'key': 'senderNumber'});

      convo.ask('Where can I pick it up (starting point)?', function(response, convo) {

      }, {'key': 'senderLocationStart'});

      convo.ask('Where do I send to (destination)?', function(response, convo) {

      }, {'key': 'senderLocationStart'});
      convo.ask('Any contact for reciver ? ')

      */
      getLocation(bot, message, convo);
      convo.ask('Correct?', [
        {
            pattern: 'yes',
            callback: function(response, convo) {
                convo.say('YES created!');
                console.log("******************");
                console.log(ggvapi);
                var cb = function(res){
                  console.log(">>>>>>>>>>>>>>>>>>");
                  convo.say( res.breakdown.fee.title + " : "+ res.breakdown.fee.value );
                  console.log( res );
                  console.log("<<<<<<<<<<<<<<<<<<");
                  convo.next();
                }
                ggvapi.get('orders/price.json', null, cb);
                console.log("******************");
            }
        },
        {
            pattern: 'no',
            callback: function(response, convo) {
                convo.say('*Edit!*');
                convo.stop();
            }
        },
        {
            default: true,
            callback: function(response, convo) {
                convo.repeat();
                convo.next();
            }
        }
      ]);
      convo.on('end', function(convo) {
          if (convo.status == 'completed') {
              bot.reply(message, 'OK! I will update my dossier...');
          } else {
              bot.reply(message, 'OK, nevermind!');
          }
      });
  });
});
function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}
function getLocation( bot, message, convo ){
  controller.storage.users.get(message.user, function(err, user) {
    if (user && user.locations ) {

    } else {

      convo.say('The starting point address / landscape name');
      convo.ask('Where should I pick up the package? ', function(message, convo) {
        var cb = function(res){
          if ( res.status == 'OK') {
            console.log("GOOGLE!!!!!!!!!");
              var getReply = function( res ) {
                for (var key in res.results) {
                  var text = "{0}: {1}\n".format(res.results[key].name, res.results[key].formatted_address );
                  console.log( text );
                  this.convo.ask('is this place ? '+ text, [
                    {
                        pattern: 'yes',
                        callback: function(response, convo) {
                            convo.say( 'CHOSE '+ text);
                            convo.next();
                        }
                    },
                    {
                        pattern: 'no',
                        callback: function(response, convo) {
                            convo.stop();
                        }
                    },
                    {
                        default: true,
                        callback: function(response, convo) {
                            convo.next();
                        }
                    }
                  ]);
                }
              }
              getReply(res);
            console.log("<<<<<<<<<<<<<<<<<<!!!!!!!!!!!!!!!!!");
          }
          // convo.next();
        }.bind(this);
        ggvapi.searchLocation(message.text, cb);
      });
    }
  });
}
function askName(bot,message, replyMessage ){
  controller.storage.users.get(message.user, function(err, user) {
      if (user && user.name) {
          bot.reply(message, replyMessage);
      } else {
          bot.startConversation(message, function(err, convo) {
              if (!err) {
                  convo.say('I do not know your name yet!');
                  convo.ask('What should I call you?', function(response, convo) {
                      convo.ask('You want me to call you `' + response.text + '`?', [
                          {
                              pattern: 'yes',
                              callback: function(response, convo) {
                                  // since no further messages are queued after this,
                                  // the conversation will end naturally with status == 'completed'
                                  convo.next();
                              }
                          },
                          {
                              pattern: 'no',
                              callback: function(response, convo) {
                                  // stop the conversation. this will cause it to end with status == 'stopped'
                                  convo.stop();
                              }
                          },
                          {
                              default: true,
                              callback: function(response, convo) {
                                  convo.repeat();
                                  convo.next();
                              }
                          }
                      ]);

                      convo.next();

                  }, {'key': 'nickname'}); // store the results in a field called nickname

                  convo.on('end', function(convo) {
                      if (convo.status == 'completed') {
                          bot.reply(message, 'OK! I will keep it in mind');

                          controller.storage.users.get(message.user, function(err, user) {
                              if (!user) {
                                  user = {
                                      id: message.user,
                                  };
                              }
                              user.name = convo.extractResponse('nickname');
                              controller.storage.users.save(user, function(err, id) {
                                  bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                              });
                          });

                      } else {
                          // this happens if the conversation ended prematurely for some reason
                          bot.reply(message, 'OK, nevermind!');
                      }
                  });
              }
          });
      }
  });
}
