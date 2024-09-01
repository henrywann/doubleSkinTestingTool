const socket = io();
const goodCardsSelected = document.getElementById("goodCards");
const numberOfPlayersSelectedDropDown = document.getElementById("numOfPlayers");
const badIdentitiesSelectedDropDown = document.getElementById("badIdentities");

socket.on("connect", () => {
  console.log(socket.id);
  socket.emit("initialGoodCards");
  socket.emit("initialNumberOfPlayers");
  socket.emit("initialBadIdentities");
  socket.emit("isAnyoneJoinedGame");
});

socket.on("disableGameSelections", () => {
    badIdentitiesSelectedDropDown.disabled = true;
    numberOfPlayersSelectedDropDown.disabled = true;
});

socket.on("displaySelectedCardsEvent", (goodPlayerCardList) => {
  displaySelectedCards(goodPlayerCardList);
});

socket.on("displaySelectedNumberOfPlayers", (numberOfPlayers) => {
  displayNumberOfPlayersFromDropDown(numberOfPlayers);
});

socket.on("displaySelectedBadIdentities", (badIdentities) => {
  displayBadIdentitiesFromDropDown(badIdentities);
});

function selectCard(card) {
  socket.emit("selectGoodCard", card);
}

function displaySelectedCards(selectedCardList) {
  goodCardsSelected.innerHTML = "";
  selectedCardList.forEach((card) => {
    const li = document.createElement("li");
    li.innerText = card;
    goodCardsSelected.appendChild(li);
  });
}

function selectNumberOfPlayersFromDropDown() {
  var text =
    numberOfPlayersSelectedDropDown.options[numberOfPlayersSelectedDropDown.selectedIndex].text;
  socket.emit("selectNumberOfPlayers", text);
}

function displayNumberOfPlayersFromDropDown(numberOfPlayers) {
  numberOfPlayersSelectedDropDown.value = numberOfPlayers;
  if (numberOfPlayers === "7") {
    badIdentitiesSelectedDropDown.disabled = false;
  } else {
    badIdentitiesSelectedDropDown.disabled = true;
  }
}

function selectBadIdentitiesFromDropDown() {
  var value = badIdentitiesSelectedDropDown.value;
  socket.emit("selectedBadIdentities", value);
}

function displayBadIdentitiesFromDropDown(badIdentities) {
  badIdentitiesSelectedDropDown.value = badIdentities;
}
