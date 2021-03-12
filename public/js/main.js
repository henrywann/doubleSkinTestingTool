const chatForm = document.getElementById('chat-form');
const socket = io();
var currentPlayer;
var switchOrder = document.getElementById("switchOrder");
switchOrder.addEventListener("click", clickSwitchOrder);
const ready = document.getElementById("ready");
ready.addEventListener("click", readyToPlay);

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});
// Join chatroom
socket.emit('joinGame', { username });

// Display player cards
socket.on('showIdentity', player => {
    outputIdentity(player);
});

// Switch player card order
socket.on('switchOrder', player => {
    switchOrder(player);
});

socket.on('message', message => {
    console.log(`Incoming message: ${message}`);
    outputMessage(message);
});

socket.on('killerAction', alivePlayers => {
    console.log(alivePlayers);
    outputKillerSelection(alivePlayers);
});

socket.on('policeAction', alivePlayers => {
    console.log("police action");
    outputPoliceSelection(alivePlayers);
});

socket.on('killComplete', ({playerId, alivePlayers}) => {
    console.log('received killComplete');
    var i;
    for (i=0; i<alivePlayers.length; i++) {
        const btnId = `kill${i+1}`;
        var btn = document.getElementById(btnId);
        btn.disabled = true;
    }
    alert(`Killed Player ${playerId}!`);
});

socket.on('checkComplete', ({playerId, alivePlayers}) => {
    console.log('received checkComplete');
    var i;
    for (i=0; i<alivePlayers.length; i++) {
        const btnId = `police${i+1}`;
        var btn = document.getElementById(btnId);
        btn.disabled = true;
    }
    alert(`Killed Player ${playerId}!`);
});

// Message submit
chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const msg = e.target.elements.msg.value;
    socket.emit('chatMessage', msg);
});

function outputIdentity(player) {
    currentPlayer = player;
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML =`<p class="meta">Brad <span>9:12pm</span></p>
    <p class="text">
        card1: ${player.card1}
        card2: ${player.card2}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

function outputPoliceSelection(alivePlayers) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p class="text">Police Please Select a player<p>';
    // document.querySelector('.chat-messages').appendChild(div);
    alivePlayers.forEach(e =>{
        // console.log(e);
        div.insertAdjacentHTML('beforeEnd', `<button id="police${e.playerId+1}">${e.playerId+1}</button>`);
    });
    document.querySelector('.chat-messages').appendChild(div);

    var policeBtn1 = document.getElementById("police1");
    policeBtn1.addEventListener("click", function() {
        checkPlayer(alivePlayers, '1');
    });

    var policeBtn2 = document.getElementById("police2");
    policeBtn2.addEventListener("click", function() {
        checkPlayer(alivePlayers, '2');
    });

    var policeBtn3 = document.getElementById("police3");
    policeBtn3.addEventListener("click", function() {
        checkPlayer(alivePlayers, '3');
    });

    var policeBtn4 = document.getElementById("police4");
    policeBtn4.addEventListener("click", function() {
        checkPlayer(alivePlayers, '4');
    });

    var policeBtn5 = document.getElementById("police5");
    policeBtn5.addEventListener("click", function() {
        checkPlayer(alivePlayers, '5');
    });

    var policeBtn6 = document.getElementById("police6");
    policeBtn6.addEventListener("click", function() {
        checkPlayer(alivePlayers, '6');
    });
}

function outputKillerSelection(alivePlayers) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p class="text">Killer Please kill a player<p>';
    // document.querySelector('.chat-messages').appendChild(div);
    alivePlayers.forEach(e =>{
        // console.log(e);
        div.insertAdjacentHTML('beforeEnd', `<button id="kill${e.playerId+1}">${e.playerId+1}</button>`);
    });
    document.querySelector('.chat-messages').appendChild(div);

    var killBtn1 = document.getElementById("kill1");
    killBtn1.addEventListener("click", function() {
        killPlayer('1');
    });

    var killBtn2 = document.getElementById("kill2");
    killBtn2.addEventListener("click", function() {
        killPlayer('2');
    });

    var killBtn3 = document.getElementById("kill3");
    killBtn3.addEventListener("click", function() {
        killPlayer('3');
    });

    var killBtn4 = document.getElementById("kill4");
    killBtn4.addEventListener("click", function() {
        killPlayer('4');
    });

    var killBtn5 = document.getElementById("kill5");
    killBtn5.addEventListener("click", function() {
        killPlayer('5');
    });

    var killBtn6 = document.getElementById("kill6");
    killBtn6.addEventListener("click", function() {
        killPlayer('6');
    });
}

function checkPlayer(alivePlayers, checkedPlayerId) {
    alivePlayers.forEach(e => {
        if (e.playerId === checkedPlayerId-1) {
            const currentCard = e.card1 === '' ? e.card2: e.card1;
            const currentId = currentCard ==='killer'? 'Bad': 'Good';
            alert(`Player ${checkedPlayerId}'s Current Identity is ${currentId}`);
            break;
        }
    });
    socket.emit('checkPlayer', checkedPlayerId);
}

function killPlayer(playerId) {
    socket.emit('killPlayer', playerId);
}

function killPlayer1() {
    console.log('killing player 1');
    socket.emit('killPlayer', '1');

    // alivePlayers.forEach(e => {
    //     if (e.playerId+1===playerId) {
    //         if (e.card1!=='') {
    //             e.card1='';
    //         } else if (e.card2!=='') {
    //             e.card2='';
    //         }
    //     }
    // });
}

function clickSwitchOrder() {
    console.log("switching order");
    var temp = currentPlayer.card1;
    currentPlayer.card1 = currentPlayer.card2;
    currentPlayer.card2 = temp;
    outputIdentity(currentPlayer);
}

function readyToPlay() {
    document.querySelector('#switchOrder').disabled = true;
    document.querySelector('#ready').disabled = true;
    console.log(currentPlayer);
    socket.emit('playerReady', currentPlayer);
}

function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML =`<p class="meta">Brad <span>9:12pm</span></p>
    <p class="text">
        ${message}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}