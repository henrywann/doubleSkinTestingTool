const socket = io();
const goodCardsSelected = document.getElementById('goodCards');
const numberOfPlayersSelected = document.getElementById('numOfPlayers');

socket.on("connect", () => {
    console.log(socket.id);
    socket.emit('initialGoodCards');
});

socket.on('displaySelectedCardsEvent', goodPlayerCardList => {
    displaySelectedCards(goodPlayerCardList);
});

socket.on('displaySelectedNumberOfPlayers', numberOfPlayers => {
    displayNumberOfPlayers(numberOfPlayers);
});

function selectCard(card) {
    socket.emit('selectGoodCard', card);
}

function displaySelectedCards(selectedCardList) {
    goodCardsSelected.innerHTML = '';
    selectedCardList.forEach(card => {
        const li = document.createElement('li');
        li.innerText = card;
        goodCardsSelected.appendChild(li);
    });
}

function selectNumberOfPlayers(numberOfPlayers) {
    socket.emit('selectNumberOfPlayers', numberOfPlayers);
}

function displayNumberOfPlayers(numberOfPlayers) {
    numberOfPlayersSelected.innerHTML = '';
    var option = document.createElement('option');
    option.innerText = numberOfPlayers;
    option.setAttribute('value', numberOfPlayers);
    numberOfPlayersSelected.appendChild(option);
}