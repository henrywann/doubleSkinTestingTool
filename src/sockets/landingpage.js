const socketio = require("socket.io");
var io;

const { initAlivePlayers, getAlivePlayers } = require("../models/alivePlayers");

const {
  resetPreGameLogicVariables,
  processJoinGame,
  processPlayerReady,
  processSelectGoodCard,
  getInitialGoodCards,
} = require("../services/pregameService");

const {
  proceedToNextNight,
  resetAllGameLogicVariables,
  getRound,
  playerAction,
  isRoundOver,
  roundOverAction,
  getRoleCount,
  noPlayerAction,
  processChooseRevenge,
  processReleasePoison,
  processGunPlayer,
  isFirstRoundVoting,
  processIncreaseVote,
  processVoteNo,
  processVerifyCheckPlayer,
  resetIsPoliceCheckingInProgress,
  processVerifyKillerPlayer,
  resetIsKillerCheckingInProgress,
} = require("../services/ingameService");

module.exports = function (server) {
  io = socketio(server, {
    connectionStateRecovery: {},
  });

  // Run with client connects
  io.on("connection", function (socket) {
    console.log(`new connection: ${socket.id}`);
    socket.on("disconnect", () => {
      console.log("disconnected");
    });
    // socket.on('joinGame', ({username, numOfPlayers, badIdentities, socketId, state, voteIndex})
    socket.on("joinGame", (joinGame) => {
      console.log("JoinGame object: ", joinGame);
      processJoinGame(joinGame, socket, io);
    });

    socket.on("playerReady", (currentPlayer) => {
      var isReadyToStartGame = processPlayerReady(currentPlayer, socket, io);
      if (isReadyToStartGame) {
        proceedToNextNight(io);
      }
    });

    socket.on("initialGoodCards", () => {
      console.log("returning inital good cards");
      const initialGoodCards = getInitialGoodCards();
      io.emit("displaySelectedCardsEvent", initialGoodCards);
    });

    socket.on("selectGoodCard", (card) => {
      processSelectGoodCard(card, io);
    });

    socket.on("restartGame", () => {
      resetAllGameLogicVariables();
      resetPreGameLogicVariables();
      io.emit("restartGameForAll");
    });

    socket.on("chooseRevenge", ({ playerId, cardId }) => {
      processChooseRevenge(playerId, cardId);

      io.emit("completeRevengeAction", { playerId, cardId });

      if (isRoundOver()) {
        roundOverAction(io);
      }
    });

    socket.on("verifyKillPlayer", (playerIdTriggeredEvent,playerIdBeingKilled) => {
      if (processVerifyKillerPlayer()) {
        io.emit("verifyKill", {
          playerIdTriggeredEvent: playerIdTriggeredEvent,
          playerIdBeingKilled: playerIdBeingKilled,
          alivePlayers: getAlivePlayers(),
          round: getRound(),
        });
      }
    });

    socket.on("chooseKillAgain", (playerId) => {
      var killerCount = getRoleCount("killer");
      io.emit("killerAction", {
        alivePlayers: getAlivePlayers(),
        round: getRound(),
        killerCount: killerCount,
      });
      resetIsKillerCheckingInProgress();
    });

    socket.on("killPlayer", (playerId) => {
      playerAction(playerId, "kill");
      io.emit("killComplete", {
        playerId: playerId,
        alivePlayers: getAlivePlayers(),
        round: getRound(),
      });
      resetIsKillerCheckingInProgress();
      if (isRoundOver()) {
        roundOverAction(io);
      }
    });

    socket.on("releasePoison", (playerId) => {
      processReleasePoison(playerId);

      io.emit("poisonReleaseComplete", {
        playerId: playerId,
        alivePlayers: getAlivePlayers(),
        round: getRound(),
      });

      if (isRoundOver()) {
        roundOverAction(io);
      }
    });

    socket.on("verifyCheckPlayer", (playerIdTriggeredEvent, playerIdBeingChecked) => {
      console.log("verifyCheckPlayer, playerId that triggered this event: ", playerIdTriggeredEvent);
      if (processVerifyCheckPlayer()) {
        io.emit("verifyCheck", {
          playerIdTriggeredEvent: playerIdTriggeredEvent,
          playerIdBeingChecked: playerIdBeingChecked,
          alivePlayers: getAlivePlayers(),
          round: getRound(),
        });
      }
    });

    socket.on("chooseCheckAgain", (playerId) => {
      var policeCount = getRoleCount("police");
      io.emit("policeAction", {
        alivePlayers: getAlivePlayers(),
        round: getRound(),
        policeCount: policeCount,
      });
      resetIsPoliceCheckingInProgress();
    });

    socket.on("checkPlayer", (playerId) => {
      playerAction(playerId, "check");
      io.emit("checkComplete", {
        playerId: playerId,
        alivePlayers: getAlivePlayers(),
        round: getRound(),
      });
      resetIsPoliceCheckingInProgress();
      if (isRoundOver()) {
        roundOverAction(io);
      }
    });

    socket.on("injectPlayer", (playerId) => {
      playerAction(playerId, "inject");
      io.emit("injectComplete", {
        playerId: playerId,
        alivePlayers: getAlivePlayers(),
        round: getRound(),
      });
      if (isRoundOver()) {
        roundOverAction(io);
      }
    });

    socket.on("gunPlayer", ({ playerId, isVotingRound, voteIndex }) => {
      processGunPlayer(playerId, isVotingRound, io);
    });

    socket.on("silencePlayer", (playerId) => {
      console.log(`silenced playerId type: ${typeof playerId}`);
      if (playerId === "0") {
        noPlayerAction("silence");
      } else {
        playerAction(playerId, "silence");
      }
      io.emit("silenceComplete", {
        playerId: playerId,
        alivePlayers: getAlivePlayers(),
        round: getRound(),
      });
      if (isRoundOver()) {
        roundOverAction(io);
      }
    });

    socket.on("chatMessage", ({ msg, username }) => {
      var playerId = 0;
      getAlivePlayers().forEach((element) => {
        if (element.username === username) {
          playerId = element.playerId;
        }
      });
      messageDetails = {
        message: msg,
        playername: username,
        playerId: playerId,
      };
      io.emit("playerChatmessage", messageDetails);
    });

    socket.on("increaseVote", ({ votedPlayer, currentPlayerId, voteIndex, round }) => {
      console.log(`Player ${currentPlayerId} voted player ${votedPlayer}`);

      io.emit("voteComplete", {
        currentPlayer: currentPlayerId,
        round: round,
        isFirstRoundVoting: isFirstRoundVoting(),
        playerBeingVoted: votedPlayer,
      });

      processIncreaseVote(votedPlayer, currentPlayerId, voteIndex, io);
    });

    socket.on("voteNo", ({ voteIndex, playerId }) => {
      processVoteNo(voteIndex, playerId, io);
    });

    socket.on("gunSmithVotingRoundFire", (response) => {
      io.emit("gunSmithAction", {
        alivePlayers: getAlivePlayers(),
        round: getRound(),
        isVotingRound: true,
      });
    });
  });
};

// function voteComplete(voteIndex) {
//   playersThatVoted++;
//   if (playersThatVoted === voteblePlayers.length) {
//     var curPlayer = isFirstRoundVoting
//       ? voteblePlayers[parseInt(voteIndex)].playerId
//       : playersWithMostVotes[parseInt(voteIndex)].playerId;
//     if (whoVotedWho.length === 0) io.emit("message", `没人投玩家${curPlayer}`);
//     else io.emit("message", `玩家：${whoVotedWho}投了玩家${curPlayer}`);
//     playersThatVoted = 0;
//     console.log(`voteIndex: ${voteIndex}`);
//     if (
//       parseInt(voteIndex) ===
//       (playersWithMostVotes.length > 1
//         ? playersWithMostVotes.length - 1
//         : voteblePlayers.length - 1)
//     ) {
//       // calculate vote result
//       console.log("voting of this round is over");
//       console.log(`voteblePlayers: ${JSON.stringify(voteblePlayers, null, 4)}`);
//       console.log(`playersWithMostVotes: ${JSON.stringify(playersWithMostVotes, null, 4)}`);
//       var playersCanBeVoted =
//         playersWithMostVotes.length > 1 ? playersWithMostVotes : voteblePlayers;
//       playersWithMostVotes = [];

//       var mostVoteCount = 0;
//       console.log(`playersCanBeVoted: ${JSON.stringify(playersCanBeVoted, null, 4)}`);

//       playersCanBeVoted.forEach((e) => {
//         if (e.numOfVotes === mostVoteCount) {
//           playersWithMostVotes.push(e);
//         } else if (e.numOfVotes > mostVoteCount) {
//           mostVoteCount = e.numOfVotes;
//           playersWithMostVotes = [];
//           playersWithMostVotes.push(e);
//         }
//       });

//       if (playersWithMostVotes.length > 1 && isFirstRoundVoting) {
//         // Restart voting on the players with the same number of votes
//         io.emit("message", "pk");
//         voteblePlayers.forEach((e) => {
//           e.alreadyVoted = "N";
//           e.numOfVotes = 0;
//         });
//         isFirstRoundVoting = false;
//         io.emit("votePlayer", {
//           voteThisPlayer: playersWithMostVotes[0],
//           voteIndex: 0,
//           voteblePlayers: voteblePlayers,
//           round: round,
//           isFirstRoundVoting: isFirstRoundVoting,
//         });
//       } else {
//         playersWithMostVotes.forEach((e) => {
//           var deadPlayers = [];
//           populateDeadPlayers(e.playerId, deadPlayers);
//           if (e.playerId === revengeChosen.toString()) {
//             getAlivePlayers().forEach((element) => {
//               if ((element.playerId + 1).toString() === e.playerId) {
//                 if (
//                   (revengeCard === 1 && element.card1 === "") ||
//                   (revengeCard === 2 && element.card2 === "")
//                 ) {
//                   console.log("activate revenger");
//                   activateRevenager();
//                 }
//               }
//             });
//           }
//           updateExistingPlayers();
//         });
//         var votedOutPlayersMsg = [];
//         console.log(`voted out player length: ${playersWithMostVotes.length}`);
//         playersWithMostVotes.forEach((e) => {
//           votedOutPlayersMsg.push(e.playerId);
//         });
//         io.emit("message", `玩家${votedOutPlayersMsg}被投票出局！`);
//         if (isBadGuysWon(isPureVillagerExists)) {
//           io.emit("message", "游戏结束！坏人胜利！");
//           resetGlobalVariablesForNewGame();
//         } else if (isGoodGuysWon()) {
//           io.emit("message", "游戏结束！好人胜利！");
//           resetGlobalVariablesForNewGame();
//         } else {
//           io.emit("roomUsers", getAlivePlayers());
//           proceedToNextNight();
//         }
//       }
//     } else {
//       // var curPlayer = voteblePlayers[parseInt(voteIndex)].playerId;
//       // io.emit('message', `Player ${curPlayer} received votes from player(s): ${whoVotedWho}`);
//       whoVotedWho = [];
//       io.emit("votePlayer", {
//         voteThisPlayer:
//           playersWithMostVotes.length > 1
//             ? playersWithMostVotes[parseInt(voteIndex) + 1]
//             : voteblePlayers[parseInt(voteIndex) + 1],
//         voteIndex: parseInt(voteIndex) + 1,
//         voteblePlayers: voteblePlayers,
//         round: round,
//         isFirstRoundVoting: isFirstRoundVoting,
//       });
//     }
//   }
// }

// function proceedToNextNight() {
//   console.log("proceeding to next round");
//   // clearing variables for current night
//   var killerCount = 0;
//   var policeCount = 0;
//   var doctorCount = 0;
//   var gunSmithCount = 0;
//   var silencerCount = 0;
//   var bioChemistCount = 0;
//   var i;
//   for (i = 0; i < getAlivePlayers().length; i++) {
//     const currentPlayer = getAlivePlayers()[i];
//     var role = updateSocketRoomRole(io, currentPlayer);
//     if (role === "killer") killerCount++;
//     else if (role === "silencer") silencerCount++;
//     else if (role === "police") policeCount++;
//     else if (role === "doctor") doctorCount++;
//     else if (role === "gunSmith") gunSmithCount++;
//     else if (role === "bioChemist") bioChemistCount++;
//   }

//   io.emit("updateCurrentCard", getAlivePlayers());
//   // Increasing round count and reseting all voting related global variables
//   round++;
//   playersThatVoted = 0;
//   voteblePlayers = [];
//   whoVotedWho = [];
//   playersWithMostVotes = [];
//   isFirstRoundVoting = true;
//   gunnedPlayerDuringVoting = -1;

//   // console.log(`killerCount: ${killerCount}, policeCount: ${policeCount}, doctorCount: ${doctorCount}, gunsmithCount: ${gunSmithCount}`);
//   io.emit("message", `天黑请闭眼...第${round}夜!`);
//   console.log(`badGuysCombination: ${badGuysCombination}`);
//   console.log(`biochemist count: ${bioChemistCount}`);
//   console.log(`poisonReleasedRound during night: ${poisonReleasedRound}`);

//   if (badGuysCombination === "1") {
//     if (round === 1) {
//       io.emit("revengerAction");
//     }
//   } else if (badGuysCombination === "2") {
//     // bioChemist only able to use ability 2 rounds after first release, and can only use ability twice
//     if (round === 1 || round > poisonReleasedRound + 1) {
//       console.log("current round is greater than poisonReleasedRound+1");
//       console.log(`biochemist count: ${bioChemistCount}`);
//       if (bioChemistCount > 0) {
//         noKillerPresent = false;
//         io.emit("bioChemistAction", {
//           alivePlayers: getAlivePlayers(),
//           round: round,
//           bioChemistCount: bioChemistCount,
//         });
//       } else {
//         noPlayerAction("release", round);
//       }
//     } else {
//       noPlayerAction("release", round);
//     }
//   }

//   if (silencerCount > 0) {
//     io.emit("silencerAction", {
//       alivePlayers: getAlivePlayers(),
//       round: round,
//     });
//   } else {
//     noPlayerAction("silence", round);
//   }
//   if (killerCount > 0) {
//     noKillerPresent = false;
//     if (isUsingSocketRoom) {
//       io.to("killerGroup").emit("killerAction", {
//         alivePlayers: getAlivePlayers(),
//         round: round,
//       });
//     } else {
//       io.emit("killerAction", {
//         alivePlayers: getAlivePlayers(),
//         round: round,
//         killerCount: killerCount,
//       });
//     }
//   } else {
//     noKillerPresent = true;
//     noPlayerAction("kill", round);
//   }
//   if (policeCount > 0) {
//     if (isUsingSocketRoom) {
//       io.to("policeGroup").emit("policeAction", {
//         alivePlayers: getAlivePlayers(),
//         round: round,
//       });
//     } else {
//       io.emit("policeAction", {
//         alivePlayers: getAlivePlayers(),
//         round: round,
//         policeCount: policeCount,
//       });
//     }
//   } else {
//     noPlayerAction("check", round);
//   }
//   if (doctorCount > 0) {
//     if (isUsingSocketRoom) {
//       io.to("doctor").emit("doctorAction", {
//         alivePlayers: getAlivePlayers(),
//         round: round,
//       });
//     } else {
//       io.emit("doctorAction", {
//         alivePlayers: getAlivePlayers(),
//         round: round,
//       });
//     }
//   } else {
//     noPlayerAction("inject", round);
//   }
//   if (gunSmithCount > 0 && !isGunSmithFired) {
//     if (isUsingSocketRoom) {
//       io.to("gunSmith").emit("gunSmithAction", {
//         alivePlayers: getAlivePlayers(),
//         round: round,
//         isVotingRound: false,
//       });
//     } else {
//       io.emit("gunSmithAction", {
//         alivePlayers: getAlivePlayers(),
//         round: round,
//         isVotingRound: false,
//       });
//     }
//   } else {
//     noPlayerAction("gun", round);
//   }
//   if (isRoundOver(round)) {
//     roundOverAction(round, io);
//   }
// }

// function roundOverAction(round, io) {
//   setTimeout(
//     () => {
//       console.log("Round Over!");
//       const deadPlayers = calculateRoundResult(round, io);
//       // console.log(`alive players: ${JSON.stringify(getAlivePlayers(), null, 4)}`);
//       deadPlayers.forEach((e) => {
//         if (e === revengeChosen.toString()) {
//           getAlivePlayers().forEach((element) => {
//             if ((element.playerId + 1).toString() === e) {
//               if (
//                 (revengeCard === 1 && element.card1 === "") ||
//                 (revengeCard === 2 && element.card2 === "")
//               ) {
//                 console.log("activate revenger");
//                 activateRevenager();
//               }
//             }
//           });
//         }
//       });
//       updateExistingPlayers();
//       var deadPlayerMessage = "";
//       if (deadPlayers.length === 0) {
//         deadPlayerMessage = "平安夜，没有人死!";
//       } else {
//         const i = Math.floor(Math.random() * 3);
//         if (i === 0) deadPlayerMessage = `玩家${deadPlayers}惨死在血泊中！`;
//         else if (i === 1) deadPlayerMessage = `玩家${deadPlayers}与世长辞！`;
//         else deadPlayerMessage = `玩家${deadPlayers}离我们远去了！`;
//       }
//       const silencedPlayer = getSilencedPlayer(round);
//       var silencedPlayerMessage = "";
//       if (silencedPlayer === "0") {
//         silencedPlayerMessage = "没有人被禁言！";
//       } else {
//         silencedPlayerMessage = `玩家${silencedPlayer}被禁言！`;
//       }
//       io.emit("message", deadPlayerMessage);
//       io.emit("message", silencedPlayerMessage);
//       io.emit("roomUsers", getAlivePlayers());
//       io.emit("updateCurrentCard", getAlivePlayers());
//       if (isBadGuysWon(isPureVillagerExists)) {
//         io.emit("message", "游戏结束！坏人胜利！");
//         resetGlobalVariablesForNewGame();
//       } else if (isGoodGuysWon()) {
//         io.emit("message", "游戏结束！好人胜利！");
//         resetGlobalVariablesForNewGame();
//       } else {
//         // voteblePlayers consists elements of playerId and alreadyVoted flag
//         voteblePlayers = getVotePlayers(deadPlayers);
//         gunablePlayers = [];
//         for (var i = 0; i < voteblePlayers.length; i++) {
//           const playerId = parseInt(voteblePlayers[i].playerId) - 1;
//           const curPlayer = { playerId };
//           gunablePlayers.push(curPlayer);
//         }
//         gunablePlayers.sort((a, b) => a.playerId - b.playerId);

//         var isGunSmithKilled = false;
//         for (var i = 0; i < getAlivePlayers().length; i++) {
//           const currentPlayer = getAlivePlayers()[i];
//           for (var j = 0; j < deadPlayers.length; j++) {
//             if (
//               (currentPlayer.playerId + 1).toString() === deadPlayers[j] &&
//               currentPlayer.card2 === "gunSmith"
//             ) {
//               isGunSmithKilled = true;
//             }
//           }
//         }
//         if (!isGunSmithFired && !isGunSmithKilled) {
//           console.log("gun smith fire option");
//           io.emit("gunSmithVotingRoundAction", {
//             alivePlayers: gunablePlayers,
//             round: round,
//             isVotingRound: true,
//           });
//         }
//         // console.log(`votablePlayers: ${JSON.stringify(gunablePlayers, null, 4)}`);

//         io.emit("votePlayer", {
//           voteThisPlayer: voteblePlayers[0],
//           voteIndex: 0,
//           voteblePlayers: voteblePlayers,
//           round: round,
//           isFirstRoundVoting: isFirstRoundVoting,
//         });
//       }
//     },
//     noKillerPresent ? 10000 : 0
//   );
// }
