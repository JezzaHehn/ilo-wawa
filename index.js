//////////////////////////////////
// - - - - - ilo wawa - - - - - //
// ilo wawa li "Discord Bot" pi //
// pana sitelen pi sitelen pona //
//////////////////////////////////

// configuration: prefix, token, gimppath
const config = require("./config.json");

// dictionary of toki pona words, and list of source languages
const dict = require('./lib/dict.json');
const langs = require('./lib/langs.json');

// utility functions for filesystem read/write
const fs = require('fs');
const tempy = require('tempy');

// for forking GIMP child process
const exec = require('child_process').exec;

// Discord bot library
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`------------------------`);
  console.log(`${langs["english"].aliases}`)
});

client.on('message', async msg => { // for every message, do the following:
  if(!msg.author.bot) { // ignore bots

    if (msg.content.toLowerCase().match(/ilo wawa/g)) { // listen for name to react
      if (msg.content.toLowerCase().match(/olin/g)) { // listen for olin
        msg.react("🔨").then(() => {
          msg.react("❤").then(() => {
            console.log(`mi olin e ${msg.author.tag}`)
          }).catch(err => {
            console.log(`error: ${err}`);
          })
        }).catch(err => {
          console.log(`error: ${err}`);
        })
      }
      if (msg.content.toLowerCase().match(/thank/g)) { // listen for thank
        msg.react("🔨").then(() => {
          msg.react("👍").then(() => {
            console.log(`mi pilin pona e ${msg.author.tag}`)
          }).catch(err => {
            console.log(`error: ${err}`);
          })
        }).catch(err => {
          console.log(`error: ${err}`);
        })
      }
    }

    if (msg.content.startsWith(config.prefix)) { // listen for command prefix

      // first split the arguments, remove prefix
      let args = msg.content.slice(config.prefix.length)
                              .trim().replace(/\n/g, '\\n').split(/ +/g);
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
          let out = '__**nimi ilo pi ilo wawa**__';
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
        let out = ""; // initialize output string
        for(let i=0; i<args.length; i++) { // for each word
          w = args[i];
          if (i>0) { out += `\n──────────` }
          out += `\n__**${w}**__`; // add word to output
          if (w in dict) {  // if the word is in the dictionary
            let defs = dict[w].defs;
            for(let j=0; j<defs.length; j++) {
              out += `\n• ${defs[j]}`;  // add each definition to output
            }
            if (dict[w].rep) out += `\n${dict[w].rep}`;
          } else {
            out += `\nThe word "${w}" was not found. :book::mag::shrug:`;
          }
        }
        msg.channel.send(out) // send data dump to channel
      } // end define


      // give etymology of each argument if toki pona word
      if (command === 'e' || command === 'etym' || command === 'etymology') {
        let out = ""; // initialize output string
        for(let i=0; i<args.length; i++) { // for each word
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
        let out = ""; // output string
        let l; // name of desired language, pulled from arguments
        let isLang = false; // is the language in the list?
        let isTooMany = false; // were there too many arguments?
        switch (args.length) {
          case 0:
            msg.channel.send("Pick a language to list all toki pona words from that language.");
            return;
          case 1:
            l = args.shift().toLowerCase();
            if (l in langs) isLang = true;
            else {
              for (lang in langs) {
                for (alias in langs[lang].aliases) {
                  if (l === langs[lang].aliases[alias]) {
                    isLang = true;
                    l = lang;
                    break
                  }
                }
              }
            }
            break;
          default:
            l1 = args.shift().toLowerCase();
            l2 = l1 + " " + args.shift().toLowerCase();
            if (l2 in langs) {
              isLang = true;
              l = l2;
            }
            else {
              if (l1 in langs) {
                isLang = true;
                l = l1;
              } else {
                for (lang in langs) {
                  for (alias in langs[lang].aliases) {
                    if (l1 === langs[lang].aliases[alias]) {
                      isLang = true;
                      l = lang;
                      break
                    }
                  }
                }
              }
              if (isLang) {
                out += `\nOne language at a time, please. `
                out += `:stuck_out_tongue_winking_eye: :thumbsup:`;
                out += `\n──────────`;
              }
              break;
            }
            if(args.length) {
              out += `\nOne language at a time, please. `
              out += `:stuck_out_tongue_winking_eye: :thumbsup:`;
              out += `\n──────────`;
            }
            break;
        }
        if (isLang) {  // if the language was found
          lang = langs[l];
          out += `\n__**${l}**__`; // start with name of requested language
          for (w in lang.words) {
             out += `\n${w} ← ${lang.words[w]}`; // add word
          }
        } else { // if the lang was not found
          out += `\nThe language "${l}" was not found in the list of `;
          out += `source languages of Toki Pona. :book::mag::shrug:`;
        }
        msg.channel.send(out) // send data dump to channel
      } // end language


      if (command === 'pu') { // is the word pu?
        let out = ""; // initialize output string
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
        let sentence = "";
        for(let i=0; i<args.length; i++) { // for each word
          if(i>0) sentence += " " // add space between, if not first word
          sentence += args[i];    // add word
        }

        // create temporary .png file and fix backslashes for feckin Winderps
        let file = escape(tempy.file({extension:".png"}));
        file = unescape(file.replace(/%5C/g, "%5C%5C"));
        console.log(`Temp file: ${file}`);

        // concatenate pieces of gimp function to put text in image
        const sitelencommand = '"' + config.gimppath +
          '" -d -b ' + '"(sitelen \\"' + file + '\\" \\"' + sentence +
          '\\" \\"linja pona\\" 50 \'(0 0 0) 20)" -b "(gimp-quit 0)"';

        console.log(`Attempting to sitelen... ${sitelencommand}`);
        msg.channel.startTyping();

        // call gimp to create sitelen png, named after message ID
        const gimpProcess = exec(sitelencommand, function(err, stdout, stderr) {
            console.log(`Process started.`);
            if (err) {
              console.log(`Process exited with error ${err}: ${stderr}`);
            } else {
              console.log(`Process exited without error: ${stdout}`)
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
