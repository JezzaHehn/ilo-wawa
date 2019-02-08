//////////////////////////////////
// - - - - - ilo wawa - - - - - //
// ilo wawa li "Discord Bot" pi //
// pana sitelen pi sitelen pona //
//////////////////////////////////

// configuration include file
const config = require("./config.json");
//    config.token - bot token
//    config.prefix - message prefix

// utility funtions
var fs = require('fs'); // for filesystem read/write

const Discord = require('discord.js');
const client = new Discord.Client();

// const { createCanvas, loadImage } = require('canvas')
// const canvasToImage = require('canvas-to-image')

// async function imagetest() {
//   console.log(`Attempting image test...`);
//
//   // create a blank canvas
//   const canvas = createCanvas(200, 100)
//   const ctx = canvas.getContext('2d')
//
//   // write "ni li sitelen"
//   ctx.font = '30px toki-pona'
//   ctx.fillText('ni li sitelen', 50, 100)
//
//   canvasToImage(ctx);
//
//   console.log(`Image test successful!!`);
// }

const dict = require('./lib/rawdict.json'); // dictionary of toki pona words

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`------------------------`);
  // imagetest();
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
      }


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
      }


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
      }


      if (command === 'sitelen') { // convert to sitelen pona
        // combine argument list with spaces to reconstruct sentence
        sentence = "";
        for(var i=0; i<args.length; i++) { // for each word
          sentence += args[i] + ' ';
        }
        // generate blank image based on argument list size
        // add sentence to image in sitelen pona
        const font = await Jimp.loadFont('linja pona 3 OTF.otf');
        const image = await Jimp.read(200, 100, 0xffffffff);

        image.print(font, 0, 0,
          {
            text: sentence,
            alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
          },
          200,  // max width
          100   // max height
        );
        image.write('./test.jpg');

        // reply with attachment of image
        msg.channel.send(
          `${msg.author} li toki:`,
          new Discord.Attachment('./test.jpg')  // (`./${msg.id}.jpg`)
        )
      }


    }
  }
});

client.login(config.token);
