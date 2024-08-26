const fs = require("fs");

const {
  initAlivePlayers,
  getAlivePlayers,
  sortAlivePlayers,
} = require("../models/alivePlayers");

const { initRoundAction, getRoundAction } = require("../models/roundActions");

const { initPlayers, getPlayers } = require("../models/players");

const { initAllPlayers, getAllPlayers } = require("../models/allPlayers");

const { proceedToNextNight } = require("../services/inGameService");

const { resetInGameLogicVariables } = require("../repositories/ingameLogicRepository");

// var gameLogicVariables = require("../repositories/gameLogicRepository");

const GameLogicVariables = require('../repositories/gameLogicRepository');

// Declaring global variables
var cards = []; // TODO: need to move this to model or repository layer
var cardsChinese = [];

var gameLogicVariables = new GameLogicVariables();

function getInitialGoodCards() {
  return gameLogicVariables.goodPlayerCardList;
}

function processSelectGoodCard(card, io) {
  if (gameLogicVariables.goodPlayerCardList.includes(card)) {
    const index = gameLogicVariables.goodPlayerCardList.indexOf(card);
    gameLogicVariables.goodPlayerCardList.splice(index, 1);
  } else {
    if (gameLogicVariables.goodPlayerCardList.length < 2) {
      gameLogicVariables.goodPlayerCardList.push(card);
    } else {
    }
  }
  io.emit("displaySelectedCardsEvent", gameLogicVariables.goodPlayerCardList);
}

function processJoinGame(joinGame, socket, io) {
  console.log('processJoinGame playerlength: ', joinGame.numOfPlayers);
  gameLogicVariables.badGuysCombination = joinGame.badIdentities;
  console.log('gameLogicVariables: ', gameLogicVariables);
  if (joinGame.socketId == null) {
    console.log('joinGame.socketId is null')
    if (gameLogicVariables.playerLength === "0") {
      gameLogicVariables.playerLength = joinGame.numOfPlayers;
    }
    console.log('gameLogicVariables: ', gameLogicVariables);
    const player = playerJoin(
      socket.id,
      joinGame.username,
      gameLogicVariables.playerLength
    );
    gameLogicVariables.isNewGame = false;
    if (player == null) {
      socket.emit(
        "message",
        "Speculator mode. Please wait for game to finish."
      );
      socket.emit("roomUsers", getAllPlayers());
    } else {
      socket.emit("showIdentity", player);
      getAllPlayers().push(player);
      io.emit("roomUsers", getAllPlayers());
    }
  } else {
    // I don't think refresh is working...
    // var isRefreshedPlayerReady = false;
    // console.log(`socket.id: ${socket.id}`);
    // console.log(`socketId: ${joinGame.socketId}`);
    // getAlivePlayers().forEach(e => {
    //     if (e.id === joinGame.socketId) {
    //         console.log('found refresh player after ready');
    //         e.id = socket.id;
    //         // show identity again and update the socketId in session storage in client side
    //         socket.emit('showIdentity', e);
    //         isRefreshedPlayerReady = true;
    //         var role = updateSocketRoomRole(io, e);
    //         if (joinGame.state==="votePlayer") {
    //             socket.emit('votePlayer', ({
    //                 voteThisPlayer: voteblePlayers[joinGame.voteIndex],
    //                 voteIndex: joinGame.voteIndex,
    //                 voteblePlayers: voteblePlayers,
    //                 round: round,
    //                 isFirstRoundVoting: isFirstRoundVoting
    //             }));
    //         }
    //     }
    // });
    // if (!isRefreshedPlayerReady) {
    //     console.log('found refresh player before ready');
    //     console.log(allPlayers.length);
    //     allPlayers.forEach(e => {
    //         if (e.id===joinGame.socketId) {
    //             e.id = socket.id;
    //             socket.emit('showIdentity', e);
    //         }
    //     });
    // }
  }
}

function playerJoin(id, username, playerLength) {
  console.log('playerLength: ', playerLength);
  if (gameLogicVariables.isNewGame) {
    var cardConfig;
    var cardConfigFilePath;
    if (playerLength === "7") {
      console.log("7 player version");
      // TODO: need to dynamically populate good guy cards
      if (gameLogicVariables.badIdentities === "1") {
        cardConfigFilePath = "src/resources/cardsSevenPlayerVersion1.json";
      } else {
        cardConfigFilePath = "src/resources/cardsSevenPlayerVersion2.json";
      }
    } else {
      console.log("6 player version");
      cardConfigFilePath = "src/resources/cardsSixPlayerVersion.json";
    }
    const rawData = fs.readFileSync(cardConfigFilePath);
    cardConfig = JSON.parse(rawData);
    cards = cardConfig.cards;
    cardsChinese = cardConfig.cardsChinese;

    initAlivePlayers();
    // resetInGameLogicVariables();
    initPlayers();
    initAllPlayers();
  }
  if (getPlayers().length >= playerLength) {
    console.log(`more than ${playerLength} players joined`);
    return null;
  }
  return assignPlayer(id, username, cardsChinese);
}

function assignPlayer(id, username, cardsChinese) {
  // get first card
  const i = Math.floor(Math.random() * (cards.length - 1));
  const card1 = cards[i];
  const card1Chinese = cardsChinese[i];
  cards.splice(i, 1);
  cardsChinese.splice(i, 1);
  // get second card
  const j = Math.floor(Math.random() * (cards.length - 1));
  // const j =0;
  const card2 = cards[j];
  const card2Chinese = cardsChinese[j];
  cards.splice(j, 1);
  cardsChinese.splice(j, 1);

  const side = getPlayerSide(card1, card2);
  const poison = 0;
  const playerId = getPlayers().length;
  const numOfVotes = 0;
  const voting = 0;
  const isPureVillager = card1 === "villager" && card2 === "villager";
  const isReady = false;

  const player = {
    id,
    username,
    card1,
    card2,
    card1Chinese,
    card2Chinese,
    side,
    poison,
    playerId,
    numOfVotes,
    voting,
    isPureVillager,
    isReady,
  };

  getPlayers().push(player);
  return player;
}

function getPlayerSide(card1, card2) {
  let map = new Map();
  map.set("killer", -4);
  map.set("revenger", -4);
  map.set("bioChemist", -4);
  map.set("police", 3);
  map.set("silencer", -2);
  map.set("doctor", 1);
  map.set("gunSmith", 1);
  map.set("villager", 0);
  return map.get(card1) + map.get(card2);
}

function processPlayerReady(currentPlayer, socket, io) {
  playerReady(socket.id, currentPlayer);

  getAllPlayers().forEach((e) => {
    if (e.id === currentPlayer.id) e.isReady = true;
  });
  io.emit("playerReadyCheckmark", getAllPlayers());
  if (getAlivePlayers().length == gameLogicVariables.playerLength) {
    sortAlivePlayers();
    getAlivePlayers().forEach((e) => {
      console.log(`Player ${e.playerId + 1} identity: ${e.card1}, ${e.card2}`);
      if (e.isPureVillager) {
        gameLogicVariables.isPureVillagerExists = true;
      }
    });
    proceedToNextNight(io);
  }
}

function playerReady(currentPlayer) {
  currentPlayer.isReady = true;
  getAlivePlayers().push(currentPlayer);
}

module.exports = {
  processJoinGame,
  processPlayerReady,
  processSelectGoodCard,
  getInitialGoodCards,
};
