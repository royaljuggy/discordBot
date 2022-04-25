const Discord = require('discord.js');

const client = new Discord.Client();
const token = blank
const prefix = '%';

const fs = require('fs');

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

let loopState = false;

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// == music bot
const { Player } = require("discord-music-player");
const danbooru = require('./commands/danbooru');
const player = new Player(client, {
    leaveOnEmpty: false, // This options are optional.
});
// You can define the Player as *client.player* to easly access it.
client.player = player;

client.on("ready", () => {
    console.log("I am ready to Play with DMP 🎶");
});

// end music bot 

// == command handling
client.on('message', async (message) => {

    // delete bad messages with bad words
    badwords.forEach(word => {
        if (message.content.toLowerCase().includes(word)) {
            const options = {
                timeout: 60000,
                reason: "Bad word"
            }
            message.delete(options).catch(error => console.log(error));
            return;
        }
    })

    // messages without prefixes or bot is caller
    if (!message.content.startsWith(prefix) || message.author.bot) {
        return;
    }


    // const args = message.content.slice(prefix.length).split(/ + /);
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    const getCommand = client.commands.get(command);
    if (getCommand) {
        client.commands.get(command).execute(message, args);
    }
    // music commands separated 
    // TODO? music commands can be integrated into command handler IF we can access the client somehow
    if (command === 'play') {
        console.log(args[0]);
        if (client.player.isPlaying(message)) {
            try {
                //let song = await client.player.addToQueue(message, args.join(' ')).catch(error => console.log);
                let song = await client.player.play(message, args.join(' ')).catch(error => console.log(error));
                // If there were no errors the Player#songAdd event will fire and the song will not be null.
                if (song) {
                    console.log(`Started playing ${song.name}`);
                    message.channel.send(`Queued **${song.name}**`);
                } else {
                    message.channel.send("No song found");
                }
            } catch (e) {
                message.channel.send(`An error occured. (Likely not in a voice channel?)`)
                throw new Error(400);
            }
            return;
        } else {
            try {
                //let song = await client.player.play(message, args.join(' '));
                let song = await client.player.play(message, args.join(' ')).catch(error => console.log(error));

                // If there were no errors the Player#songAdd event will fire and the song will not be null.
                if (song) {
                    console.log(`Started playing ${song.name}`);
                    message.channel.send(`Started playing **${song.name}**`);
                } else {
                    message.channel.send("No song found");
                }
            } catch (e) {
                message.channel.send(`An error occured. (Likely not in a voice channel?)`)
                throw new Error(400);
            }
            return;
        }
    }
    if (command === 'np') {
        let song = await client.player.nowPlaying(message);
        if (song) {
            message.channel.send(`Current song: **${song.name}**`);
        } else {
            message.channel.send("Nothing is playing. Play something now!");
        }
        return
    }
    if (command === 'clear') {
        let isDone = client.player.clearQueue(message);
        if (isDone)
            message.channel.send('Queue was cleared!');
    }
    if (command === 'timestamp' || command === 'ts') {
        // If provided 10 seconds, it would send the Milliseconds stamp (10 * 1000)
        let song = await client.player.seek(message, parseInt(message.args[0] * 1000)).catch(err => {
            return message.channel.send(error.message);
        });

        message.channel.send(`Seeked to ${message.args[0]} second of ${song.name}.`);
    }
    if (command === 'queue') {
        try {
            let queue = client.player.getQueue(message);
            if (queue) {
                message.channel.send('Queue:\n' + (queue.songs.map((song, i) => {
                    return `${i === 0 ? 'Now Playing' : `#${i + 1}`} - **${song.name}** | ${song.author}`
                }).join('\n')));
            } else {
                return "Queue is empty!";
            }
        } catch (e) {
            return `An error occurred: ${e.message}`;
        }
        return "This line shouldn't have been reached...";
    }
    if (command === 'skip') {
        let song = client.player.skip(message);
        if (song) {
            message.channel.send(`**${song.name}** was skipped!`);
        } else {
            message.channel.send("No song to skip!");
        }
    }
    if (command === 'remove') {
        let SongID = parseInt(args[0]) - 1; // The index is starting from 0, so we subtract 1.

        // Removes a song from the queue
        let song = client.player.remove(message, SongID);
        if (song)
            message.channel.send(`Removed song ${song.name} (${args[0]}) from the Queue!`);
    }
    if (command === 'pause') {
        let song = client.player.pause(message);
        if (song)
            message.channel.send(`${song.name} was paused!`);
    }
    if (command === 'stop') {
        let isDone = client.player.stop(message);
        if (isDone) {
            message.channel.send('Music stopped, the Queue was cleared!');
        } else {
            message.channel.send('Nothing to stop!');
        }

    }
    if (command === 'shuffle') {
        let songs = client.player.shuffle(message);
        if (songs) {
            message.channel.send('Server Queue was shuffled.');
        } else {
            message.channel.send("Nothing to shuffle.");
        }
    }
    if (command === 'loop-current') {
        let toggle = client.player.toggleLoop(message);

        if (toggle === null)
            return;
        // Send a message with the toggle information
        else if (toggle)
            message.channel.send('I will now repeat the current playing song.');
        else message.channel.send('I will not longer repeat the current playing song.');

    }
    if (command === 'loop') {
        // Enable repeat mode
        let status; 
        if (!loopState) {
            status = client.player.setQueueRepeatMode(message, true);
            message.channel.send(`Queue will be repeated indefinitely!`);
        } else {
            status = client.player.setQueueRepeatMode(message, false);
            message.channel.send(`Queue will no be longer repeated indefinitely!`);
        }
        if (status === null) { 
            message.channel.send(`There was an issue with the looping (tell Jacob lol)`);
            return; 
        }
        loopState = !loopState;
    }
    if (command === 'volume') {
        let isDone = client.player.setVolume(message, parseInt(args[0]));
        if (isDone)
            message.channel.send(`Volume set to ${args[0]}%!`);
    }
    if (command === 'progress') {
        let progressBar = client.player.createProgressBar(message, {
            size: 15,
            block: '=',
            arrow: '>'
        });
        if (progressBar)
            message.channel.send(progressBar);
        // Example: [==>                  ][00:25/04:07]
    }
});

// must be last line
client.login(token);

// node . (starts bot) OR node main.js
client.once('ready', () => {
    console.log("Nino is online!");
    console.log("Music bot commands copy and pasted straight from: https://www.npmjs.com/package/discord-music-player#play");
    client.user.setPresence({
        status: 'online',
        activity: {
            name: "with your heart",
            type: "PLAYING"
        }
    })
});




// bad words

const badword1 = "nigger";
const badword2 = "nigga";

const badwords = ["nigger", "nigga"];
