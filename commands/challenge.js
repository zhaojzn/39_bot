const Discord = require("discord.js");
const challengeManager = require('../challengeManager');  // Make sure the path to challengeManager is correct

module.exports.run = async (client, message, args) => {
    // Check if the command is issued in the "create-39-game" channel.
    if (message.channel.name !== "create-39-game") {
        return message.reply("Challenges can only be created in the 'create-39-game' channel.");
    }

    // Ensure a user is mentioned
    if (message.mentions.users.size === 0) {
        return message.reply("please mention a user to challenge.");
    }

    const challengedUser = message.mentions.users.first();

    // Users cannot challenge the bot or themselves
    if (challengedUser.id === client.user.id || challengedUser.id === message.author.id) {
        return message.reply("you cannot challenge this user.");
    }

    const guildId = message.guild.id;
    const challengerId = message.author.id;
    const challengedId = challengedUser.id;

    // Check if the challenger or challenged is already part of an active challenge
    const existingChallengerKey = Object.keys(challengeManager).find(key =>
        key.startsWith(guildId + "-") && challengeManager.getChallenge(key).challenger === challengerId
    );

    const existingChallengedKey = Object.keys(challengeManager).find(key =>
        key.startsWith(guildId + "-") && challengeManager.getChallenge(key).challenged === challengedId
    );

    if (existingChallengerKey || existingChallengedKey) {
        return message.reply("One of the users is already involved in an active challenge.");
    }

    // If checks pass, proceed to create a new challenge
    const challengeKey = `${guildId}-${challengerId}-${challengedId}`;
    challengeManager.addChallenge(challengeKey, challengerId, challengedId);

    // Notify the challenge
    message.channel.send(`${challengedUser}, you have been challenged to a game of 39 Points by ${message.author}. 
    Type \`!accept\` to start the game! You have 30 seconds to accept.`);

    // Set a timeout to automatically remove the challenge after 30 seconds if not accepted
    setTimeout(() => {
        if (challengeManager.getChallenge(challengeKey) && 
            challengeManager.getChallenge(challengeKey).timestamp <= new Date().getTime()) {
            challengeManager.removeChallenge(challengeKey);
            message.channel.send(`${message.author}, your challenge to ${challengedUser} has expired.`);
        }
    }, 30 * 1000);
};

module.exports.help = {
    name: "challenge",
    aliases: ["c", "ch"]
};