const { PermissionsBitField, ChannelType, EmbedBuilder } = require('discord.js');
const challengeManager = require('../challengeManager');
const gameHandler = require('../gameHandler'); 

module.exports.run = async (client, message, args) => {
    const guild = message.guild;
    if (message.channel.name !== "create-39-game") {
        return message.reply("Challenges can only be accepted in the 'create-39-game' channel.");
    }


    const authorId = message.author.id;
    const guildId = guild.id;

    const category = message.channel.parent; // Get the category of the 'create-39-game' channel
    if (!category) {
        return message.reply("The 'create-39-game' channel is not under any category.");
    }

    const [challengeKey, challenge] = challengeManager.findChallengeByChallenged(guildId, authorId) || [];

    if (!challenge) {
        return message.reply("You don't have any active challenges to accept.");
    }

    if (challenge.timestamp < new Date().getTime()) {
        challengeManager.removeChallenge(challengeKey);
        return message.reply("The challenge has expired.");
    }

    const gameNumber = challengeManager.getNextGameNumber(guild);

    // Create a new channel for the game
    guild.channels.create({
        name: `game-${gameNumber}`,
        type: ChannelType.GuildText, // Use the proper enum for a guild text channel
        parent: category.id, // Set the category
        permissionOverwrites: [
            {
                id: guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel], // Deny everyone from viewing by default
            },
            {
                id: challenge.challenger,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory], // Allow the challenger
            },
            {
                id: challenge.challenged,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory], // Allow the challenged
            },
            {
                id: client.user.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory], // Allow the bot
            },
        ],
        // permissionOverwrites: [
        //     {
        //         id: guild.id,
        //         allow: [PermissionsBitField.Flags.ViewChannel], // Everyone can see the channel
        //         deny: [PermissionsBitField.Flags.SendMessages], // But can't send messages
        //     },
        //     {
        //         id: challenge.challenger,
        //         allow: [
        //             PermissionsBitField.Flags.ViewChannel,
        //             PermissionsBitField.Flags.SendMessages, 
        //             PermissionsBitField.Flags.ReadMessageHistory
        //         ], // Challenger can type and read
        //     },
        //     {
        //         id: challenge.challenged,
        //         allow: [
        //             PermissionsBitField.Flags.ViewChannel,
        //             PermissionsBitField.Flags.SendMessages, 
        //             PermissionsBitField.Flags.ReadMessageHistory
        //         ], // Challenged can type and read
        //     },
        //     {
        //         id: client.user.id,
        //         allow: [
        //             PermissionsBitField.Flags.ViewChannel, 
        //             PermissionsBitField.Flags.SendMessages, 
        //             PermissionsBitField.Flags.ReadMessageHistory,
        //             PermissionsBitField.Flags.ManageMessages, 
        //             PermissionsBitField.Flags.ManageChannels
        //         ], // Bot can manage the channel and messages
        //     },
        //     // Optionally, add any roles that should also have speaking permissions
        // ],
    }).then(channel => {
        // Send a welcome message in the new game channel
        message.channel.send(`The game has been created at ${channel}.`);
        gameHandler.createNewGame(channel.id, challenge.challenger, authorId);
        const gameInstructionsEmbed = new EmbedBuilder()
            .setColor('#0099ff') // Set the color of the embed bar
            .setTitle('39 Points Game Instructions') // Set the title of the embed
            .setDescription('Welcome to the 39 Points game! Here are the rules:') // Provide a description
            .addFields(
                { name: 'Objective', value: 'Be the first to reach exactly 39 points to win.' },
                { name: 'Gameplay', value: 'Players take turns picking a number from 1 to 8.' },
                { name: 'Constraints', value: 'Each number can only be used 4 times.' },
                { name: 'Starting', value: 'Player 1 (the challenger) starts the game.' },
                // ... other fields with more instructions or rules as required
            )
            .setFooter({ text: 'Game created. Good luck to both players!' }); // Set footer text

        // Send a message to ping the players followed by the embed
        channel.send({
            content: `${message.author} and <@${challenge.challenger}>, let the game begin!`,
            embeds: [gameInstructionsEmbed]
        });
        challengeManager.removeChallenge(challengeKey);
    }).catch(console.error);
};

module.exports.help = {
    name: "accept",
    aliases: []
};