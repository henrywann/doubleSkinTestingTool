const e = require("express");
// players[] keeps track of how many players joined the game. alivePlayers is how many players are ready
var players = [];
var cards = [];
var cardsChinese = [];
var alivePlayers = [];
var roundAction = [];

function getAlivePlayers() {
  return alivePlayers;
}

function sortAlivePlayers() {
  alivePlayers.sort((a, b) => (a.playerId > b.playerId) ? 1 : -1);
}

// Join player to game and show cards
function playerJoin(id, username, isNewGame, playerLength) {
  if (isNewGame) {
    if (playerLength==='7') {
      cards = ['killer', 'revenger', 'police', 'police', 'doctor', 'gunSmith', 'silencer', 'villager',
      'villager', 'villager', 'villager', 'villager', 'villager', 'villager'];
      cardsChinese = ['杀手','复仇者','警察','警察','医生','Gun Smith','禁言','平民','平民','平民','平民',
      '平民','平民','平民'];
    } else {
      cards = ['killer', 'killer', 'police', 'police', 'doctor', 'gunSmith', 'villager', 'villager', 
      'villager', 'villager', 'villager', 'villager'];
      cardsChinese = ['杀手','杀手','警察','警察','医生','Gun Smith','平民','平民','平民','平民','平民','平民'];
    }
    
    alivePlayers = [];
    roundAction = [];
    players = [];
  }
  if (players.length >= playerLength) {
    console.log(`more than ${playerLength} players joined`);
    return null;
  }
  return assignPlayer(id, username);
}

function getPlayerSide(card1, card2) {
  let map = new Map();
  map.set('killer', -4);
  map.set('revenger', -4);
  map.set('police', 3);
  map.set('silencer', -2);
  map.set('doctor', 1);
  map.set('gunSmith', 2);
  map.set('villager', 0);
  return map.get(card1) + map.get(card2);
}

function assignPlayer(id, username) {
  // get first card
  const i = Math.floor(Math.random() * (cards.length-1));
  // const i =0;
  const card1 = cards[i];
  const card1Chinese = cardsChinese[i];
  cards.splice(i, 1);
  cardsChinese.splice(i, 1);
  // get second card
  const j = Math.floor(Math.random() * (cards.length-1));
  // const j =0;
  const card2 = cards[j];
  const card2Chinese = cardsChinese[j];
  cards.splice(j, 1);
  cardsChinese.splice(j, 1);

  const side = getPlayerSide(card1, card2);
  const poison = 0;
  const playerId = players.length;
  const numOfVotes = 0;
  const voting = 0;
  const isPureVillager = (card1==='villager' && card2==='villager');
  const isReady = false;

  const player = {id, username, card1, card2, card1Chinese, card2Chinese,side, poison, playerId, numOfVotes, voting, 
    isPureVillager, isReady};

  players.push(player);
  return player;
}

function playerReady(id, currentPlayer) {
  currentPlayer.isReady = true;
  alivePlayers.push(currentPlayer);
}

function playerAction(playerId, action, round) {
  console.log(`round: ${round}`);
  if (roundAction[round-1]==undefined) {
    roundAction.push(getThisRoundAction(getThisRound(round), action, playerId));
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
  } else if (action==='silence') {
    thisRound.silenced = playerId;
  } else if (action==='revenge') {
    thisRound.revenged = playerId;
  }
  return thisRound;
}

function noPlayerAction(action, round) {
  if (roundAction[round-1]==undefined) {
    roundAction.push(getThisRoundNoAction(getThisRound(round), action));
  } else {
    var thisRound = roundAction[round-1];
    roundAction[round-1] = getThisRoundNoAction(thisRound, action);
  }
}

function getThisRound(round) {
  var thisRound = [];
    if (round===1 && cards.length===14) {
      thisRound = {"killed": -1, "checked": -1, "gunned": -1, "injected": -1, "silenced": -1, "revenged": -1};
    } else {
      thisRound = {"killed": -1, "checked": -1, "gunned": -1, "injected": -1, "silenced": -1};
    }
    return thisRound;
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
  } else if (action==='silence') {
    thisRound.silenced = 0;
  }
  return thisRound;
}

function isRoundOver(round) {
  const currentRound = roundAction[round-1];
  if (currentRound===undefined) { // all gods are present
    return false;
  }
  if (currentRound.killed!==-1 && currentRound.checked!==-1 && currentRound.injected!==-1 
      && currentRound.gunned!==-1 && currentRound.silenced!==-1) {
      console.log(`killed: ${currentRound.killed}, checked: ${currentRound.checked}, 
        gunned: ${currentRound.gunned}, injected: ${currentRound.injected}, silenced: ${currentRound.silenced}`);
      if (round===1) {
        console.log(`revenged: ${currentRound.revenged}`);
          return currentRound.revenged!==-1;
      } else {
        return true;
      }
  } else {
    return false;
  }
}

function calculateRoundResult(round, io) {
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
      if ((e.playerId+1).toString()===currentRound.injected) {
        e.poison++;
        if (e.poison===2) {
          populateDeadPlayers(currentRound.injected, deadPlayers);
        }
      }
    });
  }
  // updateExistingPlayers();
  return deadPlayers.sort();
}

function getSilencedPlayer(round) {
  return roundAction[round-1].silenced.toString();
}

function updateExistingPlayers() {
  var filtered = alivePlayers.filter(function(value, index, arr){ 
    return value.card2!=='';
  });
  alivePlayers = filtered;
}

function populateDeadPlayers(dead, deadPlayers) {
  console.log(`Player dead: ${dead} ${typeof dead}`);
  alivePlayers.forEach(e => {
    if (e.playerId+1===parseInt(dead)) {
      if (e.card1!=='') {
        console.log('card1 is not empty');
        e.card1 = '';
        e.poison = 0;
      } else if (e.card2!=='') {
        e.card2 = '';
      }
    }
  });
  deadPlayers.push(dead);
}

function printAlivePlayers() {
  alivePlayers.forEach(e => {
    console.log(`card1: ${e.card1}, card2: ${e.card2}, playerId: ${e.playerId}`);
  });
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
  updateExistingPlayers,
  printAlivePlayers,
  sortAlivePlayers,
  getSilencedPlayer
};