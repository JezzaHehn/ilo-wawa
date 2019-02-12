//////////////////////////////////
// - - - - - ilo wawa - - - - - //
// ilo wawa li "Discord Bot" pi //
// pana sitelen pi sitelen pona //
//////////////////////////////////

// configuration: prefix, token, gimppath
const config = require("./config.json");

// dictionary of toki pona words, and list
const dict = require('./lib/dict.json');
const langs = require('./lib/langs.json');

// utility functions for filesystem read/write
const fs = require('fs');
const tempy = require('tempy');

// for spawning GIMP process
const spawn = require('child_process').spawn;
const exec = require('child_process').exec;

// Discord bot library
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`------------------------`);
});

client.on('message', async msg => { // for every message, do the following:
  if(!msg.author.bot) { // ignore bots
    if (msg.content.startsWith(config.prefix)) {

      // first split the arguments, remove prefix
      const args = msg.content.slice(config.prefix.length).trim().split(/ +/g);
      // pop first argument (command) and leave the other arguments
      const command = args.shift().toLowerCase();


      // test connection time
      if (command === 'ping') {
        const m = await msg.channel.send("Ping?");
        const reply = `Pong! Latency is ${m.createdTimestamp - msg.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms.`;
        m.edit(reply);
        console.log(reply);
      } // end ping


      // print command list
      if (command === 'help' || command === 'h' || command === '?') {
          var out = '__**nimi ilo pi ilo wawa**__';
          out += '\n──────────';
          out += '\n**d, def, define** *arg1 [arg2 arg3...]* - Define toki pona words';
          out += '\n**e, etym, etymology** *arg1 [arg2 arg3...]* - Print etymologies of words';
          out += '\n**h, help, ?** - Print this command list';
          out += '\n**l, lang, language** *arg1* - (Under Construction) Show all words derived from a language';
          out += '\n**ping** - Determine bot connection speed';
          out += '\n**pu** *arg1 [arg2 arg3...]* - Show whether words are from The Book';
          out += '\n**s, sitelen** - Write in sitelen pona';
          msg.channel.send(out) // send command list to channel
      } // end help

      // define each argument if toki pona word
      if (command === 'd' || command === 'def' || command === 'define') {
        var out = ""; // initialize output string
        for(var i=0; i<args.length; i++) { // for each word
          w = args[i];
          if (i>0) { out += `\n──────────` }
          out += `\n__**${w}**__`; // add word to output
          if (w in dict) {  // if the word is in the dictionary
            var defs = dict[w].defs;
            for(var j=0; j<defs.length; j++) {
              out += `\n• ${defs[j]}`;  // add each definition to output
            }
          } else {
            out += `\nThe word "${w}" was not found. :book::mag::shrug:`;
          }
        }
        msg.channel.send(out) // send data dump to channel
      } // end define


      // give etymology of each argument if toki pona word
      if (command === 'e' || command === 'etym' || command === 'etymology') {
        var out = ""; // initialize output string
        for(var i=0; i<args.length; i++) { // for each word
          w = args[i];
          if (i>0) { out += `\n──────────` }
          out += `\n__**${w}**__`; // add word to output
          if (w in dict) {  // if the word is in the dictionary
            out += `\n*etymology:* ${dict[w].etym}`; // add etymology
          } else {
            out += `\nThe word "${w}" was not found. :book::mag::shrug:`;
          }
        }
        msg.channel.send(out) // send data dump to channel
      } // end etymology


      // give etymology of each argument if toki pona word
      if (command === 'l' || command === 'lang' || command === 'language') {
        var out = "";
        l = args.shift().toLowerCase();
        if (l in langs) {  // if the lang is in the list
          lang = langs[l];
          out += `\n__**${l}**__`; // start with name of requested language
          for (var w in lang.words) {
             out += `\n${w} ← ${lang.words[w]}`; // add word
          }
        } else {
          out += `\nThe language "${l}" was not found in the list of `;
          out += `source languages of Toki Pona. :book::mag::shrug:`;
        }
        if(args.length) {
          out += `\n──────────`
          out += `\nOne language at a time, please. `
          out += `:stuck_out_tongue_winking_eye: :thumbsup:`;
        }
        msg.channel.send(out) // send data dump to channel
      } // end language


      if (command === 'pu') { // is the word pu?
        var out = ""; // initialize output string
        for(var i=0; i<args.length; i++) { // for each word
          w = args[i];
          if (i>0) { out += `\n──────────` }
          out += `\n__**${w}**__`; // add word to output
          if (w in dict) {  // if the word is in the dictionary
            if (dict[w].pu) out += `\nnimi '${w}' li pu. :white_check_mark:`;
            else out += `\nnimi '${w}' li pu ala. :x:`;
          } else {
            out += `\nnimi "${w}" li lon ala. :book::mag::shrug: ni li pu ala. :x:`;
          }
        }
        msg.channel.send(out) // send data dump to channel
      } // end pu


      // convert to sitelen pona
      if (command === 's' || command === 'sitelen') {
        if(args.length == 0) {
          msg.channel.send('o toki e nimi. mi ken sitelen e ona.');
          return
        }

        // combine argument list with spaces to reconstruct sentence
        sentence = "";
        for(var i=0; i<args.length; i++) { // for each word
          if(i>0) sentence += " " // add space between, if not first word
          sentence += args[i];    // add word
        }

        // create temporary .png file and fix backslashes for feckin Winderps
        var file = escape(tempy.file({extension:".png"}));
        file = unescape(file.replace(/%5C/g, "%5C%5C"));
        console.log(`Temp file: ${file}`);

        // concatenate pieces of gimp function to put text in image
        var sitelencommand = '"' + config.gimppath +
          '" -d -b ' + '"(sitelen \\"' + file + '\\" \\"' + sentence +
          '\\" \\"linja pona\\" 50 \'(0 0 0) 25)" -b "(gimp-quit 0)"';

        console.log(`Attempting to sitelen... ${sitelencommand}`);
        msg.channel.startTyping();

        // call gimp to create sitelen png, named after message ID
        const gimpProcess = exec(sitelencommand, function(err, stdout, stderr) {
            console.log(`Process started.`);
            if (err !== 0) {
              console.log(`Process exited with error ${err}: ${stderr}`);
            } else {
              console.log('Process exited without error: ${stderr}')
            }
            msg.channel.stopTyping();
            // reply with attachment of image
            msg.channel.send(`${msg.author} li toki e ni:`, {
              files: [{
                attachment: file,
                name: sentence+".png"
              }]
            });
          }
        );
      } // end sitelen


    }
  }
}); // end message

client.login(config.token);
