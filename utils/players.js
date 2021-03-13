var players = [];

var cards = ['killer', 'killer', 'police', 'police', 'doctor', 'gunSmith', 'silencer', 
'villager', 'villager', 'villager', 'villager', 'villager'];

// var cards = ['killer', 'villager', 'villager', 'police', 'villager', 'gunSmith', 'silencer', 
// 'villager', 'killer', 'villager', 'police', 'villager'];

var existingPlayers = [];
var roundAction = [];

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

  const player = {id, username, card1, card2, side, poison, playerId};

  players.push(player);
  return player;
}

function playerReady(id, currentPlayer) {
  existingPlayers.push(currentPlayer);
  return existingPlayers;
}

function killPlayer(playerId, round) {
  console.log('entering kill player');
  if (roundAction[round-1]==undefined) {
    const killed = playerId;
    const checked = -1;
    const gunned = -1;
    const injected = -1;
    roundAction.push({killed, checked, gunned, injected});
  } else {
    var thisRound = roundAction[round-1];
    thisRound.killed = playerId;
    roundAction[round-1] = thisRound;
  }
}

function checkPlayer(playerId, round) {
  if (roundAction[round-1]==undefined) {
    const killed = -1;
    const checked = playerId;
    const gunned = -1;
    const injected = -1;
    roundAction.push({killed, checked, gunned, injected});
  } else {
    var thisRound = roundAction[round-1];
    thisRound.checked = playerId;
    roundAction[round-1] = thisRound;
  }
}

function injectPlayer(playerId, round) {
  if (roundAction[round-1]==undefined) {
    const killed = -1;
    const checked = -1;
    const gunned = -1;
    const injected = playerId;
    roundAction.push({killed, checked, gunned, injected});
  } else {
    var thisRound = roundAction[round-1];
    thisRound.injected = playerId;
    roundAction[round-1] = thisRound;
  }
}


module.exports = {
  playerJoin,
  playerReady,
  killPlayer,
  checkPlayer,
  injectPlayer
};