# ilo wawa

ilo wawa li ilo pana sona pi toki pona li sitelen e sitelen pona.

This Discord bot was created to be a learning tool for the Toki Pona language. The bot's name, ilo wawa, means "strong tool". ilo wawa can give information about toki pona words and etymologies, search for dictionary definitions, and convert written toki pona to a sitelen pona image.

## Getting Started

### Prerequisites

To install ilo wawa's prerequisite Node.js packages, you will need
* npm

To run ilo wawa on your local machine, you will need:
* nodemon
* the GIMP (for sitelen command)

You will also need to visit the [Discord developer portal](https://discordapp.com/developers/) to set up a bot account and get a token.

### Installing the Bot

* After installing prerequisites above, download ilo wawa's source code and use `npm i` in the install directory.
* Visit the [Discord dev portal](https://discordapp.com/developers/) to set up an app and a bot account, and copy the client token into `config.json`. Also take note your app's client ID for the next step.
* Invite the bot to your Discord server by changing `CLIENT_ID_HERE` to your client ID in this link:
`https://discordapp.com/oauth2/authorize?client_id=CLIENT_ID_HERE&scope=bot&permissions=0`
* Move the `linja-pona-4.0.otf` font from `etc` to your machine's font folder.
* Move the `sitelen.scm` script from `etc` to the GIMP's scripts folder, and copy that folder's path into `config.json`.
* Run the bot by using `nodemon index.js` in a terminal in the install directory.

## Donate

If you've learned something from ilo wawa in a server...
or if you have ever benefitted from this bot's code...
[please consider donating to help keep ilo wawa alive!](https://paypal.me/jezzahehn) ❤

## Authors

* **jan Tesa (Jezza Hehn)** - [Anthrakia](https://github.com/Anthrakia) ([personal website](https://jezza.net))
* **jan Kai** - *development assistance and troubleshooting*
* **jan Akuton** - *compiled dictionary and helped with language support*
* **jan Jeko** - *pu/nonpu booleans in dictionary*

See also the list of [contributors](https://github.com/Anthrakia/ilo-wawa/graphs/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Special thanks goes to jan Sonja, original creator of the Toki Pona language.
* Thanks also to all the members of [ma pona pi toki pona](https://discord.gg/DyERVCe) for continuing to support this project!
