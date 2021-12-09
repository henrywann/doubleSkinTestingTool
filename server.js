const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const isSevenPlayer = true;
const {
    playerJoin,
    playerReady,
    playerAction,
    noPlayerAction,
    isRoundOver,
    calculateRoundResult,
    getAlivePlayers,
    populateDeadPlayers,
    updateExistingPlayers,
    sortAlivePlayers,
    getSilencedPlayer
} = require('./utils/players');

const {
    updateSocketRoomRole,
    isBadGuysWon,
    isGoodGuysWon,
    getVotePlayers,
    getRoleCount
} = require('./utils/serverHelper');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const routes = require('./routes');

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use('/', routes); //to use the routes

const isUsingSocketRoom = false;

var playerLength = 0;
var round = 0;
var voteblePlayers = [];
var allPlayers = [];
var playersThatVoted = 0;
var whoVotedWho = [];
var isFirstRoundVoting = true;
var playersWithMostVotes = [];
var pkPlayer = [];
var isPureVillagerExists = false;
var isGunSmithFired = false;
var isNewGame = true;
var gunablePlayers = [];
var gunnedPlayerDuringVoting = -1;

function resetGlobalVariablesForNewGame() {
    playerLength = 0;
    round = 0;
    voteblePlayers = [];
    allPlayers = [];
    playersThatVoted = 0;
    whoVotedWho = [];
    isFirstRoundVoting = true;
    playersWithMostVotes = [];
    pkPlayer = [];
    isPureVillagerExists = false;
    isGunSmithFired = false;
    isNewGame = true;
    gunablePlayers = [];
    gunnedPlayerDuringVoting = -1;
}

// Run with client connects
io.on('connection', socket => {
    console.log(`new connection: ${socket.id}`);
    socket.on("disconnect", () => {
        console.log('disconnected');
    });
    socket.on('joinGame', ({username, numOfPlayers, socketId, state, voteIndex}) => {
        if (socketId==null) {
            if (playerLength === 0) {
                playerLength = numOfPlayers;
            }
            const player = playerJoin(socket.id, username, isNewGame, playerLength);
            isNewGame = false;
            if (player == null) {
                socket.emit('message', 'Speculator mode. Please wait for game to finish.');
                socket.emit('roomUsers', allPlayers);
            } else {
                socket.emit('showIdentity', player);
                allPlayers.push(player);
                io.emit('roomUsers', allPlayers);
            }
        } else {
            var isRefreshedPlayerReady = false;
            console.log(`socket.id: ${socket.id}`);
            console.log(`socketId: ${socketId}`);
            getAlivePlayers().forEach(e => {
                if (e.id === socketId) {
                    console.log('found refresh player after ready');
                    e.id = socket.id;
                    // show identity again and update the socketId in session storage in client side
                    socket.emit('showIdentity', e);
                    isRefreshedPlayerReady = true;
                    var role = updateSocketRoomRole(io, e);
                    if (state==="votePlayer") {
                        socket.emit('votePlayer', ({
                            voteThisPlayer: voteblePlayers[voteIndex], 
                            voteIndex: voteIndex, 
                            voteblePlayers: voteblePlayers, 
                            round: round,
                            isFirstRoundVoting: isFirstRoundVoting
                        }));
                    }
                }
            });
            if (!isRefreshedPlayerReady) {
                console.log('found refresh player before ready');
                console.log(allPlayers.length);
                allPlayers.forEach(e => {
                    if (e.id===socketId) {
                        e.id = socket.id;
                        socket.emit('showIdentity', e);
                    }
                });
            }
        }
    });

    socket.on('playerReady', (currentPlayer) => {
        playerReady(socket.id, currentPlayer);
        allPlayers.forEach(e => {
            if (e.id===currentPlayer.id) e.isReady = true;
        })
        io.emit('playerReadyCheckmark', allPlayers);
        if (getAlivePlayers().length==playerLength) {
            sortAlivePlayers();
            getAlivePlayers().forEach(e => {
                console.log(`Player ${e.playerId+1} identity: ${e.card1}, ${e.card2}`);
                if (e.isPureVillager) {
                    isPureVillagerExists = true;
                }
            });
            proceedToNextNight();
        }
    });

    socket.on('restartGame', () => {
        resetGlobalVariablesForNewGame();
        io.emit('restartGameForAll');
    });

    socket.on('verifyKillPlayer', (playerId) => {
        io.emit('verifyKill', {
            playerId: playerId, 
            alivePlayers: getAlivePlayers(),
            round: round
        });
    });

    socket.on('chooseKillAgain', (playerId) => {
        var killerCount = getRoleCount('killer');
        io.emit('killerAction', {alivePlayers: getAlivePlayers(), round: round, killerCount: killerCount});
    });

    socket.on('killPlayer', (playerId) => {
        playerAction(playerId, 'kill', round);
        io.emit('killComplete', {
            playerId: playerId, 
            alivePlayers: getAlivePlayers(),
            round: round
        });
        if (isRoundOver(round)) {
            roundOverAction(round, io);
        }
    });

    socket.on('verifyCheckPlayer', (playerId) => {
        io.emit('verifyCheck', {
            playerId: playerId, 
            alivePlayers: getAlivePlayers(),
            round: round
        });
    });

    socket.on('chooseCheckAgain', (playerId) => {
        var policeCount = getRoleCount('police');
        io.emit('policeAction', {alivePlayers: getAlivePlayers(), round: round, policeCount: policeCount});
    });

    socket.on('checkPlayer', (playerId) => {
        playerAction(playerId, 'check', round);
        io.emit('checkComplete', {
            playerId: playerId,
            alivePlayers: getAlivePlayers(),
            round: round
        });
        if (isRoundOver(round)) {
            roundOverAction(round, io);
        }
    });

    socket.on('injectPlayer', (playerId) => {
        playerAction(playerId, 'inject', round);
        io.emit('injectComplete', {
            playerId: playerId,
            alivePlayers: getAlivePlayers(),
            round: round
        });
        if (isRoundOver(round)) {
            roundOverAction(round, io);
        }
    });

    socket.on('gunPlayer', ({playerId, isVotingRound, voteIndex}) => {
        console.log(`gun playerId type: ${typeof playerId}`);
        console.log(`gun playerId: ${playerId}`);
        console.log(`isVotingRound type : ${typeof playerId}`);
        if (playerId==='0') {
            isGunSmithFired = false;
            noPlayerAction('gun',round);
        } else {
            isGunSmithFired = true;
            if (isVotingRound) {
                console.log('Gun Smith fired during voting');
                console.log(`fired player: ${playerId}`);
                console.log(`pk player: ${JSON.stringify(playersWithMostVotes, null, 4)}`);
                gunnedPlayerDuringVoting = playerId;

                populateDeadPlayers(gunnedPlayerDuringVoting, []);
                io.emit('message', `玩家${gunnedPlayerDuringVoting}被Gun Smith带走了！`);
                io.emit('roomUsers', getAlivePlayers());
            } else {
                playerAction(playerId, 'gun', round);
            }
        }
        io.emit('gunComplete', {
            playerId: playerId,
            alivePlayers: isVotingRound?gunablePlayers:getAlivePlayers(),
            round: round
        });
        if (isVotingRound) {
            if (isBadGuysWon(isPureVillagerExists)) {
                io.emit('message', '游戏结束！坏人胜利！');
                resetGlobalVariablesForNewGame();
            } else if (isGoodGuysWon()) {
                io.emit('message', '游戏结束！好人胜利！');
                resetGlobalVariablesForNewGame();
            } else {
                proceedToNextNight();
            }
        }
        else {
            if (isRoundOver(round)) {
                roundOverAction(round, io);
            }
        }

    });

    socket.on('silencePlayer', (playerId) => {
        console.log(`silenced playerId type: ${typeof playerId}`);
        if (playerId==='0') {
            noPlayerAction('silence', round);
        } else {
            playerAction(playerId, 'silence', round);
        }
        io.emit('silenceComplete', {
            playerId: playerId,
            alivePlayers: getAlivePlayers(),
            round: round
        });
        if (isRoundOver(round)) {
            roundOverAction(round, io);
        }
    });

    socket.on('chatMessage', ({msg, username}) => {
        var playerId = 0;
        allPlayers.forEach(element => {
            if (element.username === username) {
                playerId = element.playerId;
            }
        });
        messageDetails={  
            message : msg,  
            playername : username,
            playerId : playerId
        };  
        io.emit('playerChatmessage', messageDetails);
        // console.log(allPlayers);
    });

    socket.on('increaseVote', ({votedPlayer, currentPlayerId, voteIndex, round}) => {
        console.log(`Player ${currentPlayerId} voted player ${votedPlayer}`);
        io.emit('voteComplete', ({currentPlayer: currentPlayerId, round: round, isFirstRoundVoting: isFirstRoundVoting, playerBeingVoted: votedPlayer}));
        if (currentPlayerId!==gunnedPlayerDuringVoting)
            whoVotedWho.push(currentPlayerId);
        voteblePlayers.forEach(e => {
            if (e.playerId===votedPlayer.toString() && currentPlayerId!==gunnedPlayerDuringVoting) {
                e.numOfVotes++;
            }
            if (e.playerId===currentPlayerId) {
                e.alreadyVoted = "Y";
            }
        })
        voteComplete(voteIndex);
    });

    socket.on('voteNo', ({voteIndex, playerId}) => {
        const playerBeingVoted = voteblePlayers[parseInt(voteIndex)].playerId;
        console.log(`Player ${playerId} voted no for player ${playerBeingVoted}`);
        io.emit('voteComplete', ({currentPlayer: playerId, round: round, isFirstRoundVoting: isFirstRoundVoting, playerBeingVoted: playerBeingVoted}));
        voteComplete(voteIndex);
    });

    socket.on('gunSmithVotingRoundFire', response => {
        io.emit('gunSmithAction', {alivePlayers: getAlivePlayers(), round: round, isVotingRound: true});
    });

});

function voteComplete(voteIndex) {
    playersThatVoted++;
    if (playersThatVoted===voteblePlayers.length) {
        var curPlayer = voteblePlayers[parseInt(voteIndex)].playerId;
        if (whoVotedWho.length===0) io.emit('message', `没人投玩家${curPlayer}`);
        else io.emit('message', `玩家：${whoVotedWho}投了玩家${curPlayer}`);
        playersThatVoted = 0;
        console.log(`voteIndex: ${voteIndex}`);
        if (parseInt(voteIndex)===(playersWithMostVotes.length>1?playersWithMostVotes.length-1:voteblePlayers.length-1)) {
            // calculate vote result
            console.log('voting of this round is over');
            console.log(`voteblePlayers: ${JSON.stringify(voteblePlayers, null, 4)}`);
            // console.log(`playersWithMostVotes: ${JSON.stringify(playersWithMostVotes, null, 4)}`);
            var playersCanBeVoted = playersWithMostVotes.length>1?playersWithMostVotes:voteblePlayers;
            playersWithMostVotes = [];

            var mostVoteCount = 0;
            console.log(`playersCanBeVoted: ${JSON.stringify(playersCanBeVoted, null, 4)}`);

            playersCanBeVoted.forEach(e => {
                if (e.numOfVotes===mostVoteCount) {
                    playersWithMostVotes.push(e);
                } else if (e.numOfVotes > mostVoteCount) {
                    mostVoteCount = e.numOfVotes;
                    playersWithMostVotes = [];
                    playersWithMostVotes.push(e);
                }
            });

            if (playersWithMostVotes.length>1 && isFirstRoundVoting) {
                // Restart voting on the players with the same number of votes
                voteblePlayers.forEach(e => {
                    e.alreadyVoted = "N";
                    e.numOfVotes = 0;
                });
                isFirstRoundVoting = false;
                io.emit('votePlayer', ({
                    voteThisPlayer: playersWithMostVotes[0], 
                    voteIndex: 0, 
                    voteblePlayers: voteblePlayers,
                    round: round,
                    isFirstRoundVoting: isFirstRoundVoting
                }));
            } else {
                playersWithMostVotes.forEach(e => {
                    var deadPlayers = [];
                    populateDeadPlayers(e.playerId, deadPlayers);
                    updateExistingPlayers(io);
                });
                var votedOutPlayersMsg = [];
                console.log(`voted out player length: ${playersWithMostVotes.length}`);
                playersWithMostVotes.forEach(e => {
                    votedOutPlayersMsg.push(e.playerId);
                });
                io.emit('message', `玩家${votedOutPlayersMsg}被投票出局！`);
                if (isBadGuysWon(isPureVillagerExists)) {
                    io.emit('message', '游戏结束！坏人胜利！');
                    resetGlobalVariablesForNewGame();
                } else if (isGoodGuysWon()) {
                    io.emit('message', '游戏结束！好人胜利！');
                    resetGlobalVariablesForNewGame();
                } else {
                    io.emit('roomUsers', getAlivePlayers());
                    proceedToNextNight();
                }
            }
        } else {
            // var curPlayer = voteblePlayers[parseInt(voteIndex)].playerId;
            // io.emit('message', `Player ${curPlayer} received votes from player(s): ${whoVotedWho}`);
            whoVotedWho = [];
            io.emit('votePlayer', ({
                voteThisPlayer: playersWithMostVotes.length>1?playersWithMostVotes[parseInt(voteIndex)+1]:voteblePlayers[parseInt(voteIndex)+1], 
                voteIndex: parseInt(voteIndex)+1,
                voteblePlayers: voteblePlayers,
                round: round,
                isFirstRoundVoting: isFirstRoundVoting
            }));
        }
    }
}

function proceedToNextNight() {
    console.log('proceeding to next round');
    var killerCount = 0;
    var policeCount = 0;
    var doctorCount = 0;
    var gunSmithCount = 0;
    var silencerCount = 0;
    var i;
    for (i=0; i<getAlivePlayers().length; i++) {
        const currentPlayer = getAlivePlayers()[i];
        var role = updateSocketRoomRole(io, currentPlayer);
        if (role==='killer') killerCount++;
        else if (role==='silencer') silencerCount++;
        else if (role==='police') policeCount++;
        else if (role==='doctor') doctorCount++;
        else if (role==='gunSmith') gunSmithCount++;
    }

    io.emit('updateCurrentCard', getAlivePlayers());
    // Increasing round count and reseting all voting related global variables
    round++;
    playersThatVoted = 0;
    voteblePlayers = [];
    whoVotedWho = [];
    playersWithMostVotes = [];
    isFirstRoundVoting = true;
    gunnedPlayerDuringVoting = -1;

    // console.log(`killerCount: ${killerCount}, policeCount: ${policeCount}, doctorCount: ${doctorCount}, gunsmithCount: ${gunSmithCount}`);
    io.emit('message', `天黑请闭眼...第${round}夜!`);
    if (silencerCount > 0) {
        io.emit('silencerAction', {alivePlayers: getAlivePlayers(), round: round});
    } else {
        noPlayerAction('silence',round);
    }
    if (killerCount > 0) {
        if (isUsingSocketRoom) {
            io.to('killerGroup').emit('killerAction', {alivePlayers: getAlivePlayers(), round: round});
        } else {
            io.emit('killerAction', {alivePlayers: getAlivePlayers(), round: round, killerCount: killerCount});
        }
    } else {
        noPlayerAction('kill',round);
    }
    if (policeCount > 0) {
        if (isUsingSocketRoom) {
            io.to('policeGroup').emit('policeAction', {alivePlayers: getAlivePlayers(), round: round});
        } else {
            io.emit('policeAction', {alivePlayers: getAlivePlayers(), round: round, policeCount: policeCount});
        }
    } else {
        noPlayerAction('check',round);
    }
    if (doctorCount > 0) {
        if (isUsingSocketRoom) {
            io.to('doctor').emit('doctorAction', {alivePlayers: getAlivePlayers(), round: round});
        } else {
            io.emit('doctorAction', {alivePlayers: getAlivePlayers(), round: round});
        }
    } else {
        noPlayerAction('inject',round);
    }
    if (gunSmithCount > 0 && !isGunSmithFired) {
        if (isUsingSocketRoom) {
            io.to('gunSmith').emit('gunSmithAction', {alivePlayers: getAlivePlayers(), round: round, isVotingRound: false});
        } else {
            io.emit('gunSmithAction', {alivePlayers: getAlivePlayers(), round: round, isVotingRound: false});
        }
    } else {
        noPlayerAction('gun',round);
    }
    if (isRoundOver(round)) {
        roundOverAction(round, io);
    }
}

function roundOverAction(round, io) {
    console.log('Round Over');
    const deadPlayers = calculateRoundResult(round, io);
    var deadPlayerMessage = '';
    if (deadPlayers.length === 0) {
        deadPlayerMessage = '平安夜，没有人死!';
    } else {
        const i = Math.floor(Math.random() * 3);
        if (i===0) deadPlayerMessage = `玩家${deadPlayers}惨死在血泊中！`;
        else if (i===1) deadPlayerMessage = `玩家${deadPlayers}与世长辞！`;
        else deadPlayerMessage = `玩家${deadPlayers}离我们远去了！`;
    }
    const silencedPlayer = getSilencedPlayer(round);
    var silencedPlayerMessage = '';
    if (silencedPlayer==='0') {
        silencedPlayerMessage = '没有人被禁言！';
    } else {
        silencedPlayerMessage = `玩家${silencedPlayer}被禁言！`;
    }
    io.emit('message', deadPlayerMessage);
    io.emit('message', silencedPlayerMessage);
    io.emit('roomUsers', getAlivePlayers());
    io.emit('updateCurrentCard', getAlivePlayers());
    if (isBadGuysWon(isPureVillagerExists)) {
        io.emit('message', '游戏结束！坏人胜利！');
        resetGlobalVariablesForNewGame();
    } else if (isGoodGuysWon()) {
        io.emit('message', '游戏结束！好人胜利！');
        resetGlobalVariablesForNewGame();
    } else {
        // voteblePlayers consists elements of playerId and alreadyVoted flag
        voteblePlayers = getVotePlayers(deadPlayers);
        gunablePlayers = [];
        for( var i = 0; i < voteblePlayers.length; i++){ 
            const playerId = parseInt(voteblePlayers[i].playerId)-1;
            const curPlayer = {playerId};
            gunablePlayers.push(curPlayer);
        }
        gunablePlayers.sort((a, b) => a.playerId-b.playerId);

        var isGunSmithKilled = false;
        for (var i=0; i<getAlivePlayers().length; i++) {
            const currentPlayer = getAlivePlayers()[i];
            for (var j=0; j<deadPlayers.length; j++) {
                if ((currentPlayer.playerId+1).toString() === deadPlayers[j] && currentPlayer.card2 === 'gunSmith') {
                    isGunSmithKilled = true;
                }
            }
        }
        if (!isGunSmithFired && !isGunSmithKilled) {
            console.log('gun smith fire option');
            io.emit('gunSmithVotingRoundAction', ({
                alivePlayers: gunablePlayers, 
                round: round,
                isVotingRound: true
            }));
        }
        // console.log(`votablePlayers: ${JSON.stringify(gunablePlayers, null, 4)}`);

        io.emit('votePlayer', ({
            voteThisPlayer: voteblePlayers[0], 
            voteIndex: 0, 
            voteblePlayers: voteblePlayers, 
            round: round,
            isFirstRoundVoting: isFirstRoundVoting
        }));
    }
}

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
