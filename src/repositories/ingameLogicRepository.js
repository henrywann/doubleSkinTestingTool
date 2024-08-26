let inGameLogicVariables = {
  killerCount: 0,
  policeCount: 0,
  doctorCount: 0,
  gunSmithCount: 0,
  silencerCount: 0,
  bioChemistCount: 0,
  round: 0,
  poisonReleasedRound: 0,
  noKillerPresent: false,
  roundAction: [],
  isGunSmithFired: false,
  isPoisonCompleted: false,
  revengeChosen: -1,
  revengeCard: -1,
  voteblePlayers: [],
  gunablePlayers: [],
};

function resetInGameLogicVariables() {
  this.killerCount = 0;
  this.policeCount = 0;
  this.doctorCount = 0;
  this.gunSmithCount = 0;
  this.silencerCount = 0;
  this.bioChemistCount = 0;
  this.round = 0;
  this.poisonReleasedRound = 0;
  this.noKillerPresent = false;
  this.roundAction = [];
  this.isGunSmithFired = false;
  this.isPoisonCompleted = false;
  this.revengeChosen = -1;
  this.revengeCard = -1;
  this.voteblePlayers = [];
  this.gunablePlayers = [];
}

module.exports = { inGameLogicVariables, resetInGameLogicVariables };
