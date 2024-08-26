let votingLogicVariables = {
  playersThatVoted: 0,
  voteblePlayers: [],
  whoVotedWho: [],
  playersWithMostVotes: [],
  isFirstRoundVoting: true,
  gunnedPlayerDuringVoting: -1,
};

function resetVotingLogicVariables() {
  this.playersThatVoted = 0;
  this.voteblePlayers = [];
  this.whoVotedWho = [];
  this.playersWithMostVotes = [];
  this.isFirstRoundVoting = true;
  this.gunnedPlayerDuringVoting = -1;
}

module.exports = { votingLogicVariables, resetVotingLogicVariables };
