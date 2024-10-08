const InGameLogicVariables = require("../repositories/ingameLogicRepository");
var inGameLogicVariables = new InGameLogicVariables();

const VotingLogicVariables = require("../repositories/votingLogicRepository");
var votingLogicVariables = new VotingLogicVariables();

const {
  getAlivePlayers,
  filteringOutDeadPlayers,
} = require("../models/alivePlayers");

const { resetPreGameLogicVariables, getGameLogicVariables } = require("../services/pregameService");

const isSideKillFlag = true;

/**
 * This function is call to reset all variables used in game play.
 * Only use this function when game is over.
 */
function resetAllGameLogicVariables() {
  inGameLogicVariables = new InGameLogicVariables();
  resetPreGameLogicVariables();
  votingLogicVariables = new VotingLogicVariables();
}

function getRound() {
  return inGameLogicVariables.round;
}

function proceedToNextNight(io) {
  console.log("proceeding to next round");
  // clearing card counts for current night
  inGameLogicVariables.killerCount = 0;
  inGameLogicVariables.silencerCount = 0;
  inGameLogicVariables.policeCount = 0;
  inGameLogicVariables.doctorCount = 0;
  inGameLogicVariables.gunSmithCount = 0;
  inGameLogicVariables.bioChemistCount = 0;
  inGameLogicVariables.turtleCount = 0;
  inGameLogicVariables.priestCount = 0;

  // Increasing round count and reseting all voting related global variables
  inGameLogicVariables.round++;
  votingLogicVariables = new VotingLogicVariables();

  var i;
  for (i = 0; i < getAlivePlayers().length; i++) {
    const currentPlayer = getAlivePlayers()[i];
    if (currentPlayer.isRevived && inGameLogicVariables.revivedRound + 1 === inGameLogicVariables.round) {
      console.log("reviving player: ", currentPlayer);
      currentPlayer.card1 = currentPlayer.cardToBeRevived;
      io.emit("updateRevivedCard", { alivePlayers: getAlivePlayers() });
    }
    var role = updateSocketRoomRole(currentPlayer);
    if (role === "killer") inGameLogicVariables.killerCount++;
    else if (role === "silencer") inGameLogicVariables.silencerCount++;
    else if (role === "police") inGameLogicVariables.policeCount++;
    else if (role === "doctor") inGameLogicVariables.doctorCount++;
    else if (role === "gunSmith") inGameLogicVariables.gunSmithCount++;
    else if (role === "bioChemist") inGameLogicVariables.bioChemistCount++;
    else if (role === "turtle") inGameLogicVariables.turtleCount++;
    else if (role === "priest") inGameLogicVariables.priestCount++;
  }
  // console.log("Alive players for tonight: ", getAlivePlayers());

  // console.log("Updating current card, getAlivePlayers: ", getAlivePlayers());
  io.emit("updateCurrentCard", { alivePlayers: getAlivePlayers(), nightOrDay: "turningNight" });

  io.emit("message", `天黑请闭眼...第${inGameLogicVariables.round}夜!`);
  console.log(`biochemist count: ${inGameLogicVariables.bioChemistCount}`);
  console.log(`poisonReleasedRound during night: ${inGameLogicVariables.poisonReleasedRound}`);

  if (getGameLogicVariables().badPlayerCardList.includes("revenger")) {
    if (inGameLogicVariables.round === 1) {
      io.emit("revengerAction");
    } else {
      noPlayerAction("revenge");
    }
  } else {
    noPlayerAction("revenge");
  }

  if (getGameLogicVariables().badPlayerCardList.includes("bioChemist")) {
    // bioChemist only able to use ability 2 rounds after first release, and can only use ability twice
    if (
      inGameLogicVariables.round === 1 ||
      (inGameLogicVariables.numberOfPoinsonReleased < 2 &&
        inGameLogicVariables.round > inGameLogicVariables.poisonReleasedRound + 1)
    ) {
      console.log("current round is greater than poisonReleasedRound+1");
      console.log(`biochemist count: ${inGameLogicVariables.bioChemistCount}`);
      if (inGameLogicVariables.bioChemistCount > 0) {
        inGameLogicVariables.noKillerPresent = false;
        io.emit("bioChemistAction", {
          alivePlayers: getAlivePlayers(),
          round: inGameLogicVariables.round,
          bioChemistCount: inGameLogicVariables.bioChemistCount,
        });
      } else {
        noPlayerAction("release");
      }
    } else {
      noPlayerAction("release");
    }
  } else {
    noPlayerAction("release");
  }

  if (inGameLogicVariables.turtleCount > 0) {
    console.log("turtle exists");
    io.emit("turtleAction", {
      alivePlayers: getAlivePlayers(),
      round: inGameLogicVariables.round,
    });
  } else {
    noPlayerAction("retract");
  }

  if (inGameLogicVariables.silencerCount > 0) {
    io.emit("silencerAction", {
      alivePlayers: getAlivePlayers(),
      round: inGameLogicVariables.round,
    });
  } else {
    noPlayerAction("silence");
  }

  console.log("inGameLogicVariables before priest check ", inGameLogicVariables);
  if (inGameLogicVariables.priestCount > 0 && !inGameLogicVariables.isPriestRevived) {
    io.emit("priestAction", {
      alivePlayers: getAlivePlayers(),
      round: inGameLogicVariables.round,
    });
  } else {
    noPlayerAction("revive");
  }

  if (inGameLogicVariables.killerCount > 0) {
    inGameLogicVariables.noKillerPresent = false;
    io.emit("killerAction", {
      alivePlayers: getAlivePlayers(),
      round: inGameLogicVariables.round,
      killerCount: inGameLogicVariables.killerCount,
    });
  } else {
    inGameLogicVariables.noKillerPresent = true;
    noPlayerAction("kill");
  }

  if (inGameLogicVariables.policeCount > 0) {
    io.emit("policeAction", {
      alivePlayers: getAlivePlayers(),
      round: inGameLogicVariables.round,
      policeCount: inGameLogicVariables.policeCount,
    });
  } else {
    noPlayerAction("check");
  }

  if (inGameLogicVariables.doctorCount > 0) {
    io.emit("doctorAction", {
      alivePlayers: getAlivePlayers(),
      round: inGameLogicVariables.round,
    });
  } else {
    noPlayerAction("inject");
  }

  if (inGameLogicVariables.gunSmithCount > 0 && !inGameLogicVariables.isGunSmithFired) {
    io.emit("gunSmithAction", {
      alivePlayers: getAlivePlayers(),
      round: inGameLogicVariables.round,
      isVotingRound: false,
    });
  } else {
    noPlayerAction("gun");
  }

  if (isRoundOver()) {
    console.log("Night round is over");
    roundOverAction(io);
  }
}

function updateSocketRoomRole(currentPlayer) {
  if (currentPlayer.card1 === "" && currentPlayer.card2 === "") {
    return "villager";
  }
  return currentPlayer.card1 !== "" ? currentPlayer.card1 : currentPlayer.card2;
}

function noPlayerAction(action) {
  if (inGameLogicVariables.roundAction[inGameLogicVariables.round - 1] == undefined) {
    inGameLogicVariables.roundAction.push(getThisRoundNoAction(initializeThisRound(), action));
  } else {
    var thisRound = inGameLogicVariables.roundAction[inGameLogicVariables.round - 1];
    inGameLogicVariables.roundAction[inGameLogicVariables.round - 1] = getThisRoundNoAction(thisRound, action);
  }
}

// Initialize player actions for current night round
function initializeThisRound() {
  var thisRound = [];
  thisRound = {
    killed: -1,
    checked: -1,
    gunned: -1,
    injected: -1,
    silenced: -1,
    revenged: -1,
    retracted: -1,
    revived: -1,
    poisonReleased: -1,
  };
  return thisRound;
}

function getThisRoundNoAction(thisRound, action) {
  if (action === "kill") {
    thisRound.killed = 0;
  } else if (action === "check") {
    thisRound.checked = 0;
  } else if (action === "gun") {
    thisRound.gunned = 0;
  } else if (action === "inject") {
    thisRound.injected = 0;
  } else if (action === "silence") {
    thisRound.silenced = 0;
  } else if (action === "release") {
    thisRound.poisonReleased = 0;
  } else if (action === "retract") {
    thisRound.retracted = 0;
  } else if (action === "revive") {
    thisRound.revived = 0;
  } else if (action === "revenge") {
    thisRound.revenged = 0;
  }
  return thisRound;
}

function isRoundOver() {
  const currentRound = inGameLogicVariables.roundAction[inGameLogicVariables.round - 1];
  if (currentRound === undefined) {
    // all gods are present
    return false;
  }

  console.log("current round action status: ", currentRound);

  return (
    currentRound.killed !== -1 &&
    currentRound.checked !== -1 &&
    currentRound.injected !== -1 &&
    currentRound.gunned !== -1 &&
    currentRound.silenced !== -1 &&
    currentRound.poisonReleased !== -1 &&
    currentRound.retracted !== -1 &&
    currentRound.revived !== -1 &&
    currentRound.revenged !== -1
  );
  
}

/**
 * This function is called when all players have completed their action during night
 * @param {socketio} io
 */
function roundOverAction(io) {
  setTimeout(
    () => {
      console.log("Round Over!");
      // Reverting the revived card
      if (inGameLogicVariables.revivedRound + 1 === inGameLogicVariables.round) {
        io.emit("revertRevivedCard", { alivePlayers: getAlivePlayers() });
      }
      const deadPlayers = calculateRoundResult();
      // console.log(`alive players: ${JSON.stringify(getAlivePlayers(), null, 4)}`);
      deadPlayers.forEach((e) => {
        if (e === inGameLogicVariables.revengeChosen.toString()) {
          getAlivePlayers().forEach((element) => {
            if ((element.playerId + 1).toString() === e) {
              if (
                (inGameLogicVariables.revengeCard === 1 && element.card1 === "") ||
                (inGameLogicVariables.revengeCard === 2 && element.card2 === "")
              ) {
                console.log("activate revenger");
                activateRevenager();
              }
            }
          });
        }
      });

      filteringOutDeadPlayers();
      // updateExistingPlayers();

      var deadPlayerMessage = "";
      if (deadPlayers.length === 0) {
        deadPlayerMessage = "平安夜，没有人死!";
      } else {
        const i = Math.floor(Math.random() * 3);
        if (i === 0) deadPlayerMessage = `玩家${deadPlayers}惨死在血泊中！`;
        else if (i === 1) deadPlayerMessage = `玩家${deadPlayers}与世长辞！`;
        else deadPlayerMessage = `玩家${deadPlayers}离我们远去了！`;
      }

      const silencedPlayer = inGameLogicVariables.roundAction[inGameLogicVariables.round - 1].silenced.toString();
      var silencedPlayerMessage = "";
      if (silencedPlayer === "0") {
        silencedPlayerMessage = "没有人被禁言！";
      } else {
        silencedPlayerMessage = `玩家${silencedPlayer}被禁言！`;
      }

      io.emit("message", deadPlayerMessage);
      io.emit("message", silencedPlayerMessage);
      io.emit("roomUsers", getAlivePlayers());
      io.emit("updateCurrentCard", { alivePlayers: getAlivePlayers(), nightOrDay: "turningDay" });

      if (isBadGuysWon()) {
        io.emit("message", "游戏结束！坏人胜利！");
        resetAllGameLogicVariables();
      } else if (isGoodGuysWon()) {
        io.emit("message", "游戏结束！好人胜利！");
        resetAllGameLogicVariables();
      } else {
        // voteblePlayers consists elements of playerId and alreadyVoted flag
        votingLogicVariables.voteblePlayers = getVotePlayers(deadPlayers);
        inGameLogicVariables.gunablePlayers = [];
        for (var i = 0; i < votingLogicVariables.voteblePlayers.length; i++) {
          const playerId = parseInt(votingLogicVariables.voteblePlayers[i].playerId) - 1;
          const curPlayer = { playerId };
          inGameLogicVariables.gunablePlayers.push(curPlayer);
        }
        inGameLogicVariables.gunablePlayers.sort((a, b) => a.playerId - b.playerId);

        var isGunSmithKilled = false;
        for (var i = 0; i < getAlivePlayers().length; i++) {
          const currentPlayer = getAlivePlayers()[i];
          for (var j = 0; j < deadPlayers.length; j++) {
            if ((currentPlayer.playerId + 1).toString() === deadPlayers[j] && currentPlayer.card2 === "gunSmith") {
              isGunSmithKilled = true;
            }
          }
        }

        if (!inGameLogicVariables.isGunSmithFired && !isGunSmithKilled) {
          console.log("gun smith fire option");
          io.emit("gunSmithVotingRoundAction", {
            alivePlayers: inGameLogicVariables.gunablePlayers,
            round: inGameLogicVariables.round,
            isVotingRound: true,
          });
        }
        // console.log(`votablePlayers: ${JSON.stringify(gunablePlayers, null, 4)}`);

        io.emit("votePlayer", {
          voteThisPlayer: votingLogicVariables.voteblePlayers[0],
          voteIndex: 0,
          voteblePlayers: votingLogicVariables.voteblePlayers,
          round: inGameLogicVariables.round,
          isFirstRoundVoting: votingLogicVariables.isFirstRoundVoting,
        });
      }
    },
    inGameLogicVariables.noKillerPresent ? 10000 : 0
  );
}

/**
 * Determines the dead players from last night's actions
 * @returns {Array} deadPlayers
 */
function calculateRoundResult() {
  const currentRound = inGameLogicVariables.roundAction[inGameLogicVariables.round - 1];
  var deadPlayers = [];
  var deathRow = new Set();

  // killed and cured or retracted is not the same player, killed player is dead
  if (
    currentRound.killed !== 0 &&
    currentRound.killed !== currentRound.injected &&
    currentRound.killed !== currentRound.retracted
  ) {
    console.log("killed and cured is not the same player");
    deathRow.add(currentRound.killed);
  }

  // gun smith fired, gunned player is dead
  if (currentRound.gunned !== 0) {
    console.log("gun smith fired");
    deathRow.add(currentRound.gunned);
  }

  // bioChemist released poison
  if (currentRound.poisonReleased !== 0) {
    console.log("Poison is released");

    // If only 2 or 3 players remaining, add poison to all players
    if (getAlivePlayers().length === 2 || getAlivePlayers().length === 3) {
      getAlivePlayers().forEach((e) => {
        e.poison++;
      });
    } else {
      // If more than 3 players remaining, add poison to the target and the 2 adjacent players
      for (var i = 0; i < getAlivePlayers().length; i++) {
        if ((getAlivePlayers()[i].playerId + 1).toString() === currentRound.poisonReleased) {
          if (i === 0) {
            getAlivePlayers()[getAlivePlayers().length - 1].poison++;
            getAlivePlayers()[i + 1].poison++;
          } else if (i === getAlivePlayers().length - 1) {
            getAlivePlayers()[i - 1].poison++;
            getAlivePlayers()[0].poison++;
          } else {
            getAlivePlayers()[i - 1].poison++;
            getAlivePlayers()[i + 1].poison++;
          }
          getAlivePlayers()[i].poison++;
        }
      }
    }

    for (var i = 0; i < getAlivePlayers().length; i++) {
      if (getAlivePlayers()[i].poison >= 2) {
        deathRow.add((getAlivePlayers()[i].playerId + 1).toString());
      }
    }
  }

  // cured player is not killed, poison increased by 1
  if (currentRound.injected !== 0 && currentRound.injected !== currentRound.killed) {
    console.log("cured player is not killed");
    getAlivePlayers().forEach((e) => {
      if ((e.playerId + 1).toString() === currentRound.injected) {
        e.poison++;
        if (e.poison >= 2) {
          deathRow.add(currentRound.injected);
        }
      }
    });
  }

  // if current round is 1 round after priest revival action, priest dies
  if (inGameLogicVariables.revivedRound + 1 === inGameLogicVariables.round && inGameLogicVariables.isPriestRevived) {
    getAlivePlayers().forEach((e) => {
      if (e.card1 === "priest" || (e.card1 === "" && e.card2 === "priest")) {
        deathRow.add((e.playerId + 1).toString());
      }
    });
    // Only populate dead player if the player is not revived
    deathRow.forEach((value) => {
      var matchedAlivePlayer = getAlivePlayers().filter(function (current) {
        return (current.playerId + 1).toString() === value;
      })[0];
      if (!matchedAlivePlayer.isRevived) {
        populateDeadPlayers(value, deadPlayers);
      }
    });
    // reset isRevived to false and card1 to empty for the revived player
    getAlivePlayers().forEach((e) => {
      if (e.isRevived) {
        e.card1 = "";
        e.isRevived = false;
      }
    });
  } else {
    deathRow.forEach((value) => {
      populateDeadPlayers(value, deadPlayers);
    });
  }

  return deadPlayers.sort();
}

/**
 * Updates the card to empty for dead players, and add dead players to deadPlayers list
 * @param {String} dead
 * @param {Array} deadPlayers
 */
function populateDeadPlayers(dead, deadPlayers) {
  console.log(`Player dead: ${dead} ${typeof dead}`);
  getAlivePlayers().forEach((e) => {
    if (e.playerId + 1 === parseInt(dead)) {
      if (e.card1 !== "") {
        e.card1 = "";
        e.poison = 0;
      } else if (e.card2 !== "") {
        e.card2 = "";
      }
    }
  });
  deadPlayers.push(dead);
}

function activateRevenager() {
  getAlivePlayers().forEach((e) => {
    if (e.card1 === "revenger") {
      e.card1 = "killer";
    } else if (e.card2 === "revenger") {
      e.card2 = "killer";
    }
  });
  console.log(`after activeate revenger: ${JSON.stringify(getAlivePlayers(), null, 4)}`);
}

// function updateExistingPlayers() {
//   var filtered = getAlivePlayers().filter(function (value) {
//     return value.card2 !== "";
//   });
//   getAlivePlayers() = filtered;
//   // setAlivePlayers(filtered);
// }

function isBadGuysWon() {
  var pureVillagerExists = false;
  var godExists = false;
  getAlivePlayers().forEach((e) => {
    if (e.isPureVillager) {
      pureVillagerExists = true;
    }
    if (e.side > 0) {
      godExists = true;
    }
  });
  if (isSideKillFlag) {
    return (!pureVillagerExists && getGameLogicVariables().isPureVillagerExists) || !godExists;
  } else {
    return !godExists && !pureVillagerExists;
  }
}

function isGoodGuysWon() {
  var result = true;
  getAlivePlayers().forEach((e) => {
    if (e.side < 0) {
      result = false;
    }
  });
  return result;
}

function getVotePlayers(deadPlayers) {
  var votePlayers = [];
  // console.log(`num of alive players: ${getAlivePlayers().length}`);
  for (var i = 0; i < getAlivePlayers().length; i++) {
    var exist = false;
    for (var j = 0; j < deadPlayers.length; j++) {
      if ((parseInt(getAlivePlayers()[i].playerId) + 1).toString() === deadPlayers[j]) {
        exist = true;
      }
    }
    if (!exist) {
      votePlayers.push((parseInt(getAlivePlayers()[i].playerId) + 1).toString());
    }
  }
  var voteOrder = [];
  var firstDead = deadPlayers[0];
  if (firstDead === undefined) {
    firstDead = Math.floor(Math.random() * votePlayers.length);
  }
  for (var i = 0; i < votePlayers.length; i++) {
    if (parseInt(votePlayers[i]) > parseInt(firstDead)) {
      var l1 = votePlayers.slice(i);
      var l2 = votePlayers.slice(0, i);
      voteOrder = l1.concat(l2);
      break;
    }
  }
  if (voteOrder.length === 0) {
    voteOrder = votePlayers;
  }
  var result = [];
  voteOrder.forEach((e) => {
    result.push({ playerId: e, numOfVotes: 0, alreadyVoted: "N" });
  });
  return result;
}

function playerAction(playerId, action) {
  console.log(`round: ${inGameLogicVariables.round}`);
  // if there is no player performed ability, initialize the current roundAction with all -1 values. Otherwise, get the current abilities
  // performed and add current action to this round.
  if (inGameLogicVariables.roundAction[inGameLogicVariables.round - 1] == undefined) {
    inGameLogicVariables.roundAction.push(
      getThisRoundAction(initializeThisRound(inGameLogicVariables.round), action, playerId)
    );
  } else {
    var thisRound = inGameLogicVariables.roundAction[inGameLogicVariables.round - 1];
    inGameLogicVariables.roundAction[inGameLogicVariables.round - 1] = getThisRoundAction(thisRound, action, playerId);
  }
}

function getThisRoundAction(thisRound, action, playerId) {
  if (action === "kill") {
    thisRound.killed = playerId;
  } else if (action === "check") {
    thisRound.checked = playerId;
  } else if (action === "gun") {
    thisRound.gunned = playerId;
  } else if (action === "inject") {
    thisRound.injected = playerId;
  } else if (action === "silence") {
    thisRound.silenced = playerId;
  } else if (action === "revenge") {
    thisRound.revenged = playerId;
  } else if (action === "release") {
    thisRound.poisonReleased = playerId;
  } else if (action === "retract") {
    thisRound.retracted = playerId;
  } else if (action === "revive") {
    thisRound.revived = playerId;
  }
  return thisRound;
}

function getRoleCount(card) {
  var count = 0;
  for (i = 0; i < getAlivePlayers().length; i++) {
    const currentPlayer = getAlivePlayers()[i];
    if (currentPlayer.card1 === card) {
      count++;
    } else if (currentPlayer.card1 === "" && currentPlayer.card2 === card) {
      count++;
    }
  }
  return count;
}

function processChooseRevenge(playerId, cardId) {
  inGameLogicVariables.revengeChosen = playerId;
  inGameLogicVariables.revengeCard = cardId;
  playerAction(playerId, "revenge");
}

function processReleasePoison(playerId) {
  console.log("received bioChemist action");
  console.log(`poison released on playerId ${playerId} ${typeof playerId}`);
  console.log(`poison released round is ${inGameLogicVariables.poisonReleasedRound}`);
  playerAction(playerId, "release");
  if (playerId !== "0") {
    console.log("poisoned player is not 0, assigning poisonReleasedRound to current round");
    inGameLogicVariables.poisonReleasedRound = inGameLogicVariables.round;
    inGameLogicVariables.numberOfPoinsonReleased++;
  }
}

function processRevivePlayer(playerId, io) {
  console.log("entered processRevivePlayer");
  if (playerId === "0") {
    noPlayerAction("revive");
  } else {
    inGameLogicVariables.revivedRound = inGameLogicVariables.round;
    playerAction(playerId, "revive");
    getAlivePlayers().forEach((player) => {
      if ((player.playerId + 1).toString() === playerId) {
        player.isRevived = true;
      }
    });
    inGameLogicVariables.isPriestRevived = true;
  }
}

function processGunPlayer(playerId, isVotingRound, io) {
  console.log(`gun playerId type: ${typeof playerId}`);
  console.log(`gun playerId: ${playerId}`);
  console.log(`isVotingRound type : ${typeof playerId}`);

  if (playerId === "0") {
    inGameLogicVariables.isGunSmithFired = false;
    noPlayerAction("gun");
  } else {
    inGameLogicVariables.isGunSmithFired = true;
    if (isVotingRound) {
      console.log("Gun Smith fired during voting");
      console.log(`fired player: ${playerId}`);
      //   console.log(`pk player: ${JSON.stringify(playersWithMostVotes, null, 4)}`);
      votingLogicVariables.gunnedPlayerDuringVoting = playerId;

      populateDeadPlayers(votingLogicVariables.gunnedPlayerDuringVoting, []);
      io.emit("message", `玩家${votingLogicVariables.gunnedPlayerDuringVoting}被Gun Smith带走了！`);
      if (votingLogicVariables.gunnedPlayerDuringVoting === inGameLogicVariables.revengeChosen.toString()) {
        getAlivePlayers().forEach((element) => {
          if ((element.playerId + 1).toString() === votingLogicVariables.gunnedPlayerDuringVoting) {
            if (
              (inGameLogicVariables.revengeCard === 1 && element.card1 === "") ||
              (inGameLogicVariables.revengeCard === 2 && element.card2 === "")
            ) {
              console.log("activate revenger");
              activateRevenager();
            }
          }
        });
      }
      filteringOutDeadPlayers();
      // updateExistingPlayers();
      console.log("alivePlayers after updating", getAlivePlayers());
      io.emit("roomUsers", getAlivePlayers());
    } else {
      playerAction(playerId, "gun");
    }
  }
  io.emit("gunComplete", {
    playerId: playerId,
    alivePlayers: isVotingRound ? inGameLogicVariables.gunablePlayers : getAlivePlayers(),
    round: inGameLogicVariables.round,
  });
  if (isVotingRound) {
    if (isBadGuysWon()) {
      io.emit("message", "游戏结束！坏人胜利！");
      resetAllGameLogicVariables();
    } else if (isGoodGuysWon()) {
      io.emit("message", "游戏结束！好人胜利！");
      resetAllGameLogicVariables();
    } else {
      proceedToNextNight(io);
    }
  } else {
    if (isRoundOver()) {
      roundOverAction(io);
    }
  }
}

/**
 * Update the turle action as no action to complete the night round. Turtle action will be saved in front-end
 */
function processRetractSelected(currentPlayerId, isRetracted) {
  console.log("processing retract selected");
  console.log("player that retracted: ", currentPlayerId);
  console.log("is retracted? ", isRetracted);
  if (isRetracted) {
    playerAction(currentPlayerId, "retract");
  } else {
    noPlayerAction("retract");
  }
}

function processIncreaseVote(votedPlayer, currentPlayerId, voteIndex, io) {
  if (currentPlayerId !== votingLogicVariables.gunnedPlayerDuringVoting) {
    votingLogicVariables.whoVotedWho.push(currentPlayerId);
  }
  votingLogicVariables.voteblePlayers.forEach((e) => {
    if (e.playerId === votedPlayer.toString() && currentPlayerId !== votingLogicVariables.gunnedPlayerDuringVoting) {
      e.numOfVotes++;
    }
    if (e.playerId === currentPlayerId) {
      e.alreadyVoted = "Y";
    }
  });
  voteComplete(voteIndex, io);
}

function isFirstRoundVoting() {
  return votingLogicVariables.isFirstRoundVoting;
}

function processVerifyCheckPlayer() {
  console.log("Processing VerifyCheckPlayer");
  if (inGameLogicVariables.isPoliceCheckingInProgress) {
    console.log("Police checking is ongoing...");
    return false;
  } else {
    inGameLogicVariables.isPoliceCheckingInProgress = true;
    return true;
  }
}

function resetIsPoliceCheckingInProgress() {
  inGameLogicVariables.isPoliceCheckingInProgress = false;
}

function processVerifyKillerPlayer() {
  console.log("Processing VerifyKillerPlayer");
  if (inGameLogicVariables.isKillerCheckingInProgress) {
    console.log("Killer checking is ongoing...");
    return false;
  } else {
    console.log("You are the first killer initiated action");
    inGameLogicVariables.isKillerCheckingInProgress = true;
    return true;
  }
}

function resetIsKillerCheckingInProgress() {
  inGameLogicVariables.isKillerCheckingInProgress = false;
}

function processVoteNo(voteIndex, playerId, io) {
  const playerBeingVoted = votingLogicVariables.isFirstRoundVoting
    ? votingLogicVariables.voteblePlayers[parseInt(voteIndex)].playerId
    : votingLogicVariables.playersWithMostVotes[parseInt(voteIndex)].playerId;
  console.log(`Player ${playerId} voted no for player ${playerBeingVoted}`);
  io.emit("voteComplete", {
    currentPlayer: playerId,
    round: inGameLogicVariables.round,
    isFirstRoundVoting: votingLogicVariables.isFirstRoundVoting,
    playerBeingVoted: playerBeingVoted,
  });
  voteComplete(voteIndex, io);
}

function voteComplete(voteIndex, io) {
  console.log("entering voteComplete");

  votingLogicVariables.playersThatVoted++;
  console.log("printing current votingLogicVariables: ", votingLogicVariables);
  // When all players have completed voting for current player being voted
  if (votingLogicVariables.playersThatVoted === votingLogicVariables.voteblePlayers.length) {
    var curPlayer = votingLogicVariables.isFirstRoundVoting
      ? votingLogicVariables.voteblePlayers[parseInt(voteIndex)].playerId
      : votingLogicVariables.playersWithMostVotes[parseInt(voteIndex)].playerId;

    if (votingLogicVariables.whoVotedWho.length === 0) {
      io.emit("message", `没人投玩家${curPlayer}`);
    } else {
      io.emit("message", `玩家：${votingLogicVariables.whoVotedWho}投了玩家${curPlayer}`);
    }

    votingLogicVariables.playersThatVoted = 0;
    console.log(`voteIndex: ${voteIndex}`);
    // If last votable player is completed, determining if proceed to next night or PK. Else vote next player
    if (
      parseInt(voteIndex) ===
      (votingLogicVariables.playersWithMostVotes.length > 1
        ? votingLogicVariables.playersWithMostVotes.length - 1
        : votingLogicVariables.voteblePlayers.length - 1)
    ) {
      // calculate vote result
      console.log("voting of this round is over");
      console.log(`voteblePlayers: ${JSON.stringify(votingLogicVariables.voteblePlayers, null, 4)}`);
      console.log("playersWithMostVotes", votingLogicVariables.playersWithMostVotes);
      var playersCanBeVoted =
        votingLogicVariables.playersWithMostVotes.length > 1
          ? votingLogicVariables.playersWithMostVotes
          : votingLogicVariables.voteblePlayers;
      votingLogicVariables.playersWithMostVotes = [];

      var mostVoteCount = 0;
      console.log(`playersCanBeVoted: ${JSON.stringify(playersCanBeVoted, null, 4)}`);

      playersCanBeVoted.forEach((e) => {
        if (e.numOfVotes === mostVoteCount) {
          votingLogicVariables.playersWithMostVotes.push(e);
        } else if (e.numOfVotes > mostVoteCount) {
          mostVoteCount = e.numOfVotes;
          votingLogicVariables.playersWithMostVotes = [];
          votingLogicVariables.playersWithMostVotes.push(e);
        }
      });

      // Restart voting on the players with the same number of votes
      if (votingLogicVariables.playersWithMostVotes.length > 1 && votingLogicVariables.isFirstRoundVoting) {
        io.emit("message", "pk");
        votingLogicVariables.voteblePlayers.forEach((e) => {
          e.alreadyVoted = "N";
          e.numOfVotes = 0;
        });

        votingLogicVariables.isFirstRoundVoting = false;
        votingLogicVariables.whoVotedWho = [];

        io.emit("votePlayer", {
          voteThisPlayer: votingLogicVariables.playersWithMostVotes[0],
          voteIndex: 0,
          voteblePlayers: votingLogicVariables.voteblePlayers,
          round: inGameLogicVariables.round,
          isFirstRoundVoting: votingLogicVariables.isFirstRoundVoting,
        });
      } else {
        votingLogicVariables.playersWithMostVotes.forEach((e) => {
          var deadPlayers = [];
          populateDeadPlayers(e.playerId, deadPlayers);
          if (e.playerId === inGameLogicVariables.revengeChosen.toString()) {
            getAlivePlayers().forEach((element) => {
              if ((element.playerId + 1).toString() === e.playerId) {
                if (
                  (inGameLogicVariables.revengeCard === 1 && element.card1 === "") ||
                  (inGameLogicVariables.revengeCard === 2 && element.card2 === "")
                ) {
                  console.log("activate revenger");
                  activateRevenager();
                }
              }
            });
          }
          filteringOutDeadPlayers();
          // updateExistingPlayers();
        });
        var votedOutPlayersMsg = [];

        console.log(`voted out player length: ${votingLogicVariables.playersWithMostVotes.length}`);
        votingLogicVariables.playersWithMostVotes.forEach((e) => {
          votedOutPlayersMsg.push(e.playerId);
        });
        io.emit("message", `玩家${votedOutPlayersMsg}被投票出局！`);
        if (isBadGuysWon()) {
          io.emit("message", "游戏结束！坏人胜利！");
          resetAllGameLogicVariables();
        } else if (isGoodGuysWon()) {
          io.emit("message", "游戏结束！好人胜利！");
          resetAllGameLogicVariables();
        } else {
          io.emit("roomUsers", getAlivePlayers());
          proceedToNextNight(io);
        }
      }
    } else {
      votingLogicVariables.whoVotedWho = [];
      io.emit("votePlayer", {
        voteThisPlayer:
          votingLogicVariables.playersWithMostVotes.length > 1
            ? votingLogicVariables.playersWithMostVotes[parseInt(voteIndex) + 1]
            : votingLogicVariables.voteblePlayers[parseInt(voteIndex) + 1],
        voteIndex: parseInt(voteIndex) + 1,
        voteblePlayers: votingLogicVariables.voteblePlayers,
        round: inGameLogicVariables.round,
        isFirstRoundVoting: votingLogicVariables.isFirstRoundVoting,
      });
    }
  }
}

module.exports = {
  resetAllGameLogicVariables,
  getRound,
  proceedToNextNight,
  playerAction,
  noPlayerAction,
  isRoundOver,
  roundOverAction,
  getRoleCount,
  processChooseRevenge,
  processReleasePoison,
  processGunPlayer,
  processRevivePlayer,
  processRetractSelected,
  isFirstRoundVoting,
  processIncreaseVote,
  processVoteNo,
  processVerifyCheckPlayer,
  resetIsPoliceCheckingInProgress,
  processVerifyKillerPlayer,
  resetIsKillerCheckingInProgress,
};
