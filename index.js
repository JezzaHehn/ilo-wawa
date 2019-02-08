//////////////////////////////////
// - - - - - ilo wawa - - - - - //
// ilo wawa li "Discord Bot" pi //
// pana sitelen pi sitelen pona //
//////////////////////////////////

// configuration include file
// config.token - bot token
// config.prefix - message prefix
const config = require("./config.json");

// utility functions for filesystem read/write
var fs = require('fs');

// for spawning python process
const spawn = require("child_process").spawn;

// Discord bot library
const Discord = require('discord.js');
const client = new Discord.Client();

const dict = require('./lib/rawdict.json'); // dictionary of toki pona words

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`------------------------`);
});

client.on('message', async msg => { // for every message, do the following:
  if(!msg.author.bot) { // ignore bots
    if (msg.content.startsWith(config.prefix)) {

      // first split the arguments, remove prefix, shift to lower case
      const args = msg.content.slice(config.prefix.length).trim().split(/ +/g);
      const command = args.shift().toLowerCase();


      if (command === 'ping') { // test connection time
        const m = await msg.channel.send("Ping?");
        const reply = `Pong! Latency is ${m.createdTimestamp - msg.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms.`;
        m.edit(reply);
        console.log(reply);
      } // end ping


      if (command === 'help' || command === '?') { // print command list
          var out = '__**nimi ilo pi ilo wawa**__ \n';
          out += '\n**define** [*arg1, arg2, arg3,...*] - Define toki pona words';
          out += '\n**help** or **?** - Print this command list';
          out += '\n**ping** - Determine bot connection speed';
          out += '\n**pu** [*arg1, arg2, arg3,...*] - Show whether words are from The Book';
          out += '\n**sitelen** - (under construction) Convert to sitelen pona';
          msg.channel.send(out) // send command list to channel
      } // end help

      if (command === 'define') { // define each argument if toki pona word
        for(var i=0; i<args.length; i++) { // for each word
          w = args[i];
          var out = `──────────\n__**${w}**__`; // initialize output string with word
          if (w in dict) {  // if the word is in the dictionary
            var defs = dict[w].defs;
            for(var j=0; j<defs.length; j++) {
              out += `\n• ${defs[j]}`;  // add each definition to output
            }
            out += `\n*etymology:* ${dict[w].etym}`; // add etymology
          } else {
            out += `\nThe word "${w}" was not found. :book::mag::shrug:`;
          }
          msg.channel.send(out) // send data dump to channel
        }
      } // end define


      if (command === 'pu') { // is the word pu?
        for(var i=0; i<args.length; i++) { // for each word
          w = args[i];
          var out = `──────────\n__**${w}**__`; // initialize output string with word
          if (w in dict) {  // if the word is in the dictionary
            if (dict[w].pu) out += `\nnimi '${w}' li pu. :white_check_mark:`;
            else out += `\nnimi '${w}' li pu ala. :x:`;
          } else {
            out += `\nnimi "${w}" li lon ala. :book::mag::shrug: ni li pu ala. :x:`;
          }
          msg.channel.send(out) // send data dump to channel
        }
      } // end pu


      if (command === 'sitelen') { // convert to sitelen pona
        // combine argument list with spaces to reconstruct sentence
        sentence = "";
        for(var i=0; i<args.length; i++) { // for each word
          sentence += args[i] + ' ';
        }

        // call python function to put text in image
        const pythonProcess = await spawn('python',["./sitelen.py", sentence]);

        // reply with attachment of image
        pythonProcess.on('close', (err) => {
          if (err !== 0) {
            console.log(`process exited with error: ${err}`);
          } else {
            msg.channel.send(`${msg.author} li toki e ni:`,
            new Discord.Attachment("sitelen.png"));
          }
        });
      } // end sitelen


    }
  }
});

client.login(config.token);
