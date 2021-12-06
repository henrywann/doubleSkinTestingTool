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

const { username, numOfPlayers } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});
socket.on("connect", () => {
    console.log(socket.id);
  });
// Join Game
socket.emit('joinGame', ({ 
    username: username,
    numOfPlayers: numOfPlayers,
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
    outputUsers(users);
});

socket.on('playerReadyCheckmark', (allPlayers) => {
    outputUsers(allPlayers);
});

// Displays player typed messages
socket.on('playerChatmessage', ({message, playername, playerId}) => {
    console.log(`Incoming message: ${message} ${playername} ${playerId}`);
    outputPlayerChatMessage(message, playername, playerId);
});

// Displays game messages
socket.on('message', message => {
    console.log(`Incoming message: ${message}`);
    outputMessage(message);
});

socket.on('silencerAction', ({alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="silencer") {
        sessionStorage.setItem("state", "silencerAction");
        outputSilencerSelection(alivePlayers, round);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

socket.on('killerAction', ({alivePlayers, round, killerCount}) => {
    if (sessionStorage.getItem("currentCard")==="killer") {
        sessionStorage.setItem("state", "killerAction");
        sessionStorage.setItem("isInitiatingKill", false);
        outputKillerSelection(alivePlayers, round, killerCount);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

socket.on('policeAction', ({alivePlayers, round, policeCount}) => {
    if (sessionStorage.getItem("currentCard")==="police") {
        sessionStorage.setItem("state", "policeAction");
        sessionStorage.setItem("isInitiatingCheck", false);
        outputPoliceSelection(alivePlayers, round, policeCount);
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

socket.on('verifyKill', ({playerId, alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="killer" && sessionStorage.getItem("isInitiatingKill")==='false') {
        sessionStorage.setItem("state", "killerVerify");
        outputVerifyKill(playerId, alivePlayers, round);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

socket.on('verifyCheck', ({playerId, alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="police" && sessionStorage.getItem("isInitiatingCheck")==='false') {
        sessionStorage.setItem("state", "policeVerify");
        outputVerifyCheck(playerId, alivePlayers, round);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

socket.on('gunComplete', ({playerId, alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="gunSmith") {
        sessionStorage.setItem("state", "gunComplete");
        alivePlayers.forEach(e => {
            console.log(`gunSmith${e.playerId+1}-${round}`);
            document.getElementById(`gunSmith${e.playerId+1}-${round}`).disabled = true;
        });
        var noGunBtn = document.getElementById(`noGun-${round}`);
        noGunBtn.disabled = true;
        if (playerId!=='0') {
            outputMessage(`玩家${playerId}被崩了!`);
        }
    }
});

socket.on('injectComplete', ({playerId, alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="doctor") {
        sessionStorage.setItem("state", "injectComplete");
        alivePlayers.forEach(e => {
            document.getElementById(`doctor${e.playerId+1}-${round}`).disabled = true;
        });
        outputMessage(`玩家${playerId}被扎了!`)
    }
});


socket.on('killComplete', ({playerId, alivePlayers, round}) => {
    if (sessionStorage.getItem("currentCard")==="killer") {
        sessionStorage.setItem("state", "killComplete");
        alivePlayers.forEach(e => {
            document.getElementById(`kill${e.playerId+1}-${round}`).disabled = true;
        });
        const message = `玩家${playerId}被杀死!`;
        outputMessage(message);
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
            outputMessage(`玩家${playerId}被禁言!`);
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
                const currentId = currentCard==='killer' || currentCard ==='silencer'? '坏人': '好人';
                const message = `玩家${playerId}的目前身份是${currentId}`;
                outputMessage(message);
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
    var isPlayerAlive = false;
    alivePlayers.forEach(e => {
        console.log(`playerId: ${typeof e.playerId} ${e.playerId}`);
        if ((e.playerId+1).toString()===sessionStorage.getItem("playerId")) {
            isPlayerAlive = true;
            if (e.card1==='') {
                console.log("card1 is empty, setting card2 to currentCard");
                sessionStorage.setItem("currentCard", e.card2);
            }
        }
    });
    if (!isPlayerAlive) {
        sessionStorage.setItem("currentCard", "");
    }
});

socket.on('gunSmithVotingRoundAction', ({alivePlayers, round, isVotingRound}) => {
    console.log('entering gunSmithVotingRoundAction');
    if (sessionStorage.getItem("currentCard")==="gunSmith") {
        sessionStorage.setItem("state", "gunSmithAction");
        outputGunSmithSelection(alivePlayers, round, isVotingRound);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
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
            Hello [玩家${player.playerId+1}] ${player.username}, 你的身份牌是： \n
            身份1: ${player.card1Chinese}
            身份2: ${player.card2Chinese}
        </p>`;
        sessionStorage.setItem("playerId", player.playerId+1);
        sessionStorage.setItem("socketId", player.id);
    } else {
        const div = document.createElement('div');
        div.classList.add('admin-message');
        div.innerHTML =`<p class="meta">Admin</p>
        <p class="text">
            Hello [玩家${player.playerId+1}] ${player.username}, 你的身份牌是： \n
            身份1: ${player.card1Chinese}
            身份2: ${player.card2Chinese}
        </p>`;
        document.querySelector('.chat-messages').appendChild(div);
        sessionStorage.setItem("playerId", player.playerId+1);
        sessionStorage.setItem("socketId", player.id);
    }
}

function outputVoteSelection(playerTobeVoted, round, isFirstRoundVoting) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="text">是否投玩家${playerTobeVoted.playerId}？<p>`;
    div.insertAdjacentHTML('beforeEnd',`<button id="voteYes${playerTobeVoted.playerId}-${round}-${isFirstRoundVoting}" 
                                        onclick="voteYes(${playerTobeVoted.playerId},${round},${isFirstRoundVoting})"> &nbsp;是&nbsp; </button>
                                        <button id="voteNo${playerTobeVoted.playerId}-${round}-${isFirstRoundVoting}" 
                                        onclick="voteNo(${playerTobeVoted.playerId},${round},${isFirstRoundVoting})"> &nbsp;否&nbsp; </button>`);
    document.querySelector('.chat-messages').appendChild(div);
}

function voteYes(player, round, isFirstRoundVoting) {
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
    if (document.getElementById(`voteYes${player}-${round}-${isFirstRoundVoting}`) != null) {
        document.getElementById(`voteYes${player}-${round}-${isFirstRoundVoting}`).disabled = true;
    }
    if (document.getElementById(`voteNo${player}-${round}-${isFirstRoundVoting}`) != null) {
        document.getElementById(`voteNo${player}-${round}-${isFirstRoundVoting}`).disabled = true;
    }
    const voteIndex = sessionStorage.getItem("voteIndex");
    const playerId = sessionStorage.getItem("playerId");
    socket.emit('voteNo', {voteIndex: voteIndex, playerId: playerId.toString()});
}

function outputVerifyKill(playerId, alivePlayers, round) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="text">确认要杀玩家${playerId}吗?<p>`;
    div.insertAdjacentHTML('beforeEnd',`<button id="killYes${playerId}-${round}" 
                                        onclick="killYes(${playerId},${round})"> &nbsp;是&nbsp; </button>
                                        <button id="killNo${playerId}-${round}" 
                                        onclick="killNo(${playerId})"> &nbsp;否&nbsp; </button>`);
    document.querySelector('.chat-messages').appendChild(div);
}

function killYes(playerId, round) {
    document.getElementById(`killYes${playerId}-${round}`).disabled = true;
    document.getElementById(`killNo${playerId}-${round}`).disabled = true;
    killPlayer(playerId);
}

function killNo(playerId) {
    socket.emit('chooseKillAgain', playerId.toString());
}

function outputVerifyCheck(playerId, alivePlayers, round) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="text">确认要验玩家${playerId}吗?<p>`;
    div.insertAdjacentHTML('beforeEnd',`<button id="checkYes${playerId}-${round}" 
                                        onclick="checkYes(${playerId},${round})"> &nbsp;是&nbsp;</button>
                                        <button id="checkNo${playerId}-${round}" 
                                        onclick="checkNo(${playerId})"> &nbsp;否&nbsp; </button>`);
    document.querySelector('.chat-messages').appendChild(div);
}

function checkYes(playerId, round) {
    document.getElementById(`checkYes${playerId}-${round}`).disabled = true;
    document.getElementById(`checkNo${playerId}-${round}`).disabled = true;
    checkPlayer(playerId);
}

function checkNo(playerId) {
    socket.emit('chooseCheckAgain', playerId.toString());
}

function outputGunSmithSelection(alivePlayers, round, isVotingRound) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p class="text">Gun Smith 请开枪<p>';
    alivePlayers.forEach(e =>{
        div.insertAdjacentHTML('beforeEnd', `<button class="actionBtn" id="gunSmith${e.playerId+1}-${round}" onclick="gunPlayer(${e.playerId+1}, ${isVotingRound})"> ${e.playerId+1} </button>`);
    });
    if (!isVotingRound) div.insertAdjacentHTML('beforeEnd', `<button class="actionBtn" id="noGun-${round}" onclick="gunPlayer(0,false)">不开枪 </button>`);
    document.querySelector('.chat-messages').appendChild(div);
}

function outputDoctorSelection(alivePlayers, round) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p class="text">医生请扎人<p>';
    alivePlayers.forEach(e =>{
        div.insertAdjacentHTML('beforeEnd', `<button class="actionBtn" id="doctor${e.playerId+1}-${round}" onclick="injectPlayer(${e.playerId+1})"> ${e.playerId+1} </button>`);
    });
    document.querySelector('.chat-messages').appendChild(div);
}

function outputPoliceSelection(alivePlayers, round, policeCount) {
    var teamMate = getTeamMate(alivePlayers, policeCount, 'police');
    const div = document.createElement('div');
    div.classList.add('message');
    if (teamMate !== -1) {
        div.innerHTML = `<p class="text">玩家 ${teamMate} 是你的队友. 警察请验人<p>`;
    } else {
        div.innerHTML = '<p class="text">警察请验人<p>';
    }
    alivePlayers.forEach(e =>{
        div.insertAdjacentHTML('beforeEnd', `<button class="actionBtn" id="police${e.playerId+1}-${round}" onclick="checkPlayerRouter(${e.playerId+1}, ${policeCount})"> ${e.playerId+1} </button>`);
    });
    document.querySelector('.chat-messages').appendChild(div);
}

function outputKillerSelection(alivePlayers, round, killerCount) {
    var teamMate = getTeamMate(alivePlayers, killerCount, 'killer');
    
    const div = document.createElement('div');
    div.classList.add('message');
    if (teamMate !== -1) {
        div.innerHTML = `<p class="text">玩家 ${teamMate} 是你的队友. 杀手请杀人<p>`;
    } else {
        div.innerHTML = '<p class="text">杀手请杀人<p>';
    }
    alivePlayers.forEach(e =>{
        div.insertAdjacentHTML('beforeEnd', `<button class="actionBtn" id="kill${e.playerId+1}-${round}" onclick="killerPlayerRouter(${e.playerId+1}, ${killerCount})"> ${e.playerId+1} </button>`);
    });
    document.querySelector('.chat-messages').appendChild(div);
}

function getTeamMate(alivePlayers, count, card) {
    var teamMate = -1;
    if (count > 1) {
        alivePlayers.forEach(e => {
            if ((e.playerId+1).toString() !== sessionStorage.getItem("playerId")) {
                if (e.card1===card || (e.card1==='' && e.card2===card)) {
                    teamMate = e.playerId+1;
                }
            }
        });
    }
    return teamMate;
}

function outputSilencerSelection(alivePlayers, round) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = '<p class="text">禁言请禁言<p>';
    alivePlayers.forEach(e =>{
        div.insertAdjacentHTML('beforeEnd', `<button class="actionBtn" id="silence${e.playerId+1}-${round}" onclick="silencePlayer(${e.playerId+1})"> ${e.playerId+1} </button>`);
    });
    div.insertAdjacentHTML('beforeEnd', `<button class="actionBtn" id="noSilence-${round}" onclick="silencePlayer(0)"> 不禁言 </button>`);
    document.querySelector('.chat-messages').appendChild(div);
}

function injectPlayer(injectedPlayer) {
    socket.emit('injectPlayer', injectedPlayer.toString());
}

function checkPlayerRouter(playerId, policeCount) {
    if (policeCount > 1) {
        verifyCheckPlayer(playerId);
    } else {
        checkPlayer(playerId);
    }
}

function verifyCheckPlayer(playerId) {
    sessionStorage.setItem("isInitiatingCheck", true);
    outputMessage('等待队友确认...');
    socket.emit('verifyCheckPlayer', playerId.toString());
}

function checkPlayer(checkedPlayerId) {
    socket.emit('checkPlayer', checkedPlayerId.toString());
}



function killerPlayerRouter(playerId, killerCount) {
    console.log(`killerCount: ${typeof killerCount} ${killerCount}`);
    if (killerCount > 1) {
        verifyKillPlayer(playerId);
    } else {
        killPlayer(playerId);
    }
}

function verifyKillPlayer(playerId) {
    sessionStorage.setItem("isInitiatingKill", true);
    outputMessage('等待队友确认...');
    socket.emit('verifyKillPlayer', playerId.toString());
}

function killPlayer(playerId) {
    socket.emit('killPlayer', playerId.toString());
}

function gunPlayer(playerId, isVotingRound) {
    var voteIndex = sessionStorage.getItem("voteIndex");
    socket.emit('gunPlayer', ({playerId: playerId.toString(), isVotingRound: isVotingRound, voteIndex: voteIndex}));
}

function silencePlayer(playerId) {
    socket.emit('silencePlayer', playerId.toString());
}

function clickSwitchOrder() {
    console.log("switching order");
    var temp = currentPlayer.card1;
    currentPlayer.card1 = currentPlayer.card2;
    currentPlayer.card2 = temp;
    var tempChinese = currentPlayer.card1Chinese;
    currentPlayer.card1Chinese = currentPlayer.card2Chinese;
    currentPlayer.card2Chinese = tempChinese;
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
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML =`<p class="meta">God Message</p>
    <p class="text">
        ${message}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add users to DOM
function outputUsers(users) {
    userList.innerHTML = '';
    users.forEach(user=>{
      const li = document.createElement('li');
      const numOfCards = user.card1===''?1:2;
      if (user.isReady) {
        li.innerText = `${user.username} 编号: ${user.playerId+1} 剩余卡牌: ${numOfCards} ✅`;
      } else {
        li.innerText = `${user.username} 编号: ${user.playerId+1} 剩余卡牌: ${numOfCards}`;
      }
      
      userList.appendChild(li);
    });
}

function gunMidRoundAction() {
    socket.emit('gunSmithVotingRoundFire', 'success');
}