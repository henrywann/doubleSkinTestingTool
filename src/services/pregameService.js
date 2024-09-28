const fs = require("fs");

const { initAlivePlayers, getAlivePlayers, sortAlivePlayers } = require("../models/alivePlayers");

const { initPlayers, getPlayers } = require("../models/players");

const { initAllPlayers, getAllPlayers } = require("../models/allPlayers");

const GameLogicVariables = require("../repositories/gameLogicRepository");
var gameLogicVariables = new GameLogicVariables();

// Declaring global variables
var cards = []; // TODO: need to move this to model or repository layer
var cardsChinese = [];

function getGameLogicVariables() {
  return gameLogicVariables;
}

function resetPreGameLogicVariables() {
  gameLogicVariables = new GameLogicVariables();
}

function getGoodCards() {
  return gameLogicVariables.goodPlayerCardList;
}

function getBadCards() {
  return gameLogicVariables.badPlayerCardList;
}

function getInitialNumberOfPlayers() {
  return gameLogicVariables.numberOfPlayers;
}

function getInitialBadIdentities() {
  return gameLogicVariables.badIdentities;
}

function processIsAnyoneJoinedGame() {
  return gameLogicVariables.playerLength !== "0";
}

function processSelectNumberOfPlayers(numOfPlayers) {
  gameLogicVariables.numberOfPlayers = numOfPlayers;
}

function processSelectBadIdentities(badIdentities) {
  gameLogicVariables.badIdentities = badIdentities;
}

function processSelectGoodCard(card, io) {
  if (gameLogicVariables.goodPlayerCardList.includes(card)) {
    const index = gameLogicVariables.goodPlayerCardList.indexOf(card);
    gameLogicVariables.goodPlayerCardList.splice(index, 1);
  } else {
    if (gameLogicVariables.goodPlayerCardList.length < 5) {
      gameLogicVariables.goodPlayerCardList.push(card);
    }
  }
  const totalNumberOfSelectedCards =
    gameLogicVariables.goodPlayerCardList.length + gameLogicVariables.badPlayerCardList.length;
  io.emit("displaySelectedCardsEvent", {
    goodPlayerCardList: gameLogicVariables.goodPlayerCardList,
    totalNumberOfSelectedCards: totalNumberOfSelectedCards,
  });
}

function processSelectBadCard(card, io) {
  if (gameLogicVariables.badPlayerCardList.includes(card)) {
    const index = gameLogicVariables.badPlayerCardList.indexOf(card);
    gameLogicVariables.badPlayerCardList.splice(index, 1);
  } else {
    if (gameLogicVariables.badPlayerCardList.length < 3) {
      gameLogicVariables.badPlayerCardList.push(card);
    }
  }
  const totalNumberOfSelectedCards =
    gameLogicVariables.goodPlayerCardList.length + gameLogicVariables.badPlayerCardList.length;
  io.emit("displaySelectedBadCardsEvent", {
    badPlayerCardList: gameLogicVariables.badPlayerCardList,
    totalNumberOfSelectedCards: totalNumberOfSelectedCards,
  });
}

function processJoinGame(joinGame, socket, io) {
  console.log("processJoinGame playerlength: ", joinGame.numOfPlayers);
  console.log("gameLogicVariables: ", gameLogicVariables);
  if (joinGame.socketId == null) {
    console.log("joinGame.socketId is null");
    if (gameLogicVariables.playerLength === "0") {
      gameLogicVariables.playerLength = joinGame.numOfPlayers;
    }
    console.log("gameLogicVariables: ", gameLogicVariables);
    const player = playerJoin(socket.id, joinGame.username, gameLogicVariables.playerLength);
    gameLogicVariables.isNewGame = false;
    if (player == null) {
      socket.emit("message", "Speculator mode. Please wait for game to finish.");
      socket.emit("roomUsers", getAllPlayers());
    } else {
      socket.emit("showIdentity", player);
      getAllPlayers().push(player);
      io.emit("roomUsers", getAllPlayers());
    }
  } 
}

function playerJoin(id, username, playerLength) {
  console.log("playerLength: ", playerLength);
  if (gameLogicVariables.isNewGame) {
    if (playerLength === "7") {
      console.log("7 player version");
      let baseCardConfigFilePath = "src/resources/cardsSevenPlayerBase.json";
      let rawData = fs.readFileSync(baseCardConfigFilePath);
      let cardConfig = JSON.parse(rawData);
      cards = cardConfig.cards.concat(gameLogicVariables.goodPlayerCardList, gameLogicVariables.badPlayerCardList);
      cards = cards.map(card => {
        if (card === "killer1" || card === "killer2") {
          return "killer";
        }
        if (card === "police1" || card === "police2") {
          return "police";
        }
        return card;
      });

      let goodPlayerCardListChinese = translateUserSelectedCardsToChinese(gameLogicVariables.goodPlayerCardList);
      let badPlayerCardListChinese = translateUserSelectedCardsToChinese(gameLogicVariables.badPlayerCardList);
      cardsChinese = cardConfig.cardsChinese.concat(goodPlayerCardListChinese, badPlayerCardListChinese);
      console.log("card deck: ", cards);
      console.log("card deck Chinese: ", cardsChinese);
    } else {
      console.log("6 player version");
      let cardConfigFilePath = "src/resources/cardsSixPlayerVersion.json";
      const rawData = fs.readFileSync(cardConfigFilePath);
      let cardConfig = JSON.parse(rawData);
      cards = cardConfig.cards;
      cardsChinese = cardConfig.cardsChinese;
      console.log("card deck: ", cards);
      console.log("card deck Chinese: ", cardsChinese);
    }

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

function translateUserSelectedCardsToChinese(cardList) {
  return cardList.map(card => {
    if (card === "killer1" || card === "killer2") {
      return "杀手";
    } else if (card === "police1" || card === "police2") {
      return "警察";
    } else if (card === "revenger") {
      return "复仇者";
    } else if (card === "bioChemist") {
      return "生化学家";
    } else if (card === "silencer") {
      return "禁言";
    } else if (card === "doctor") {
      return "医生";
    } else if (card === "gunSmith") {
      return "Gun Smith";
    } else if (card === "turtle") {
      return "乌龟";
    } else if (card === "priest") {
      return "牧师";
    } else if (card === "engineer") {
      return "工兵";
    } else if (card === "judge") {
      return "法官";
    } else if (card === "villager") {
      return "平民";
    }
    return card;
  });
}

function assignPlayer(id, username, cardsChinese) {
  // get first card
  const i = Math.floor(Math.random() * cards.length);
  const card1 = cards[i];
  const cardToBeRevived = card1;
  const card1Chinese = cardsChinese[i];
  const isRevived = false;
  cards.splice(i, 1);
  cardsChinese.splice(i, 1);
  // get second card
  const j = Math.floor(Math.random() * cards.length);
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
    isRevived,
    cardToBeRevived,
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
  map.set("turtle", 1);
  map.set("priest", 1);
  return map.get(card1) + map.get(card2);
}

function processPlayerReady(currentPlayer, socket, io) {
  playerReady(currentPlayer);

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
    return true;
  }
  return false;
}

function playerReady(currentPlayer) {
  currentPlayer.isReady = true;
  currentPlayer.cardToBeRevived = currentPlayer.card1;
  getAlivePlayers().push(currentPlayer);
}

module.exports = {
  getGameLogicVariables,
  resetPreGameLogicVariables,
  processJoinGame,
  processPlayerReady,
  processIsAnyoneJoinedGame,
  processSelectNumberOfPlayers,
  processSelectBadIdentities,
  processSelectGoodCard,
  processSelectBadCard,
  getGoodCards,
  getBadCards,
  getInitialNumberOfPlayers,
  getInitialBadIdentities,
};
