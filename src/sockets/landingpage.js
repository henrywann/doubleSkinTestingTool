const socketio = require("socket.io");
var io;

const { initAlivePlayers, getAlivePlayers } = require("../models/alivePlayers");

const {
  resetPreGameLogicVariables,
  processJoinGame,
  processPlayerReady,
  processSelectGoodCard,
  getInitialGoodCards,
  getInitialNumberOfPlayers,
  getInitialBadIdentities,
  processIsAnyoneJoinedGame,
  processSelectNumberOfPlayers,
  processSelectBadIdentities,
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
  processRevivePlayer,
  processRetractSelected,
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
      io.emit("disableGameSelections");
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

    socket.on("isAnyoneJoinedGame", () => {
      console.log("checking isAnyoneJoinedGame");
      if (processIsAnyoneJoinedGame()) {
        io.emit("disableGameSelections");
      }
    });

    socket.on("initialNumberOfPlayers", () => {
      console.log("returning initialNumberOfPlayers");
      const initialNumberOfPlayers = getInitialNumberOfPlayers();
      io.emit("displaySelectedNumberOfPlayers", initialNumberOfPlayers);
    });

    socket.on("initialBadIdentities", () => {
      console.log("returning initialBadIdentities");
      const initialBadIdentities = getInitialBadIdentities();
      io.emit("displaySelectedBadIdentities", initialBadIdentities);
    });

    socket.on("selectGoodCard", (card) => {
      processSelectGoodCard(card, io);
    });

    socket.on("selectNumberOfPlayers", (numOfPlayers) => {
      processSelectNumberOfPlayers(numOfPlayers);
      io.emit("displaySelectedNumberOfPlayers", numOfPlayers);
    });

    socket.on("selectedBadIdentities", (badIdentities) => {
      processSelectBadIdentities(badIdentities);
      io.emit("displaySelectedBadIdentities", badIdentities);
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

    socket.on("verifyKillPlayer", (playerIdTriggeredEvent, playerIdBeingKilled) => {
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

    socket.on("revivePlayer", ({ playerId }) => {
      processRevivePlayer(playerId, io);
      io.emit("reviveComplete", {
        playerId: playerId,
        alivePlayers: getAlivePlayers(),
        round: getRound(),
      });
      if (isRoundOver()) {
        roundOverAction(io);
      }
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

    socket.on("retractSelected", ({ currentPlayerId, isRetracted }) => {
      processRetractSelected(currentPlayerId, isRetracted);
      io.emit("retractComplete", {
        isRetracted: isRetracted,
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

