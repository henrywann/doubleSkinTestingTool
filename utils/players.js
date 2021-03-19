const e = require("express");

// players[] keeps track of how many players joined the game. alivePlayers is how many players are ready
var players = [];

var cards = ['killer', 'killer', 'police', 'police', 'doctor', 'gunSmith', 'silencer', 
'villager', 'villager', 'villager', 'villager', 'villager'];

// var cards = ['killer', 'villager', 'villager', 'police', 'villager', 'gunSmith', 'silencer', 
// 'villager', 'killer', 'villager', 'police', 'villager'];

var alivePlayers = [];
var roundAction = [];

function getAlivePlayers() {
  return alivePlayers;
}
// Join player to game and show cards
function playerJoin(id, username) {
  if (players.length < 6) {
    return assignPlayer(id, username);
  } else {
    console.log('more than 6 players joined')
    players = [];
    cards = ['killer', 'killer', 'police', 'police', 'doctor', 'gunSmith', 'silencer', 
    'villager', 'villager', 'villager', 'villager', 'villager'];
    return assignPlayer(id, username);
  }
}

function getPlayerSide(card1, card2) {
  let map = new Map();
  map.set('killer', -3);
  map.set('police', 3);
  map.set('silencer', -2);
  map.set('doctor', 1);
  map.set('gunSmith', 1);
  map.set('villager', 0);
  return map.get(card1) + map.get(card2);
}

function assignPlayer(id, username) {
  // get first card
  const i = Math.floor(Math.random() * (cards.length-1));
  // const i =0;
  const card1 = cards[i];
  cards.splice(i, 1);
  // get second card
  const j = Math.floor(Math.random() * (cards.length-1));
  // const j =0;
  const card2 = cards[j];
  cards.splice(j, 1);

  const side = getPlayerSide(card1, card2);
  const poison = 0;
  const playerId = players.length;
  const numOfVotes = 0;
  const voting = 0;

  const player = {id, username, card1, card2, side, poison, playerId, numOfVotes, voting};

  players.push(player);
  return player;
}

function playerReady(id, currentPlayer) {
  alivePlayers.push(currentPlayer);
}

function playerAction(playerId, action, round) {
  if (roundAction[round-1]==undefined) {
    var thisRound = {"killed": -1, "checked": -1, "gunned": -1, "injected": -1};
    roundAction.push(getThisRoundAction(thisRound, action, playerId));
  } else {
    var thisRound = roundAction[round-1];
    roundAction[round-1] = getThisRoundAction(thisRound, action, playerId);
  }
}

function getThisRoundAction(thisRound, action, playerId) {
  if (action==='kill') {
    thisRound.killed = playerId;
  } else if (action==='check') {
    thisRound.checked = playerId;
  } else if (action==='gun') {
    thisRound.gunned = playerId;
  } else if (action==='inject') {
    thisRound.injected = playerId;
  }
  return thisRound;
}

function noPlayerAction(action, round) {
  if (roundAction[round-1]==undefined) {
    var thisRound = {"killed": -1, "checked": -1, "gunned": -1, "injected": -1};
    roundAction.push(getThisRoundNoAction(thisRound, action));
  } else {
    var thisRound = roundAction[round-1];
    roundAction[round-1] = getThisRoundNoAction(thisRound, action);
  }
}

function getThisRoundNoAction(thisRound, action) {
  if (action==='kill') {
    thisRound.killed = 0;
  } else if (action==='check') {
    thisRound.checked = 0;
  } else if (action==='gun') {
    thisRound.gunned = 0;
  } else if (action==='inject') {
    thisRound.injected = 0;
  }
  return thisRound;
}

function isRoundOver(round) {
  const currentRound = roundAction[round-1];
  if (currentRound===undefined) { // all gods are present
    return false;
  }
  if (currentRound.killed!==-1 && currentRound.checked!==-1 && currentRound.injected!==-1 && currentRound.gunned!==-1) {
    console.log(`killed: ${currentRound.killed}, checked: ${currentRound.checked}, 
    gunned: ${currentRound.gunned}, injected: ${currentRound.injected}`);
    return true;
  } else {
    return false;
  }
}

function calculateRoundResult(round) {
  const currentRound = roundAction[round-1];
  var deadPlayers = [];
  // killed and cured is not the same player, killed player is dead
  if (currentRound.killed!==0 && currentRound.killed!==currentRound.injected) {
    console.log('killed and cured is not the same player');
    populateDeadPlayers(currentRound.killed, deadPlayers);
  }
  // gun smith fired, gunned player is dead
  if (currentRound.gunned!==0) {
    console.log('gun smith fired');
    populateDeadPlayers(currentRound.gunned, deadPlayers);
  }
  // cured player is not killed, poison increased by 1
  if (currentRound.injected!==0 && currentRound.injected!==currentRound.killed) {
    console.log('cured player is not killed');
    alivePlayers.forEach(e => {
      if (e.playerId===currentRound.injected) {
        e.poison++;
        if (e.poison===2) {
          populateDeadPlayers(currentRound.injected, deadPlayers);
        }
      }
    });
  }
  updateExistingPlayers();
  // TODO: remove totally dead players
  return deadPlayers.sort();
}

function updateExistingPlayers() {
  var filtered = alivePlayers.filter(function(value, index, arr){ 
    return value.card2!=='';
  });
  alivePlayers = filtered;
}

function populateDeadPlayers(dead, deadPlayers) {
  alivePlayers.forEach(e => {
    if (e.playerId===dead) {
      if (e.card1!=='') {
        e.card1 = '';
        e.poison = 0;
      } else if (e.card2!=='') {
        e.card2 = '';
      }
    }
  });
  deadPlayers.push(dead);
}

module.exports = {
  playerJoin,
  playerReady,
  playerAction,
  noPlayerAction,
  isRoundOver,
  calculateRoundResult,
  getAlivePlayers,
  populateDeadPlayers,
  updateExistingPlayers
};