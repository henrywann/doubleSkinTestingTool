let alivePlayers = [];

function initAlivePlayers() {
  alivePlayers = [];
}

function getAlivePlayers() {
    return alivePlayers;
}

function filteringOutDeadPlayers() {
    var filtered = getAlivePlayers().filter(function (value) {
        return value.card2 !== "";
    });
    alivePlayers = filtered; // Update the variable directly
}

function sortAlivePlayers() {
  alivePlayers.sort((a, b) => (a.playerId > b.playerId ? 1 : -1));
}

module.exports = {
  initAlivePlayers,
  getAlivePlayers,
  sortAlivePlayers,
  filteringOutDeadPlayers,
};
