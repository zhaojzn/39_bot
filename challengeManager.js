// challengeManager.js
const challenges = {};
let gameCounter = 0; // This keeps track of the number of games created

module.exports = {
    addChallenge: function (key, challengerId, challengedId) {
        const expirationTime = new Date().getTime() + (30 * 1000); // 30 seconds from now
        challenges[key] = {
            challenger: challengerId,
            challenged: challengedId,
            timestamp: expirationTime
        };
    },
    getChallenge: function (key) {
        return challenges[key];
    },
    removeChallenge: function (key) {
        delete challenges[key];
    },
    findChallengeByChallenged: function (guildId, challengedId) {
        return Object.entries(challenges).find(([key, value]) =>
            key.startsWith(guildId) && value.challenged === challengedId
        );
    },
    getNextGameNumber: function (guild) {
        // Increment the game counter and return it
        // Would need to adjust this to ensure unique numbers per guild
        return ++gameCounter;
      }
    // ... other challenge related functions
};