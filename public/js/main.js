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

socket.on('doctorAction', alivePlayers => {
    outputDoctorSelection(alivePlayers);
});

socket.on('gunSmithAction', alivePlayers => {
    outputGunSmithSelection(alivePlayers);
});

socket.on('gunComplete', ({playerId, alivePlayers}) => {
    console.log('received gunComplete');
    var i;
    for (i=0; i<alivePlayers.length; i++) {
        const btnId = `gunSmith${i+1}`;
        var btn = document.getElementById(btnId);
        btn.disabled = true;
    }
    var noGunBtn = document.getElementById('noGun');
    noGunBtn.disabled = true;
    if (playerId!=='0') {
        alert(`Gunned Player ${playerId}!`);
    }
});

socket.on('injectComplete', ({playerId, alivePlayers}) => {
    console.log('received injectComplete');
    var i;
    for (i=0; i<alivePlayers.length; i++) {
        const btnId = `doctor${i+1}`;
        var btn = document.getElementById(btnId);
        btn.disabled = true;
    }
    alert(`Injected Player ${playerId}!`);
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
    alivePlayers.forEach(e => {
        if (e.playerId === playerId-1) {
            const currentCard = e.card1 === '' ? e.card2: e.card1;
            const currentId = currentCard ==='killer'? 'Bad': 'Good';
            alert(`Player ${playerId}'s Current Identity is ${currentId}`);
        }
    });
});

socket.on('votePlayer', votePlayers => {
    const playerTobeVoted = votePlayers[0];
    outputVoteSelection(playerTobeVoted);
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

function outputVoteSelection(playerTobeVoted) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="text">Do you want to vote player ${playerTobeVoted}<p>`;
    div.insertAdjacentHTML('beforeEnd',`<button id="voteYes${playerTobeVoted}" onclick="voteYes(${playerTobeVoted}); 
                                        this.disabled=true; voteNo${playerTobeVoted}.disabled=true"> YES </button>
                                        <button id="voteNo${playerTobeVoted}" onclick="voteNo(${playerTobeVoted});
                                        this.disabled=true; voteYes${playerTobeVoted}.disabled=true"> NO </button>`);
    document.querySelector('.chat-messages').appendChild(div);
}

function voteYes(player) {
    alert(`Voted Yes for Player ${player}`);
}

function voteNo(player) {
    alert(`Voted No for Player ${player}`);
}

function outputGunSmithSelection(alivePlayers) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p class="text">Gun Smith Please Select a player<p>';
    // document.querySelector('.chat-messages').appendChild(div);
    alivePlayers.forEach(e =>{
        div.insertAdjacentHTML('beforeEnd', `<button id="gunSmith${e.playerId+1}">${e.playerId+1}</button>`);
    });
    div.insertAdjacentHTML('beforeEnd', `<button id="noGun">No Gun </button>`);
    document.querySelector('.chat-messages').appendChild(div);

    var gunSmithBtn1 = document.getElementById("gunSmith1");
    gunSmithBtn1.addEventListener("click", function() {
        gunPlayer('1');
    });

    var gunSmithBtn2 = document.getElementById("gunSmith2");
    gunSmithBtn2.addEventListener("click", function() {
        gunPlayer('2');
    });

    var gunSmithBtn3 = document.getElementById("gunSmith3");
    gunSmithBtn3.addEventListener("click", function() {
        gunPlayer('3');
    });

    var gunSmithBtn4 = document.getElementById("gunSmith4");
    gunSmithBtn4.addEventListener("click", function() {
        gunPlayer('4');
    });

    var gunSmithBtn5 = document.getElementById("gunSmith5");
    gunSmithBtn5.addEventListener("click", function() {
        gunPlayer('5');
    });

    var gunSmithBtn6 = document.getElementById("gunSmith6");
    gunSmithBtn6.addEventListener("click", function() {
        gunPlayer('6');
    });

    var gunSmithBtn7 = document.getElementById("noGun");
    gunSmithBtn7.addEventListener("click", function() {
        gunPlayer('0');
    });
}

function outputDoctorSelection(alivePlayers) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p class="text">Doctor Please Select a player<p>';
    // document.querySelector('.chat-messages').appendChild(div);
    alivePlayers.forEach(e =>{
        div.insertAdjacentHTML('beforeEnd', `<button id="doctor${e.playerId+1}">${e.playerId+1}</button>`);
    });
    document.querySelector('.chat-messages').appendChild(div);

    var doctorBtn1 = document.getElementById("doctor1");
    doctorBtn1.addEventListener("click", function() {
        injectPlayer('1');
    });

    var doctorBtn2 = document.getElementById("doctor2");
    doctorBtn2.addEventListener("click", function() {
        injectPlayer('2');
    });

    var doctorBtn3 = document.getElementById("doctor3");
    doctorBtn3.addEventListener("click", function() {
        injectPlayer('3');
    });

    var doctorBtn4 = document.getElementById("doctor4");
    doctorBtn4.addEventListener("click", function() {
        injectPlayer('4');
    });

    var doctorBtn5 = document.getElementById("doctor5");
    doctorBtn5.addEventListener("click", function() {
        injectPlayer('5');
    });

    var doctorBtn6 = document.getElementById("doctor6");
    doctorBtn6.addEventListener("click", function() {
        injectPlayer('6');
    });
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

function injectPlayer(injectedPlayer) {
    socket.emit('injectPlayer', injectedPlayer);
}

function checkPlayer(alivePlayers, checkedPlayerId) {
    socket.emit('checkPlayer', checkedPlayerId);
}

function killPlayer(playerId) {
    socket.emit('killPlayer', playerId);
}

function gunPlayer(playerId) {
    socket.emit('gunPlayer', playerId);
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