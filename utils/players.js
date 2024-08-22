const e = require("express");
// players[] keeps track of how many players joined the game. alivePlayers is how many players are ready
var players = [];
var cards = [];
var cardsChinese = [];
var alivePlayers = [];
var roundAction = [];
var globalBadIdentities = '0'; // 0: 6 players, 1: killer, revenger, silencer, 2: killer, bioChemist, sliencer

function getAlivePlayers() {
  return alivePlayers;
}

function sortAlivePlayers() {
  alivePlayers.sort((a, b) => (a.playerId > b.playerId) ? 1 : -1);
}

// Join player to game and show cards
function playerJoin(id, username, isNewGame, playerLength, badIdentities) {
  if (isNewGame) {
    if (playerLength==='7') {
      cards = ['police', 'police', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager', 'villager'];
      cardsChinese = ['警察','警察','平民','平民','平民','平民','平民','平民','平民'];
      globalBadIdentities = badIdentities;
      if (badIdentities === '1') {
        cards.push('killer', 'revenger', 'silencer');
        cards.push('gunSmith', 'doctor'); // TODO: need to dynamically populate good guy cards
        cardsChinese.push('杀手','复仇者','禁言');
        cardsChinese.push('Gun Smith','医生'); // TODO: need to dynamically populate good guy cards
      } else {
        cards.push('killer', 'bioChemist', 'silencer');
        cards.push('gunSmith', 'doctor'); // TODO: need to dynamically populate good guy cards
        cardsChinese.push('杀手','生化学家','禁言');
        cardsChinese.push('Gun Smith','医生'); // TODO: need to dynamically populate good guy cards
      }
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
  map.set('bioChemist', -4);
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
  // if there is no player performed ability, initialize the current roundAction with all -1 values. Otherwise, get the current abilities 
  // performed and add current action to this round.
  if (roundAction[round-1]==undefined) {
    roundAction.push(getThisRoundAction(initializeThisRound(round), action, playerId));
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
  } else if (action==='release') {
    thisRound.poisonReleased = playerId;
  }
  return thisRound;
}

function noPlayerAction(action, round) {
  if (roundAction[round-1]==undefined) {
    roundAction.push(getThisRoundNoAction(initializeThisRound(round), action));
  } else {
    var thisRound = roundAction[round-1];
    roundAction[round-1] = getThisRoundNoAction(thisRound, action);
  }
}

// TODO: need to dynamically initialize player actions based on the actual cards
// Initialize player actions for current night round
function initializeThisRound(round) {
  var thisRound = [];
    if (globalBadIdentities === '0') { // 6 players
      thisRound = {"killed": -1, "checked": -1, "gunned": -1, "injected": -1, "silenced": -1};
    } else if (globalBadIdentities === '1') { // 7 players: killer, revenger, silencer
      if (round===1 && cards.length===14) {
        thisRound = {"killed": -1, "checked": -1, "gunned": -1, "injected": -1, "silenced": -1, "revenged": -1};
      } else {
        thisRound = {"killed": -1, "checked": -1, "gunned": -1, "injected": -1, "silenced": -1};
      }
    } else if (globalBadIdentities === '2') { // 7 players: killer, bioChem, silencer
      thisRound = {"killed": -1, "checked": -1, "gunned": -1, "injected": -1, "silenced": -1, "poisonReleased": -1};
    } else {
      console.error('globalBadIdentities is not valid!!!');
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
  } else if (action==='release') {
    thisRound.poisonReleased = 0;
  }
  return thisRound;
}

function isRoundOver(round) {
  const currentRound = roundAction[round-1];
  if (currentRound===undefined) { // all gods are present
    return false;
  }
  // TODO; need to dynamically check if all the actions are performed based on the cards selected
  if (globalBadIdentities === '0' || globalBadIdentities === '1') { // 6 players, or 7 players with revenger
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
  } else if (globalBadIdentities === '2') { // 7 players with bioChemist
    if (currentRound.killed!==-1 && currentRound.checked!==-1 && currentRound.injected!==-1 
      && currentRound.gunned!==-1 && currentRound.silenced!==-1 && currentRound.poisonReleased!==-1) {
      console.log(`killed: ${currentRound.killed}, checked: ${currentRound.checked}, 
        gunned: ${currentRound.gunned}, injected: ${currentRound.injected}, silenced: ${currentRound.silenced}, 
        poisoned: ${currentRound.poisonReleased}`);
      return true;
    } else {
      return false;
    }
  } else {
    console.error('globalBadIdentities is not valid!!!');
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
  if (currentRound.poisonReleased!==0) {
    console.log('Poison is released');

    // If only 2 or 3 players remaining, add poison to all players
    if (alivePlayers.length === 2 || alivePlayers.length === 3) {
      alivePlayers.forEach(e => {
        e.poison++;
      });
    } else { // If more than 3 players remaining, add poison to the target and the 2 adjacent players
      for (var i=0; i<alivePlayers.length; i++) {
        if ((alivePlayers[i].playerId+1).toString() === currentRound.poisonReleased) {
          if (i===0) {
            alivePlayers[alivePlayers.length-1].poison++;
            alivePlayers[i+1].poison++;
          } else if (i===alivePlayers.length-1) {
            alivePlayers[i-1].poison++;
            alivePlayers[0].poison++;
          } else {
            alivePlayers[i-1].poison++
            alivePlayers[i+1].poison++;
          }
          alivePlayers[i].poison++;
        }
      }
    }

    for (var i=0; i<alivePlayers.length; i++) {
      if (alivePlayers[i].poison === 2) {
        populateDeadPlayers((alivePlayers[i].playerId+1).toString(), deadPlayers);
      }
    }

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