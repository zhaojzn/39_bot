const { EmbedBuilder } = require('discord.js');
// gameHandler.js
const ongoingGames = new Map();

const isPlayerTurn = (game, playerId) => {
    return game.currentPlayer === playerId;
};


const createNewGame = (channelId, player1Id, player2Id) => {
    const gameState = {
        channelId: channelId,
        player1: player1Id,
        player2: player2Id,
        currentPlayer: player1Id, // Challenger starts
        score: 0, // Starting score
        moves: [], // List to store the sequence of moves made
        availableNumbers: { // Each number can be selected up to 4 times
            '1': 4, '2': 4, '3': 4, '4': 4,
            '5': 4, '6': 4, '7': 4, '8': 4
        },
    };

    // Save the game state
    ongoingGames.set(channelId, gameState);
};


const isValidMove = (game, number) => {
    // Check if the move is valid: within range and available
    return number >= 1 && number <= 8 && game.availableNumbers[number] > 0;
};

const handlePlayerMove = async (client, message, number) => {
    const game = ongoingGames.get(message.channelId);

    if (!game) return { validMove: false, gameEnded: false };

    if (isPlayerTurn(game, message.author.id) && isValidMove(game, number)) {
        // Perform the move
        game.availableNumbers[number]--; // Mark the number as used once more
        game.score += number; // Add to the total score
        game.moves.push({ player: message.author.id, number: number }); // Store the move
        game.currentPlayer = game.currentPlayer === game.player1 ? game.player2 : game.player1; // Switch turns

        await updateGameMessage(client, message, game);
        const gameEnded = await checkGameOver(client, game, message.channelId);
        // Return the status of the move and the game
        return { validMove: true, gameEnded };

    }
    return { validMove: false, gameEnded: false };
};
/*
    moves: {
        'player1': [1, 2, 3, 4, 5, 6, 7, 8],
        'player2': [1, 2, 3, 4, 5, 6, 7, 8]
    }

*/

const updateGameMessage = async (client, message, game) => {
    // Determine the next player's mention string
    const nextPlayerMention = `<@${game.currentPlayer}>`;

    // Create a string listing available numbers and their remaining counts
    let availableNumbersMessage = Object.entries(game.availableNumbers)
        .map(([number, count]) => count > 0 ? `${number} (${count} left)` : null)
        .filter(Boolean)
        .join(', ');

    // Construct the embed with the game status
    const gameStatusEmbed = new EmbedBuilder()
        .setColor('#00DDDD')
        .setTitle('39 Points Game')
        .setDescription(`It's now ${nextPlayerMention}'s turn.\n\n**Total Points:** ${game.score}`)
        .addFields({ name: 'Available Numbers', value: availableNumbersMessage })
        .setFooter({ text: 'Type a number (1-8) to make your move.' });

    // Find the last game status message or send a new one if it doesn't exist
    let previousGameMessage = await message.channel.messages.fetch({ limit: 100 })
                                   .then(msgs => msgs.filter(m => m.author.bot && m.embeds.length > 0).first());
    if (previousGameMessage) {
        await previousGameMessage.edit({ embeds: [gameStatusEmbed] });
    } else {
        await message.channel.send({ embeds: [gameStatusEmbed] });
    }
};

const announceWinner = async (client, channel, winnerId, game) => {
    // Announce the winner with an embed
    const gameOverEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Game Over!')
        .setDescription(`<@${winnerId}> has won the game with a total of ${game.score} points! 🎉`)
        .setTimestamp();

    // Send the game-over embed
    await channel.send({ embeds: [gameOverEmbed] });
    
    const deleteWarningMessage = await channel.send('This channel will be auto-deleted in 15 seconds.');
    const dataChannel = client.channels.cache.get('1200201581270937621'); // Replace with the actual #39-data channel id
    
    // create a list of moves
    let moves = game.moves.map(move => `<@${move.player}>: ${move.number}`).join('\n');
    
    // Send game data to #39-data channel
    dataChannel.send(`Game finished in <#${channel.id}>\nMoves:\n${moves}`);

    // Set a timeout to delete the channel
    setTimeout(async () => {
        try {
            // Delete the warning message first
            await deleteWarningMessage.delete();
            // Then delete the channel
            await channel.delete();
        } catch (error) {
            console.log('Something went wrong when deleting the game channel:', error);
            // If needed, you can inform users the channel could not be deleted
        }
    }, 15000); // 30-second delay
};
const checkGameOver = async (client, game, channelId) => {
    const channel = await client.channels.fetch(channelId);
    if (!channel) return;

    // Check for a win condition
    if (game.score >= 39) {
        const winnerId = game.moves[game.moves.length - 1].player;
        await announceWinner(client, channel, winnerId, game);
        //send moves to #39-data
        ongoingGames.delete(channelId); // Clean up the game state
        return true;
    }
    return false;
};
module.exports = { createNewGame, handlePlayerMove, updateGameMessage, checkGameOver, ongoingGames, isPlayerTurn   };
