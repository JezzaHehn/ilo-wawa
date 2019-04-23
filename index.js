//////////////////////////////////
// - - - - - ilo wawa - - - - - //
// ilo wawa li "Discord Bot" pi //
// pana sitelen pi sitelen pona //
//////////////////////////////////

// configuration: prefix, token, gimppath
const config = require("./config.json");
const pfx = config.prefix;

// toki pona language resources
const puDict = require('./lib/puDict.json');  // just pu words and definitions
const exDict = require('./lib/exDict.json');  // extra nonpu definitions and words
var puWordList, exWordList;
const langs = require('./lib/langs.json');      // list of source languages
var beDict = require('./lib/BasicEnglish.json');// original word list pulled from wikipedia
var janLawa = require('./janLawa.json');        // list of approved user ids

// utility functions for filesystem read/write and encrypting user ids
const fs = require('fs');
const tempy = require('tempy');
const CryptoJS = require('crypto-js');

// sleep function because this isn't part of javascript natively for some reason?
sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// for forking GIMP child process
const exec = require('child_process').exec;

// Discord bot library
const Discord = require('discord.js');
const client = new Discord.Client();

function dictPrint(w) {
  out = "";
  out += `__**${w}**__`; // add word to output
  if (w in puDict) {  // if the word is pu
    out += `\nnimi '${w}' li pu. :white_check_mark:`;
    let defs = puDict[w].defs;
    for(let i=0; i<defs.length; i++) {
      out += `\n• ${defs[i]}`;  // add each pu definition to output
    }
    if (w in exDict) out += `\n__pu ala la sona pi nimi ni:__`;
  }
  if (w in exDict) {  // if there is extra information
    if (!exDict[w].pu) {
      if (exDict[w].community) out += `\nnimi '${w}' li sin pi jan Sonja ala, li pu ala. :x:`;
      else out += `\nnimi '${w}' li pu ala. :x:`;
    }
    let defs = exDict[w].defs;
    for(let i=0; i<defs.length; i++) {
      out += `\n• ${defs[i]}`;  // add each extra definition to output
    }
    if (exDict[w].rep) out += `\n${exDict[w].rep}`;
  }

  // add etymology
  if (w in puDict) out += `\n*etymology:* ${puDict[w].etym}`;
  else if (w in exDict) out += `\n*etymology:* ${exDict[w].etym}`;

  if (!(w in puDict || w in exDict)) {  // if the word isn't found at all
  out += `\nlipu la nimi "${w}" li lon ala. :book::mag::shrug:`;
}
return out
}

function puPrint(w) {
  out = "";
  out += `__**${w}**__`; // add word to output
  if (w in puDict) {  // if the word is pu
    out += `\nnimi '${w}' li pu. :white_check_mark:`;
    let defs = puDict[w].defs;
    for(let i=0; i<defs.length; i++) {
      out += `\n• ${defs[i]}`;  // add each pu definition to output
    }
  } else {  // if the word isn't pu
    out += `\nnimi '${w}' li pu ala. :x:`;
  }
  return out
}

function bePrint(w) {
  out = "";
  out += `__**${w}**__`; // add word to output
  if(beDict[w].length == 0) out += `\n(Nothing yet; make a suggestion with __${pfx}c__ontribute)`
  for(d in beDict[w]) out += `\n• ${beDict[w][d].def}`
  return out
}

async function contribute(msg, count) {
  let out;
  words = Object.keys(beDict)   // array of strings (basic english words)
  filter = m => (m.author.id === msg.author.id)

  do {  // only find undefined words
    w = words[Math.floor(Math.random()*words.length)] // string, selected word
  } while(beDict[w].length != 0) // do until finding a word with no definitions
  console.log("word is", w)
  msg.channel.send(`nimi "${w}" li seme?`)
  await sleep(100);

  let collector = msg.channel.createMessageCollector(filter, {
    maxMatches:1,
    time: 60000,
    errors: ['time']
  })

  collector.on('collect', (m, collector) => {
    let defs = m.content.match(/[^\r\n]+/g) // split by newline
    out = `pona. :ok_hand: nimi "${w}"` // reset output buffer to send confirmation later
    for(d in defs) {
      out += ` li '${defs[d]}'`
      console.log(`${m.author.tag} said that '${w}' is "${defs[d]}"`)
      beDict[w].push({
        def:defs[d],
        usr:CryptoJS.HmacSHA1(m.author.id, config.token).toString(),
        ver:false
      }) // add each def into dict, but unverified
    }
    out += '.\n\n'
  })

  collector.on('end', async () => {
    if(out) {
      msg.channel.send(out)
      await sleep(100);
      if(--count) contribute(msg, count) // recurse until the count is empty
      else {
        msg.channel.send('pona mute a! pali lili la luka mute li pali! :+1:')
        console.log('Contribution ended. Saving Basic English dictionary to file...')
        fs.writeFile("./lib/BasicEnglish.json", JSON.stringify(beDict, null, 2), (err) => console.log(err));
      }
    } else {
      msg.channel.send('tenpo suli la sina toki e ala.')
      console.log('Contribution ended. Saving Basic English dictionary to file...')
      fs.writeFile("./lib/BasicEnglish.json", JSON.stringify(beDict, null, 2), (err) => console.log(err));
    }
  })

} // end contribute()

async function verify(msg, count) {
  words = Object.keys(beDict)   // array of strings (basic english words)
  filter = m => (m.author.id === msg.author.id)
  cryptid = CryptoJS.HmacSHA1(msg.author.id, config.token).toString()
  let w, out;

  for(word in words) {
    for(d in Object.entries(beDict[words[word]])) {
      if(beDict[words[word]][d].ver == false &&
         beDict[words[word]][d].usr != cryptid) {
        w = words[word];
      }
    }
    if(w != null) break
  }

  if(w == null) return
  else console.log("Checking the word", w)

  var d;
  for(def in beDict[w]) if(beDict[w][def].ver == false) d = def

  msg.channel.send(`nimi "${w}" la, '${beDict[w][d].def}' li pona ala pona? 👍/👎?`)
  await sleep(100);

  let collector = msg.channel.createMessageCollector(filter, {
    maxMatches:1,
    time: 60000,
    errors: ['time']
  })

  collector.on('collect', (m, collector) => {
    if(m.content.match(/^(y|n|pona|ala)/i) || m.content.includes("👍") || m.content.includes("👎")) {
      if(m.content.match(/^(n|(pona )?ala|ike)/i) || m.content.includes("👎")) {
        // remove the definition
        beDict[w].splice(beDict[w].indexOf(beDict[w][d]), 1)
        out = 'mi weka e sona pakala. 👋'
      } else if(m.content.match(/^(pona|y)/i) || m.content.includes("👍")) {
        // mark the definition as verified by the user's encrypted id
        beDict[w][d].ver = cryptid
        out = ':white_check_mark: sona li pona. ni li awen. 👍'
      } else {  // otherwise, bad input
        out = `:x: ni li pakala... o toki e '👍/👎', 'y/n', 'pona/ala'. tenpo ni la mi pini.`
      }
    }
  })

  collector.on('end', async () => {
    if(out) {
      msg.channel.send(out)
      await sleep(100);
      if(--count) verify(msg, count) // recurse until the count is empty
      else {
        msg.channel.send('pona mute a! pali lili la luka mute li pali! :+1:')
        console.log('Verification ended. Saving Basic English dictionary to file...')
        fs.writeFile("./lib/BasicEnglish.json", JSON.stringify(beDict, null, 2), (err) => console.log(err));
      }
    } else {
      msg.channel.send('tenpo suli la sina toki e ala.')
      console.log('Verification ended. Saving Basic English dictionary to file...')
      fs.writeFile("./lib/BasicEnglish.json", JSON.stringify(beDict, null, 2), (err) => console.log(err));
    }
  })

} // end verify

async function parseCmd(msg) {
  // first split the arguments, remove prefix
  let args = msg.content.slice(pfx.length)
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
    let out = '';
    out +='```╔══════════════════════╗';
    out += '\n║ nimi ilo pi ilo wawa ║';
    out += '\n╚══════════════════════╝```';
    out += `\nCommand abbreviations are __u__nderlined.\n`;
    out += `\n**•   __${pfx}c__ontribute** *[number]* - Help build the phrasebook`;
    out += `\n**•   __${pfx}d__efine** *[words...]* - Define toki pona words, or show word list`;
    out += `\n**•   __${pfx}e__tymology** *word [words...]* - Show etymologies of words`;
    out += `\n**•   __${pfx}f__ind** *word or phrase* - Search the dictionary and phrasebook`;
    out += `\n**•   __${pfx}h__elp, ${pfx}?** - Print this command list`;
    out += `\n**•   __${pfx}l__anguage** [*language*] - Show language list, or show words derived from a language`;
    out += `\n**•   ${pfx}ping** - Determine bot connection speed`;
    out += `\n**•   ${pfx}pu** *[words...]* - Show only pu word list and definitions`;
    out += `\n**•   __${pfx}q__uiz** *[number]* - Test your pu vocabulary knowledge!`;
    out += `\n**•   __${pfx}s__itelen** *sentence* - Write in sitelen pona`;
    out += '\n\nFor more information, visit <https://github.com/Anthrakia/ilo-wawa>'
    msg.channel.send(out) // send command list to channel
  } // end help

  // allow users to contribute to translations
  if (command === 'c' || command === 'contribute') {
    if(args.length == 0) {  // if no args, do it five times.
      count = 5
    } else {
      if(isNaN(args[0])) {
        msg.channel.send('ona li nanpa ala... o toki e nanpa anu ala.')
        return
      } else count = Math.floor(Number(args[0]));
    }
    if(count>25) {
      msg.channel.send('nanpa sina li suli mute kin! o toki e nanpa lili.')
      return
    }
    if(count<1) {
      msg.channel.send('nanpa sina li lili mute kin! o toki e nanpa suli.')
      return
    }
    msg.channel.send(`a pona! mi kama pana e nimi Inli ${count} tawa sina. nimi la sina ken pana e sona mute tawa linja mute.`)
    contribute(msg, count);
  } // end contribute

  // define each argument if toki pona word
  if (command === 'd' || command === 'def' || command === 'define') {
    let out = ""; // initialize output string
    if(args.length == 0) {  // if no args, list all words
      out = puWordList + exWordList;
    } else for(i=0; i<args.length; i++) { // for each word
      w = args[i];
      if (i>0) out += "\n────────────────────────";
      out += "\n" + dictPrint(w);
    }
    msg.channel.send(out) // send data dump to channel
  } // end define

  // give etymology of each argument if toki pona word
  if (command === 'e' || command === 'etym' || command === 'etymology') {
    let out = ""; // initialize output string
    for(i=0; i<args.length; i++) { // for each word
      w = args[i];
      if (i>0) { out += "\n────────────────────────" }
      out += `\n__**${w}**__`; // add word to output
      if (w in puDict) {  // if the word is in the dictionary
        out += `\n*etymology:* ${puDict[w].etym}`; // add etymology
      } else if (w in exDict) {  // if the word is in the dictionary
        out += `\n*etymology:* ${exDict[w].etym}`; // add etymology
      } else {
        out += `\nThe word "${w}" was not found. :book::mag::shrug:`;
      }
    }
    msg.channel.send(out) // send data dump to channel
  } // end etymology

  // define each argument if toki pona word
  if (command === 'f' || command === 'find') {
    let out = "__**Dictionary search results**__\n"; // initialize output string
    let query = ""; // initialize query regex string
    let puFound = false;
    let exFound = false;
    let beFound = false;

    for(i=0; i<args.length; i++) query += args[i] + " "; // combine args into query
    query = query.slice(0,-1); // trim final space and create regex
    Object.keys(puDict).forEach(function(word) { // for each word in the pu dictionary
      for(def in puDict[word].defs) if(puDict[word].defs[def].includes(query)) {
        if(!puFound) {
          out += `The following is pu:`
          puFound = true;
        }
        out += `\n────────────────────────\n` + puPrint(word);  // add the word to the output
        break
      }
    });
    Object.keys(exDict).forEach(function(word) { // for each word in the pu dictionary
      for(def in exDict[word].defs) if(exDict[word].defs[def].includes(query)) {
        if(!exFound) {
          if(puFound) out += `\n════════════════════════\n`
          out += `The following is pre-pu or post-pu information:`
          exFound = true;
        }
        out += `\n────────────────────────\n` + dictPrint(word);  // add the word to the output
        break
      }
    });
    if(!puFound && !exFound) {
      beWords = Object.keys(beDict)
      for(w = 0; w < beWords.length; w++) { // for each word in the basic english dictionary
        word = beWords[w]
        if(word.includes(query)) {
          if(!beFound) {
            if(puFound || exFound) out += `\n════════════════════════\n`
            out += `The following is from the community phrasebook:`
            beFound = true;
          }
          out += `\n────────────────────────\n` + bePrint(word);  // add the word to the output
        }
      }
    }
    if(!puFound && !exFound && !beFound) out += `\nThe query "${query}" returned no results. :book::mag::shrug:`;

    if(out.length < 2000) msg.channel.send(out) // send data dump to channel
    else msg.channel.send(`Too many results! Please try being more specific.`);
  } // end find

  // give etymology of each argument if toki pona word
  if (command === 'l' || command === 'lang' || command === 'language') {
    let out = ""; // output string
    let l; // name of desired language, pulled from arguments
    let isLang = false; // is the language in the list?
    let isTooMany = false; // were there too many arguments?
    switch (args.length) {
      case 0:
      out += `Pick a language to list all toki pona word derivations.`;
      out += "\n────────────────────────";
      for (lang in langs) {
        langcaps = lang.replace(/\w\S*/g, function(txt){
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
        out += `\n**${langcaps}** - *`;
        for (alias in langs[lang].aliases) {
          out += langs[lang].aliases[alias] + ", ";
        }
        out = out.slice(0,-2) + "*";
      }
      msg.channel.send(out);
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
      l = args.shift().toLowerCase();
      l2 = l + " " + args.shift().toLowerCase();
      if (l2 in langs) {
        isLang = true;
        l = l2;
      }
      else {
        if (l in langs) {
          isLang = true;
        } else {
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
        if (isLang) {
          out += `\nOne language at a time, please. `
          out += `:stuck_out_tongue_winking_eye: :thumbsup:`;
          out += "\n──────────";
        }
        break;
      }
      if(args.length) {
        out += `\nOne language at a time, please. `
        out += `:stuck_out_tongue_winking_eye: :thumbsup:`;
        out += "\n──────────";
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
    if(args.length == 0) {  // if no args, list all pu words
      out = puWordList;
    } else for(i=0; i<args.length; i++) { // for each pu word
      w = args[i];
      if (i>0) out += "\n────────────────────────";
      out += "\n" + puPrint(w);
    }
    msg.channel.send(out) // send data dump to channel
  } // end pu

  // quiz user with random words
  if (command === 'q' || command === 'quiz') {
    let count;
    if(args.length == 0) {  // if no args, do it five times.
      count = 5
    } else {
      if(isNaN(args[0])) {
        msg.channel.send('ona li nanpa ala... o toki e nanpa anu ala.')
        return
      } else count = Math.floor(Number(args[0]));
    }
    if(count>25) {
      msg.channel.send('nanpa sina li suli mute kin! o toki e nanpa lili.')
      return
    }
    if(count<1) {
      msg.channel.send('nanpa sina li lili mute kin! o toki e nanpa suli.')
      return
    }

    filter = m => (m.author.bot == false)
    msg.channel.send(`Let's play a game! I'll say a toki pona word (pu only) and give a five-second countdown for you to guess the answer before I show the definition.\n\nReady?`)
    for(i=0; i<count; i++) {
      await sleep(2000);

      words = Object.keys(puDict)
      w = words[Math.floor(Math.random()*words.length)]
      answer = puPrint(w) + '\n────────────────────────' // buffer answer for searching and subsequent printing

      let collector = msg.channel.createMessageCollector(filter, {
        time: 6500,
        errors: ['time']
      })

      collector.on('collect', (m, collector) => {
        if(answer.includes(m.content.toLowerCase())) {
          m.react("👍").catch(err => console.log(err));
        }
      })

      out1 = `What does "${w}" mean?"\n\n`
      const m = await msg.channel.send(out1).then(async m => {
        for(j=5; j>=0; j--) {
          await sleep(1000)
          if(j != 0) m.edit(out1 + j)
          else m.edit(out1 + '────────────────────────')
        }
      });
      await sleep(100)
      msg.channel.send(answer)
    }

    await sleep(1000)
    msg.channel.send('sina kama sona la mi wile a! :heart:')
  } // end quiz


  // convert to sitelen pona
  if (command === 's' || command === 'sitelen') {
    if(args.length == 0) {
      msg.channel.send('o toki e nimi. mi ken sitelen pona.');
      return
    }

    // combine argument list with spaces to reconstruct sentence
    let sentence = "";
    for(let i=0; i<args.length; i++) { // for each word
      if(i>0) sentence += " " // add space between, if not first word
      sentence += args[i];    // add word
    }

    sitelen(msg, sentence);

  } // end sitelen

  // allow authorized users to verify translations
  if (command === 'v' || command === 'verify') {
    if(!(janLawa.includes(msg.author.id))) { // only allow authorized users
      msg.channel.send('sina ken ala lawa.')
      return
    }
    if(args.length == 0) {  // if no args, do it five times.
      count = 5
    } else {
      if(isNaN(args[0])) {
        if(msg.mentions.users.length != 0) {
          msg.mentions.users.forEach( (user) => {
            console.log(`${msg.author.tag} has verified ${user.tag}`)
            msg.channel.send(`tenpo ni la ${user.tag} li ken lawa.`)
            if(!janLawa.includes(user.id)) janLawa.push(user.id)
          })
          fs.writeFile("./janLawa.json", JSON.stringify(janLawa, null, 2), (err) => console.log(err));
          return
        } else {
          msg.channel.send('ona li nanpa ala... o toki e nanpa anu ala.')
          return
        }
      } else count = Math.floor(Number(args[0]));
    }
    if(count>25) {
      msg.channel.send('nanpa sina li suli mute kin! o toki e nanpa lili.')
      return
    }
    if(count<1) {
      msg.channel.send('nanpa sina li lili mute kin! o toki e nanpa suli.')
      return
    }
    console.log(msg.author.tag, 'verifying....')
    msg.channel.send(`pona, mi pana e sona kulupu tawa sina...`)
    verify(msg, count);
  } // end verify

} // end parseCmd

async function sitelen(msg, sentence) {
  // create temporary .png file and fix backslashes for feckin Winderps
  let fn = msg.id + ".png";
  let file = escape(tempy.file({name:fn}));
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

    // reply with attachment of image
    msg.channel.stopTyping();
    msg.channel.send(`${msg.author} li toki e ni:`, new Discord.Attachment(file));
  });
}

async function parseChange(oldMsg, newMsg) {
  // first split the arguments, remove prefix
  let args = newMsg.content.slice(pfx.length)
  .trim().replace(/\n/g, '\\n').split(/ +/g);
  // pop first argument (command) and leave the other arguments
  const command = args.shift().toLowerCase();

  // correct sitelen pona
  if (command === 's' || command === 'sitelen') {
    // combine argument list with spaces to reconstruct sentence
    let sentence = "";
    for(let i=0; i<args.length; i++) { // for each word
      if(i>0) sentence += " " // add space between, if not first word
      sentence += args[i];    // add word
    }

    if(args.length == 0) return null // if it's empty, do nothing.
    else { // if it's not empty, delete the old version and make a new one.
      oldMsg.channel.fetchMessages()
        .then(messages =>
          messages.filter(m => {
            m.attachments.filter(a => a.filename.includes(oldMsg.id.toString()))
          }).delete(5000)
        ).catch(console.error);

      await sleep(500);
      sitelen(newMsg, sentence);
    }
  } // end sitelen

} // end parseChange

function initWordList() {
  //  populate and sort the two word lists

  // === pu ===
  puWordList = "nimi pu:\n```\n";
  puRowList = new Array(41).fill(new Array());
  i = 0;
  for(w in puDict) {
    puRowList[i] = puRowList[i].concat(w);
    i = (i+1) % puRowList.length;
  }

  colCount = puRowList[0].length;
  puWordList += "╔"+("═════════╤").repeat(colCount-1)+"═════════╗\n";

  for(row in puRowList) {
    puWordList += "║ ";
    for(w in puRowList[row]) {
      if(w>0) puWordList += "│ ";
      puWordList += puRowList[row][w].padEnd(8,' ');
    }
    spacer = colCount-puRowList[row].length
    puWordList += "│ ".repeat(spacer) + " ".repeat(spacer*8) + "║\n";
  }

  colCount = puRowList[0].length;
  puWordList += "╚"+("═════════╧").repeat(colCount-1)+"═════════╝\n```\n";


  // === pu ala ===
  exWordList = "nimi pu ala:```\n";
  exRowList = new Array(6).fill(new Array());
  i = 0;
  for(w in exDict) {
    if(!(exDict[w].pu) && w != 'kijetesantakalu' ) {
      if(exDict[w].community) exRowList[i] = exRowList[i].concat(w + '*');
      else exRowList[i] = exRowList[i].concat(w);
      i = (i+1) % exRowList.length;
    }
  }

  colCount = exRowList[0].length;
  exWordList += "╔"+("═════════╤").repeat(colCount-1)+"═════════╗\n";

  for(row in exRowList) {
    exWordList += "║ ";
    for(w in exRowList[row]) {
      if(w>0) exWordList += "│ ";
      exWordList += exRowList[row][w].padEnd(8,' ');
    }
    spacer = colCount-exRowList[row].length
    exWordList += "│ ".repeat(spacer) + " ".repeat(spacer*8) + "║\n";
  }

  colCount = exRowList[0].length;
  exWordList += "╟─────────┴─────────┼─────────╢\n";
  exWordList += "║ kijetesantakalu   │         ║\n"
  exWordList += "╚═══════════════════╧═════════╝\n```";
  exWordList += " * = nimi sin pi jan Sonja ala"
}

function pangram() {
  letterList = ['a','e','i','j','k',
  'l','m','n','o','p',
  's','t','u','w'];
  puList = [];
  for(w in puDict) puList.push(w);
  puList.sort(function(a, b) {
    return a.length-b.length
  })
  panList = [];
  for(w in puList) {
    console.log('Testing the word ' + puList[w])
    if(letterList.length == 0) break;
    for(l in letterList) {
      if(puList[w].includes(letterList[l])) {
        console.log(puList[w] + ' is a match for ' + letterList[l]);
        panList.push(puList[w]);
        for(i=0;i<puList[w].length;i++) {
          letterList = letterList.filter(x => x!=puList[w][i]);
        }
        break
      }
    }
  }
  console.log(panList);
}

client.on('ready', () => {
  initWordList();
  //pangram();
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`------------------------`);
});

client.on('message', async msg => { // for every message, do the following:
  if(!msg.author.bot) { // ignore bots
    m = msg.content.toLowerCase()

    // listen for name to react if mentioned
    mentioned = false;
    if(m.match(/ilo wawa/g)) mentioned = true;
    else if(msg.mentions.users.get(client.user.id)) mentioned = true;
    if(mentioned) { // react
      msg.react("🔨").catch(err => console.log(err)).then(function() {
        if (m.match(/mi( mute li)? olin/g)) { // listen for olin
          msg.react("❤").catch(err => console.log(err));
          console.log(`mi olin e ${msg.author.tag}`)
        }
        if (m.match(/thank/g) || m.match(/pona/g)) { // listen for thank and pona
          msg.react("👍").catch(err => console.log(err));
          console.log(`mi pilin pona e ${msg.author.tag}`)
        }
        if (m.match(/sleep/g) || m.match(/w[ao]ke/g) || m.match(/lape/g)) { // listen for sleep, etc
          msg.react("👀").catch(err => console.log(err));
          console.log(`mi lape ala a!`)
          msg.channel.send(`mi lape ala a!`).catch(err => console.log(err));
        }
      });
    }

    if(msg.content.startsWith(pfx)) { // listen for command prefix
      parseCmd(msg);
    }

  }
}); // end message

client.on('messageUpdate', async (oldMsg, newMsg) => {
  if(!oldMsg.author.bot) { // ignore bots
    if(newMsg.content.startsWith(pfx)) { // listen for command prefix
      parseChange(oldMsg, newMsg);
    }
  }
}); // end messageUpdate

client.login(config.token).catch(err => console.log(err));
