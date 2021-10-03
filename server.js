const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
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
} = require('./utils/players');

const {
    updateSocketRoomRole,
    isBadGuysWon,
    isGoodGuysWon,
    getVotePlayers
} = require('./utils/serverHelper');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const playerLength = 6;
const isUsingSocketRoom = false;
var round = 0;
var voteblePlayers = [];
var allPlayers = [];
var playersThatVoted = 0;
var whoVotedWho = [];
var isFirstRoundVoting = true;
var playersWithMostVotes = [];
var isPureVillagerExists = false;
var isGunSmithFired = false;
var isNewGame = true;
var gunnedPlayerDuringVoting = -1;

function resetGlobalVariablesForNewGame() {
    round = 0;
    voteblePlayers = [];
    allPlayers = [];
    playersThatVoted = 0;
    whoVotedWho = [];
    isFirstRoundVoting = true;
    playersWithMostVotes = [];
    isPureVillagerExists = false;
    isGunSmithFired = false;
    isNewGame = true;
    gunnedPlayerDuringVoting = -1;
}

// Run with client connects
io.on('connection', socket => {
    var playerList = [];
    socket.on('joinGame', ({username, socketId, state, voteIndex}) => {
        if (socketId==null) {
            const player = playerJoin(socket.id, username, isNewGame);
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
        if (getAlivePlayers().length==playerLength) {
            sortAlivePlayers();
            getAlivePlayers().forEach(e => {
              if (e.isPureVillager) {
                isPureVillagerExists = true;
              }
            });
            proceedToNextNight();
        }
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

    socket.on('gunPlayer', (playerId, isVotingRound) => {
        console.log(`gun playerId: ${typeof playerId}`);
        if (playerId==='0') {
            isGunSmithFired = false;
            noPlayerAction('gun',round);
        } else {
            if (isVotingRound) {
                gunnedPlayerDuringVoting = playerId;
            } else {
                isGunSmithFired = true;
                playerAction(playerId, 'gun', round);
            }
        }
        io.emit('gunComplete', {
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

    socket.on('increaseVote', ({votedPlayer, currentPlayerId, voteIndex}) => {
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

    socket.on('voteNo', (voteIndex) => {
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
        io.emit('message', `Player ${curPlayer} received votes from player(s): ${whoVotedWho}`);
        playersThatVoted = 0;
        if (parseInt(voteIndex)===(playersWithMostVotes.length>1?playersWithMostVotes.length-1:voteblePlayers.length-1)) {
            // calculate vote result
            console.log('voting of this round is over');
            playersWithMostVotes = [];
            var mostVoteCount = 0;
            voteblePlayers.forEach(e => {
                if (e.numOfVotes===mostVoteCount) {
                    playersWithMostVotes.push(e);
                } else if (e.numOfVotes > mostVoteCount) {
                    mostVoteCount = e.numOfVotes;
                    playersWithMostVotes.length=0;
                    playersWithMostVotes.push(e);
                }
            });
            // console.log(`playersWithMostVotes: ${playersWithMostVotes}`);
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
                var votedOutPlayers = [];
                console.log(`voted out player length: ${playersWithMostVotes.length}`);
                playersWithMostVotes.forEach(e => {
                    votedOutPlayers.push(e.playerId);
                });
                io.emit('message', `Player(s) voted out this round: ${votedOutPlayers}`);
                if (isBadGuysWon(isPureVillagerExists)) {
                    io.emit('message', 'Game Over! Bad Guys Won!');
                    resetGlobalVariablesForNewGame();
                } else if (isGoodGuysWon()) {
                    io.emit('message', 'Game Over! Good Guys Won!');
                    resetGlobalVariablesForNewGame();
                } else {
                    io.emit('roomUsers', getAlivePlayers());
                    proceedToNextNight();
                }
            }
        } else {
            // var curPlayer = voteblePlayers[parseInt(voteIndex)].playerId;
            // io.emit('message', `Player ${curPlayer} received votes from player(s): ${whoVotedWho}`);
            whoVotedWho.length=0;
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
    var i;
    for (i=0; i<getAlivePlayers().length; i++) {
        const currentPlayer = getAlivePlayers()[i];
        var role = updateSocketRoomRole(io, currentPlayer);
        if (role==='killer') killerCount++;
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

    // console.log(`killerCount: ${killerCount}, policeCount: ${policeCount}, doctorCount: ${doctorCount}, gunsmithCount: ${gunSmithCount}`);
    io.emit('message', `Night ${round} Starting!`);
    if (killerCount > 0) {
        if (isUsingSocketRoom) {
            io.to('killerGroup').emit('killerAction', {alivePlayers: getAlivePlayers(), round: round});
        } else {
            io.emit('killerAction', {alivePlayers: getAlivePlayers(), round: round});
        }
    } else {
        noPlayerAction('kill',round);
    }
    if (policeCount > 0) {
        if (isUsingSocketRoom) {
            io.to('policeGroup').emit('policeAction', {alivePlayers: getAlivePlayers(), round: round});
        } else {
            io.emit('policeAction', {alivePlayers: getAlivePlayers(), round: round});
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
    const deadPlayerMessage = `Player: ${deadPlayers} has been killed!`;
    io.emit('message', deadPlayerMessage);
    io.emit('roomUsers', getAlivePlayers());
    io.emit('updateCurrentCard', getAlivePlayers());
    if (isBadGuysWon(isPureVillagerExists)) {
        io.emit('message', 'Game Over! Bad Guys Won!');
        resetGlobalVariablesForNewGame();
    } else if (isGoodGuysWon()) {
        io.emit('message', 'Game Over! Good Guys Won!');
        resetGlobalVariablesForNewGame();
    } else {
        // voteblePlayers consists elements of playerId and alreadyVoted flag
        voteblePlayers = getVotePlayers(deadPlayers);
        console.log(`Players can be voted (in order): `);
        // voteblePlayers.forEach(e => {
        //     console.log(e.playerId);
        // });
        if (!isGunSmithFired) {
            console.log('gun smith fire option');
            io.emit('gunSmithVotingRoundAction', getAlivePlayers());
        }
        console.log('no gun smith fire option');
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
