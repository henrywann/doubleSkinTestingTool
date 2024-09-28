const socket = io();
const goodCardsSelected = document.getElementById("goodCards");
const badCardsSelected = document.getElementById("badCards");
const startGameBtn = document.getElementById("startGame");
const numberOfPlayersSelectedDropDown = document.getElementById("numOfPlayers");

socket.on("connect", () => {
  console.log(socket.id);
  socket.emit("initialGoodCards");
  socket.emit("initialBadCards");
  socket.emit("initialNumberOfPlayers");
  socket.emit("initialBadIdentities");
  socket.emit("isAnyoneJoinedGame");
});

socket.on("disableGameSelections", ({ goodPlayerCardList, badPlayerCardList, numberOfPlayers }) => {
  startGameBtn.disabled = false;
  numberOfPlayersSelectedDropDown.disabled = true;
  disableAllCardsButtons();
  displayAllSelectedCards(goodPlayerCardList, badPlayerCardList, numberOfPlayers);
});

socket.on("displaySelectedCardsEvent", ({ goodPlayerCardList, totalNumberOfSelectedCards }) => {
  displaySelectedCards(goodPlayerCardList, goodCardsSelected);
  enableStartGameButton(totalNumberOfSelectedCards);
});

socket.on("displaySelectedBadCardsEvent", ({ badPlayerCardList, totalNumberOfSelectedCards }) => {
  displaySelectedCards(badPlayerCardList, badCardsSelected);
  enableStartGameButton(totalNumberOfSelectedCards);
});

socket.on("displaySelectedNumberOfPlayers", (numberOfPlayers) => {
  displayNumberOfPlayersFromDropDown(numberOfPlayers);
});

function selectGoodCard(card) {
  socket.emit("selectGoodCard", card);
}

function selectBadCard(card) {
  socket.emit("selectBadCard", card);
}

function displaySelectedCards(selectedCardList, cardsSelected) {
  cardsSelected.innerHTML = "";
  selectedCardList.forEach((card) => {
    const li = document.createElement("li");
    li.innerText = card;
    cardsSelected.appendChild(li);
  });
}

function displayAllSelectedCards(goodPlayerCardList, badPlayerCardList, numberOfPlayers) {
  if (numberOfPlayers === "7") {
    displaySelectedCards(goodPlayerCardList, goodCardsSelected);
    displaySelectedCards(badPlayerCardList, badCardsSelected);
  } else {
    displaySelectedCards([], goodCardsSelected);
    displaySelectedCards([], badCardsSelected);
  }
}

function selectNumberOfPlayersFromDropDown() {
  var numOfPlayers = numberOfPlayersSelectedDropDown.options[numberOfPlayersSelectedDropDown.selectedIndex].text;
  socket.emit("selectNumberOfPlayers", numOfPlayers);
  displayNumberOfPlayersFromDropDown(numOfPlayers);
}

function displayNumberOfPlayersFromDropDown(numberOfPlayers) {
  numberOfPlayersSelectedDropDown.value = numberOfPlayers;
  numberOfPlayersSelectedDropDown.disabled = false;
  if (numberOfPlayers === "7") {
    startGameBtn.disabled = true;
    enableAllCardsButtons();
    console.log("emitting initialGoodCards");
    socket.emit("initialGoodCards");
    socket.emit("initialBadCards");
  } else {
    startGameBtn.disabled = false;
    displaySelectedCards([], goodCardsSelected);
    displaySelectedCards([], badCardsSelected);
    disableAllCardsButtons();
  }
}

function enableStartGameButton(totalNumberOfSelectedCards) {
  if (numberOfPlayersSelectedDropDown.options[numberOfPlayersSelectedDropDown.selectedIndex].text === "6") {
    startGameBtn.disabled = false;
  } else if (totalNumberOfSelectedCards === 8) {
    startGameBtn.disabled = false;
  } else {
    startGameBtn.disabled = true;
  }
}

function disableAllCardsButtons() {
  document.getElementById("selectKiller1Card").disabled = true;
  document.getElementById("selectKiller2Card").disabled = true;
  document.getElementById("selectRevengerCard").disabled = true;
  document.getElementById("selectBioChemistCard").disabled = true;
  document.getElementById("selectPolice1Card").disabled = true;
  document.getElementById("selectPolice2Card").disabled = true;
  document.getElementById("selectGunSmithCard").disabled = true;
  document.getElementById("selectTurtleCard").disabled = true;
  document.getElementById("selectPriestCard").disabled = true;
  document.getElementById("selectEngineerCard").disabled = true;
  document.getElementById("selectJudgeCard").disabled = true;
  document.getElementById("selectVillagerCard").disabled = true;
  document.getElementById("selectSilencerCard").disabled = true;
  document.getElementById("selectDoctorCard").disabled = true;
}

function enableAllCardsButtons() {
  document.getElementById("selectKiller1Card").disabled = false;
  document.getElementById("selectKiller2Card").disabled = false;
  document.getElementById("selectRevengerCard").disabled = false;
  document.getElementById("selectBioChemistCard").disabled = false;
  document.getElementById("selectPolice1Card").disabled = false;
  document.getElementById("selectPolice2Card").disabled = false;
  document.getElementById("selectGunSmithCard").disabled = false;
  document.getElementById("selectTurtleCard").disabled = false;
  document.getElementById("selectPriestCard").disabled = false;
  document.getElementById("selectEngineerCard").disabled = false;
  document.getElementById("selectJudgeCard").disabled = false;
  document.getElementById("selectVillagerCard").disabled = false;
  document.getElementById("selectSilencerCard").disabled = false;
  document.getElementById("selectDoctorCard").disabled = false;
}
