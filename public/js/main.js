const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const socket = io();
const userList = document.getElementById('users');
const gunSmithAction = document.getElementById('activateGun');
var currentPlayer;
var switchOrder = document.getElementById("switchOrder");
switchOrder.addEventListener("click", clickSwitchOrder);
const ready = document.getElementById("ready");
ready.addEventListener("click", readyToPlay);
const restart = document.getElementById("restartBtn");
restart.addEventListener("click", restartGame);

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});
// Join Game
socket.emit('joinGame', ({ 
    username: username,
    socketId: sessionStorage.getItem("socketId"),
    state: sessionStorage.getItem("state"),
    voteIndex: sessionStorage.getItem("voteIndex")
 }));

 socket.on('restartGameForAll', () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
 });
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

socket.on('silencerAction', ({alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="silencer") {
        sessionStorage.setItem("state", "silencerAction");
        outputSilencerSelection(alivePlayers, round);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

socket.on('killerAction', ({alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="killer") {
        sessionStorage.setItem("state", "killerAction");
        outputKillerSelection(alivePlayers, round);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

socket.on('policeAction', ({alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="police") {
        sessionStorage.setItem("state", "policeAction");
        outputPoliceSelection(alivePlayers, round);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

socket.on('doctorAction', ({alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="doctor") {
        sessionStorage.setItem("state", "doctorAction");
        outputDoctorSelection(alivePlayers, round);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

socket.on('gunSmithAction', ({alivePlayers, round, isVotingRound}) => {
    if (sessionStorage.getItem("currentCard")==="gunSmith") {
        sessionStorage.setItem("state", "gunSmithAction");
        outputGunSmithSelection(alivePlayers, round, isVotingRound);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

socket.on('gunComplete', ({playerId, alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="gunSmith") {
        sessionStorage.setItem("state", "gunComplete");
        alivePlayers.forEach(e => {
            document.getElementById(`gunSmith${e.playerId+1}-${round}`).disabled = true;
        });
        var noGunBtn = document.getElementById(`noGun-${round}`);
        noGunBtn.disabled = true;
        if (playerId!=='0') {
            alert(`Gunned Player ${playerId}!`);
        }
    }
});

socket.on('injectComplete', ({playerId, alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="doctor") {
        sessionStorage.setItem("state", "injectComplete");
        alivePlayers.forEach(e => {
            document.getElementById(`doctor${e.playerId+1}-${round}`).disabled = true;
        });
        alert(`Injected Player ${playerId}!`);
    }
});


socket.on('killComplete', ({playerId, alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="killer") {
        sessionStorage.setItem("state", "killComplete");
        alivePlayers.forEach(e => {
            document.getElementById(`kill${e.playerId+1}-${round}`).disabled = true;
        });
        alert(`Killed Player ${playerId}!`);
    }
});

socket.on('silenceComplete', ({playerId, alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="silencer") {
        sessionStorage.setItem("state", "silenceComplete");
        alivePlayers.forEach(e => {
            document.getElementById(`silence${e.playerId+1}-${round}`).disabled = true;
        });
        var noSilenceBtn = document.getElementById(`noSilence-${round}`);
        noSilenceBtn.disabled = true;
        if (playerId!=='0') {
            alert(`Silenced Player ${playerId}!`);
        }
    }
});

socket.on('checkComplete', ({playerId, alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="police") {
        sessionStorage.setItem("state", "checkComplete");
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
    }
});

socket.on('votePlayer', ({voteThisPlayer, voteIndex, voteblePlayers, round, isFirstRoundVoting}) => {
    sessionStorage.setItem("state", "votePlayer");
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

socket.on('updateCurrentCard', (alivePlayers) => {
    console.log('entering updateCurrentCard');
    alivePlayers.forEach(e => {
        console.log(`playerId: ${typeof e.playerId} ${e.playerId}`);
        if ((e.playerId+1).toString()===sessionStorage.getItem("playerId")) {
            if (e.card1==='') {
                console.log("card1 is empty, setting card2 to currentCard");
                sessionStorage.setItem("currentCard", e.card2);
            }
        }
    });
});

socket.on('gunSmithVotingRoundAction', (alivePlayers) => {
    console.log('entering gunSmithVotingRoundAction');
    outputGunAction();
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
    console.log(currentPlayer);
    // check if admin-message div already exist
    if_admin_exist = document.getElementsByClassName("admin-message").length > 0;
    if (if_admin_exist) {
        admin_div = document.getElementsByClassName("admin-message")[0]
        console.log(admin_div);
        admin_div.innerHTML =`<p class="meta">Admin</p>
        <p class="text">
            Hello [Player ${player.playerId+1}] ${player.username}, here're your identities! \n
            card1: ${player.card1}
            card2: ${player.card2}
        </p>`;
        sessionStorage.setItem("playerId", player.playerId+1);
        sessionStorage.setItem("socketId", player.id);
    } else {
        const div = document.createElement('div');
        div.classList.add('admin-message');
        div.innerHTML =`<p class="meta">Admin</p>
        <p class="text">
            Hello [Player ${player.playerId+1}] ${player.username}, here're your identities! \n
            card1: ${player.card1}
            card2: ${player.card2}
        </p>`;
        document.querySelector('.chat-messages').appendChild(div);
        sessionStorage.setItem("playerId", player.playerId+1);
        sessionStorage.setItem("socketId", player.id);
    }
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

function outputGunSmithSelection(alivePlayers, round, isVotingRound) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p class="text">Gun Smith Please Select a player<p>';
    alivePlayers.forEach(e =>{
        div.insertAdjacentHTML('beforeEnd', `<button id="gunSmith${e.playerId+1}-${round}" onclick="gunPlayer(${e.playerId+1}, ${isVotingRound})"> ${e.playerId+1} </button>`);
    });
    div.insertAdjacentHTML('beforeEnd', `<button id="noGun-${round}" onclick="gunPlayer(0,false)">No Gun </button>`);
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

function outputSilencerSelection(alivePlayers, round) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p class="text">Silencer Please silence a player<p>';
    alivePlayers.forEach(e =>{
        div.insertAdjacentHTML('beforeEnd', `<button id="silence${e.playerId+1}-${round}" onclick="silencePlayer(${e.playerId+1})"> ${e.playerId+1} </button>`);
    });
    div.insertAdjacentHTML('beforeEnd', `<button id="noSilence-${round}" onclick="silencePlayer(0)">No Silence </button>`);
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

function gunPlayer(playerId, isVotingRound) {
    socket.emit('gunPlayer', ({playerId: playerId.toString(), isVotingRound: isVotingRound}));
}

function silencePlayer(playerId) {
    socket.emit('silencePlayer', playerId.toString());
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
    sessionStorage.setItem("currentCard", currentPlayer.card1);
    // console.log(currentPlayer);
    socket.emit('playerReady', currentPlayer);
}

function restartGame() {
    socket.emit('restartGame');
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

function outputGunAction() {
    gunSmithAction.innerHTML = '<button id="gunSmithMidRoundAction" onclick="gunMidRoundAction()"> Fire! </button>';
    // gunSmithAction.appendChild('<button id="gunSmithMidRoundAction" onclick="gunMidRoundAction()"> Fire! </button>');
}

function gunMidRoundAction() {
    socket.emit('gunSmithVotingRoundFire', 'success');
}