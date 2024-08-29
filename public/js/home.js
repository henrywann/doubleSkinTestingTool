const socket = io();
const goodCardsSelected = document.getElementById('goodCards');

socket.on("connect", () => {
    console.log(socket.id);
    socket.emit('initialGoodCards');
});

socket.on('displaySelectedCardsEvent', goodPlayerCardList => {
    displaySelectedCards(goodPlayerCardList);
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