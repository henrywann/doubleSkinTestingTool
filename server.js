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
    updateExistingPlayers
} = require('./utils/players');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

var round = 0;
var voteblePlayers = [];
var allPlayers = [];
var playersThatVoted = 0;
var whoVotedWho = [];
var isFirstRoundVoting = true;

// Run with client connects
io.on('connection', socket => {
    var playerList = [];
    socket.on('joinGame', ({username}) => {
        const player = playerJoin(socket.id, username);
        socket.emit('showIdentity', player);
        // console.log(player);
        allPlayers.push(player);
    });

    socket.on('playerReady', (currentPlayer) => {
        playerReady(socket.id, currentPlayer);
        if (getAlivePlayers().length==6) {
            proceedToNextNight();
        }
    });

    socket.on('killPlayer', (playerId) => {
        playerAction(playerId, 'kill', round);
        io.to('killerGroup').emit('killComplete', {
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
        io.to('policeGroup').emit('checkComplete', {
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
        io.to('doctor').emit('injectComplete', {
            playerId: playerId,
            alivePlayers: getAlivePlayers(),
            round: round
        });
        if (isRoundOver(round)) {
            roundOverAction(round, io);
        }
    });

    socket.on('gunPlayer', (playerId) => {
        console.log(`gun playerId: ${typeof playerId}`);
        if (playerId==='0') {
            noPlayerAction('gun',round);
        } else {
            playerAction(playerId, 'gun', round);
        }
        io.to('gunSmith').emit('gunComplete', {
            playerId: playerId,
            alivePlayers: getAlivePlayers(),
            round: round
        });
        if (isRoundOver(round)) {
            roundOverAction(round, io);
        }
    });

    // socket.on('disconnect', () => {
    //     io.emit('message', 'A user has left');
    // });

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
            if (e.playerId===votedPlayer.toString()) {
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

});

function voteComplete(voteIndex) {
    playersThatVoted++;
    if (playersThatVoted===voteblePlayers.length) {
        playersThatVoted = 0;
        if (parseInt(voteIndex)===voteblePlayers.length-1) {
            // calculate vote result
            console.log('voting of this round is over');
            var playersWithMostVotes = [];
            var mostVoteCount = 0;
            voteblePlayers.forEach(e => {
                if (e.numOfVotes===mostVoteCount) {
                    playersWithMostVotes.push(e.playerId);
                } else if (e.numOfVotes > mostVoteCount) {
                    mostVoteCount = e.numOfVotes;
                    playersWithMostVotes.length=0;
                    playersWithMostVotes.push(e.playerId);
                }
            });
            console.log(`playersWithMostVotes: ${playersWithMostVotes}`);
            if (playersWithMostVotes.length>1 && isFirstRoundVoting) {
                // Restart voting on the players with the same number of votes
                // TODO: need to separate playersWhoCanVote, and voteblePlayers
                voteblePlayers.forEach(e => {
                    e.alreadyVoted = "N";
                    e.numOfVotes = 0;
                });
                io.emit('votePlayer', ({
                    voteThisPlayer: playersWithMostVotes[0], 
                    voteIndex: 0, 
                    voteblePlayers: voteblePlayers,
                    round: round
                }));
                isFirstRoundVoting = false;
            } else {
                playersWithMostVotes.forEach(e => {
                    var deadPlayers = [];
                    populateDeadPlayers(e, deadPlayers);
                    updateExistingPlayers(io);
                });
                io.emit('message', `Player(s) voted out this round: ${playersWithMostVotes}`);
                if (isBadGuysWon()) {
                    io.emit('message', 'Game Over! Bad Guys Won!');
                } else if (isGoodGuysWon()) {
                    io.emit('message', 'Game Over! Good Guys Won!');
                } else {
                    proceedToNextNight();
                }
            }
        } else {
            io.emit('message', `Players who voted yes ${whoVotedWho}`);
            whoVotedWho.length=0;
            io.emit('votePlayer', ({
                voteThisPlayer: voteblePlayers[parseInt(voteIndex)+1], 
                voteIndex: parseInt(voteIndex)+1, 
                voteblePlayers: voteblePlayers,
                round: round
            }));
        }
    }
}

function proceedToNextNight() {
    console.log('proceeding to next round');
    var i;
    for (i=0; i<getAlivePlayers().length; i++) {
        const currentPlayer = getAlivePlayers()[i];
        const socket = io.sockets.connected[currentPlayer.id];
        if (socket===undefined) {
            console.log(currentPlayer);
        }
        if (currentPlayer.card1==='killer') {
            socket.join('killerGroup');
        } else if (currentPlayer.card1==='' && currentPlayer.card2==='killer') {
            socket.leave('policeGroup');
            socket.leave('doctor');
            socket.leave('gunSmith');
            socket.join('killerGroup');
        }
        if (currentPlayer.card1==='police') {
            socket.join('policeGroup');
        } else if (currentPlayer.card1==='' && currentPlayer.card2==='police') {
            socket.leave('killerGroup');
            socket.leave('doctor');
            socket.leave('gunSmith');
            socket.join('policeGroup');
        }
        if (currentPlayer.card1==='doctor') {
            socket.join('doctor');
        } else if (currentPlayer.card1==='' && currentPlayer.card2==='doctor') {
            socket.leave('policeGroup');
            socket.leave('killerGroup');
            socket.leave('gunSmith');
            socket.join('doctor');
        }
        if (currentPlayer.card1==='gunSmith') {
            socket.join('gunSmith');
        } else if (currentPlayer.card1==='' && currentPlayer.card2==='gunSmith') {
            socket.leave('policeGroup');
            socket.leave('doctor');
            socket.leave('killerGroup');
            socket.join('gunSmith');
        }
        if (currentPlayer.card1==='' && (currentPlayer.card2==='villager' || currentPlayer.card2==='')) {
            socket.leave('policeGroup');
            socket.leave('doctor');
            socket.leave('killerGroup');
            socket.leave('gunSmith');
        } 
    }

    // Increasing round count and reseting all voting related global variables
    round++;
    playersThatVoted = 0;
    voteblePlayers = [];
    whoVotedWho = [];
    isFirstRoundVoting = true;

    const killerCount = io.nsps['/'].adapter.rooms['killerGroup']===undefined?0:io.nsps['/'].adapter.rooms['killerGroup'].length;
    const policeCount = io.nsps['/'].adapter.rooms['policeGroup']===undefined?0:io.nsps['/'].adapter.rooms['policeGroup'].length;
    const doctorCount = io.nsps['/'].adapter.rooms['doctor']===undefined?0:io.nsps['/'].adapter.rooms['doctor'].length;
    const gunSmithCount = io.nsps['/'].adapter.rooms['gunSmith']===undefined?0:io.nsps['/'].adapter.rooms['gunSmith'].length;
    // console.log(`killerCount: ${killerCount}, policeCount: ${policeCount}, doctorCount: ${doctorCount}, gunsmithCount: ${gunSmithCount}`);
    io.emit('message', `Night ${round} Starting!`);
    if (killerCount > 0) {
        io.to('killerGroup').emit('killerAction', {alivePlayers: getAlivePlayers(), round: round});
    } else {
        noPlayerAction('kill',round);
    }
    if (policeCount > 0) {
        io.to('policeGroup').emit('policeAction', {alivePlayers: getAlivePlayers(), round: round});
    } else {
        noPlayerAction('check',round);
    }
    if (doctorCount > 0) {
        io.to('doctor').emit('doctorAction', {alivePlayers: getAlivePlayers(), round: round});
    } else {
        noPlayerAction('inject',round);
    }
    if (gunSmithCount > 0) {
        io.to('gunSmith').emit('gunSmithAction', {alivePlayers: getAlivePlayers(), round: round});
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
    if (isBadGuysWon()) {
        io.emit('message', 'Game Over! Bad Guys Won!');
    } else if (isGoodGuysWon()) {
        io.emit('message', 'Game Over! Good Guys Won!');
    } else {
        // voteblePlayers consists elements of playerId and alreadyVoted flag
        voteblePlayers = getVotePlayers(deadPlayers);
        console.log(`Players can be voted (in order): `);
        // voteblePlayers.forEach(e => {
        //     console.log(e.playerId);
        // });
        io.emit('votePlayer', ({
            voteThisPlayer: voteblePlayers[0], 
            voteIndex: 0, 
            voteblePlayers: voteblePlayers, 
            round: round
        }));
    }
}

function getVotePlayers(deadPlayers) {
    var votePlayers=[];
    // console.log(`num of alive players: ${getAlivePlayers().length}`);
    for (var i=0; i < getAlivePlayers().length; i++) {
        var exist = false;
        for (var j=0; j<deadPlayers.length; j++) {
            if ((parseInt(getAlivePlayers()[i].playerId)+1).toString() === deadPlayers[j]) {
                exist = true;
            }
        }
        if (!exist) {
            votePlayers.push((parseInt(getAlivePlayers()[i].playerId)+1).toString());
        }
    }
    var voteOrder = [];
    var firstDead = deadPlayers[0];
    if (firstDead===undefined) {
        firstDead = Math.floor(Math.random() * (votePlayers.length));
    }
    for (var i=0; i<votePlayers.length; i++) {
        if (parseInt(votePlayers[i]) > parseInt(firstDead)) {
            var l1 = votePlayers.slice(i);
            var l2 = votePlayers.slice(0, i);
            voteOrder = l1.concat(l2);
            break;
        }
    }
    if (voteOrder.length===0) {
        voteOrder = votePlayers;
    } 
    var result = [];
    voteOrder.forEach(e => {
        result.push({playerId: e, numOfVotes: 0, alreadyVoted: "N"});
    });
    return result;
}

function isBadGuysWon() {
    var pureVillagerExists = false;
    var godExists = false;
    getAlivePlayers().forEach(e => {
        if (e.isPureVillager) {
            pureVillagerExists = true;
        }
        if (e.side > 0) {
            godExists = true;
        }
    });
    return !pureVillagerExists || !godExists;
}

function isGoodGuysWon() {
    var result = true;
    getAlivePlayers().forEach(e => {
        if (e.side < 0) {
            result = false;
        }
    });
    return result;
}

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
