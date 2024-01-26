
const Discord = require("discord.js");
const { GatewayIntentBits } = require("discord.js")
const gameHandler = require("./gameHandler"); // Adjust the path as necessary
require("dotenv").config();

const client = new Discord.Client({
	intents: [
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages
	],
});

const fs = require("fs");
const prefix = "!";
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();


fs.readdir("./commands/", (err, files) => { // read commands from folder
	if (err) console.log(err);

	let jsFile = files.filter(f => f.split(".").pop() === "js");
	if (jsFile.length <= 0) {
		return console.log("no commands found");
	}

	jsFile.forEach((f) => {
		let props = require(`./commands/${f}`);
		console.log(`${f} loaded`);
		client.commands.set(props.help.name, props);

		props.help.aliases.forEach(alias => {
			client.aliases.set(alias, props.help.name);
		});
	});
});

client.on("ready", async () => {
	console.log(`${client.user.username} is online on ${client.guilds.cache.size} servers!`);
	client.user.setActivity(`39 Game`, { type: "PLAYING" })
});


client.on('messageCreate', async (message) => {
	if (message.content.startsWith(prefix)) { // starts with prefix
		// requesting command 
		/*
		let args = message.content.substr(prefix.length) // take everything except prefix
				.toLowerCase()
				.split(" "); // turn into array - ["say", "hello"]  */
		let args = message.content.slice(prefix.length).trim().split(/ +/g);
		let command;
		let cmd = args.shift().toLowerCase();
		if (client.commands.has(cmd)) {
			command = client.commands.get(cmd);
		} else if (client.aliases.has(cmd)) {
			command = client.commands.get(client.aliases.get(cmd));
		}

		try {
			command.run(client, message, args);
		} catch (e) {
			console.log(args)
			return;
		}

	}
})

client.on('messageCreate', async (message) => {
    // Skip irrelevant messages and not a single digit from 1 to 8
    if (message.author.bot || !/^[1-8]$/.test(message.content)) return;

    // Retrieve the ongoing game in this channel, if exists
    const game = gameHandler.ongoingGames.get(message.channelId);
    if (game) {
        const moveNumber = parseInt(message.content);
        // Call handlePlayerMove and capture the return values
        const { validMove, gameEnded } = await gameHandler.handlePlayerMove(client, message, moveNumber);

        // If the move is not valid, inform the user, unless the game has ended
        if (!validMove && !gameEnded) {
            if (gameHandler.isPlayerTurn(game, message.author.id)) {
                await message.reply("Invalid move. Please choose a number from 1 to 8 that hasn't been taken 4 times.");
            } else {
                await message.reply("It's not your turn!");
            }
        }
        
        // If the game has ended, stop processing further messages
        if (gameEnded) {
            console.log(`Game over in channel ${message.channelId}`);
            return;
        }
    }
});

client.login(process.env.CLIENT_TOKEN);