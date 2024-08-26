var alivePlayers = [];

function initAlivePlayers() {
  alivePlayers = [];
}

function getAlivePlayers() {
  return alivePlayers;
}

function setAlivePlayers(alivePlayers) {
  this.alivePlayers = alivePlayers;
}

function sortAlivePlayers() {
  alivePlayers.sort((a, b) => (a.playerId > b.playerId ? 1 : -1));
}

module.exports = {
  initAlivePlayers,
  getAlivePlayers,
  sortAlivePlayers,
  setAlivePlayers,
};
