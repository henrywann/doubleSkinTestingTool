const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const socket = io();
const userList = document.getElementById('users');
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

socket.on('roomUsers', users => {
    console.log('roomUsers');
    outputUsers(users);
});

// Displays player typed messages
socket.on('playerChatmessage', ({message, playername, playerId}) => {
    console.log(`Incoming message: ${message} ${playername} ${playerId}`);
    outputPlayerChatMessage(message, playername, playerId);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

// Displays game messages
socket.on('message', message => {
    console.log(`Incoming message: ${message}`);
    outputMessage(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('killerAction', ({alivePlayers, round}) => {
    console.log(alivePlayers);
    outputKillerSelection(alivePlayers, round);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('policeAction', ({alivePlayers, round}) => {
    console.log("police action");
    outputPoliceSelection(alivePlayers, round);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('doctorAction', ({alivePlayers, round}) => {
    outputDoctorSelection(alivePlayers, round);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('gunSmithAction', ({alivePlayers, round}) => {
    outputGunSmithSelection(alivePlayers, round);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

socket.on('gunComplete', ({playerId, alivePlayers, round}) => {
    console.log('received gunComplete');
    alivePlayers.forEach(e => {
        document.getElementById(`gunSmith${e.playerId+1}-${round}`).disabled = true;
    });
    var noGunBtn = document.getElementById(`noGun-${round}`);
    noGunBtn.disabled = true;
    if (playerId!=='0') {
        alert(`Gunned Player ${playerId}!`);
    }
});

socket.on('injectComplete', ({playerId, alivePlayers, round}) => {
    console.log('received injectComplete');
    alivePlayers.forEach(e => {
        document.getElementById(`doctor${e.playerId+1}-${round}`).disabled = true;
    });
    alert(`Injected Player ${playerId}!`);
});


socket.on('killComplete', ({playerId, alivePlayers, round}) => {
    console.log('received killComplete');
    alivePlayers.forEach(e => {
        document.getElementById(`kill${e.playerId+1}-${round}`).disabled = true;
    });
    alert(`Killed Player ${playerId}!`);
});

socket.on('checkComplete', ({playerId, alivePlayers, round}) => {
    console.log('received checkComplete');
    alivePlayers.forEach(e => {
        document.getElementById(`police${e.playerId+1}-${round}`).disabled = true;
    });
    alivePlayers.forEach(e => {
        if (e.playerId === playerId-1) {
            const currentCard = e.card1 === '' ? e.card2: e.card1;
            const currentId = currentCard ==='killer'? 'Bad': 'Good';
            alert(`Player ${playerId}'s Current Identity is ${currentId}`);
        }
    });
});

socket.on('votePlayer', ({voteThisPlayer, voteIndex, voteblePlayers, round, isFirstRoundVoting}) => {
    sessionStorage.setItem("voteIndex", voteIndex);
    voteblePlayers.forEach(e => {
        if (e.playerId===sessionStorage.getItem("playerId")) {
            if (e.alreadyVoted==="Y") {
                voteNo(voteThisPlayer.playerId, round);
            } else {
                outputVoteSelection(voteThisPlayer, round, isFirstRoundVoting);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }
    })
});

// Message submit
chatForm.addEventListener('submit', e => {
    e.preventDefault();
    let msg = e.target.elements.msg.value;
    msg = msg.trim();
    if (!msg){
        return false;
    }
    socket.emit('chatMessage', ({msg, username}));
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

function outputIdentity(player) {
    currentPlayer = player;
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML =`<p class="meta">Admin <span>9:12pm</span></p>
    <p class="text">
        Hello [Player ${player.playerId+1}] ${player.username}, here're your identities! \n
        card1: ${player.card1}
        card2: ${player.card2}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
    sessionStorage.setItem("playerId", player.playerId+1);
    sessionStorage.setItem("socketId", player.id);
}

function outputVoteSelection(playerTobeVoted, round, isFirstRoundVoting) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="text">Do you want to vote player ${playerTobeVoted.playerId}<p>`;
    div.insertAdjacentHTML('beforeEnd',`<button id="voteYes${playerTobeVoted.playerId}-${round}-${isFirstRoundVoting}" 
                                        onclick="voteYes(${playerTobeVoted.playerId},${round},${isFirstRoundVoting})"> YES </button>
                                        <button id="voteNo${playerTobeVoted.playerId}-${round}-${isFirstRoundVoting}" 
                                        onclick="voteNo(${playerTobeVoted.playerId},${round},${isFirstRoundVoting})"> NO </button>`);
    document.querySelector('.chat-messages').appendChild(div);
}

function voteYes(player, round, isFirstRoundVoting) {
    alert(`Voted Yes for Player ${player}`);
    document.getElementById(`voteYes${player}-${round}-${isFirstRoundVoting}`).disabled = true;
    document.getElementById(`voteNo${player}-${round}-${isFirstRoundVoting}`).disabled = true;
    const currentPlayerId = sessionStorage.getItem("playerId");
    const voteIndex = sessionStorage.getItem("voteIndex");
    socket.emit('increaseVote', (
        {
            votedPlayer: player,
            currentPlayerId: currentPlayerId,
            voteIndex: voteIndex
        }
    ));
}

function voteNo(player, round, isFirstRoundVoting) {
    // alert(`Voted No for Player ${player}`);
    if (document.getElementById(`voteYes${player}-${round}-${isFirstRoundVoting}`) != null) {
        document.getElementById(`voteYes${player}-${round}-${isFirstRoundVoting}`).disabled = true;
    }
    if (document.getElementById(`voteNo${player}-${round}-${isFirstRoundVoting}`) != null) {
        document.getElementById(`voteNo${player}-${round}-${isFirstRoundVoting}`).disabled = true;
    }
    const voteIndex = sessionStorage.getItem("voteIndex");
    socket.emit('voteNo', voteIndex);
}

function outputGunSmithSelection(alivePlayers, round) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p class="text">Gun Smith Please Select a player<p>';
    alivePlayers.forEach(e =>{
        div.insertAdjacentHTML('beforeEnd', `<button id="gunSmith${e.playerId+1}-${round}" onclick="gunPlayer(${e.playerId+1})"> ${e.playerId+1} </button>`);
    });
    div.insertAdjacentHTML('beforeEnd', `<button id="noGun-${round}" onclick="gunPlayer(0)">No Gun </button>`);
    document.querySelector('.chat-messages').appendChild(div);
}

function outputDoctorSelection(alivePlayers, round) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p class="text">Doctor Please Select a player<p>';
    alivePlayers.forEach(e =>{
        div.insertAdjacentHTML('beforeEnd', `<button id="doctor${e.playerId+1}-${round}" onclick="injectPlayer(${e.playerId+1})"> ${e.playerId+1} </button>`);
    });
    document.querySelector('.chat-messages').appendChild(div);
}

function outputPoliceSelection(alivePlayers, round) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p class="text">Police Please Select a player<p>';
    alivePlayers.forEach(e =>{
        div.insertAdjacentHTML('beforeEnd', `<button id="police${e.playerId+1}-${round}" onclick="checkPlayer(${e.playerId+1})"> ${e.playerId+1} </button>`);
    });
    document.querySelector('.chat-messages').appendChild(div);
}

function outputKillerSelection(alivePlayers, round) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p class="text">Killer Please kill a player<p>';
    alivePlayers.forEach(e =>{
        div.insertAdjacentHTML('beforeEnd', `<button id="kill${e.playerId+1}-${round}" onclick="killPlayer(${e.playerId+1})"> ${e.playerId+1} </button>`);
    });
    document.querySelector('.chat-messages').appendChild(div);
}

function injectPlayer(injectedPlayer) {
    socket.emit('injectPlayer', injectedPlayer.toString());
}

function checkPlayer(checkedPlayerId) {
    socket.emit('checkPlayer', checkedPlayerId.toString());
}

function killPlayer(playerId) {
    socket.emit('killPlayer', playerId.toString());
}

function gunPlayer(playerId) {
    socket.emit('gunPlayer', playerId.toString());
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
    // console.log(currentPlayer);
    socket.emit('playerReady', currentPlayer);
}

function outputPlayerChatMessage(message, playername, playerId) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML =`<p class="meta">${playername} <span> Player ${playerId+1}</span></p>
    <p class="text">
        ${message}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML =`<p class="meta">God Message</p>
    <p class="text">
        ${message}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

// Add users to DOM
function outputUsers(users) {
    userList.innerHTML = '';
    users.forEach(user=>{
      const li = document.createElement('li');
      const numOfCards = user.card1===''?1:2;
      li.innerText = `${user.username} Player: ${user.playerId+1} # of cards: ${numOfCards}`;
      userList.appendChild(li);
    });
}