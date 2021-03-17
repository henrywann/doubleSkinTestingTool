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
    getAlivePlayers
} = require('./utils/players');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

var round = 0;
var voteblePlayers = [];
// Run with client connects
io.on('connection', socket => {
    var playerList = [];
    socket.on('joinGame', ({username}) => {
        const player = playerJoin(socket.id, username);
        socket.emit('showIdentity', player);
        // console.log(player);
    });

    socket.on('playerReady', (currentPlayer) => {
        // console.log(currentPlayer);
        if (currentPlayer.card1==='killer') {
            socket.join('killerGroup');
        }
        if (currentPlayer.card1==='police') {
            socket.join('policeGroup');
        }
        if (currentPlayer.card1==='doctor') {
            socket.join('doctor');
        }
        if (currentPlayer.card1==='gunSmith') {
            socket.join('gunSmith');
        }
        playerReady(socket.id, currentPlayer);
        if (getAlivePlayers().length==6) {
            round++;
            console.log("starting game!");
            const killerCount = io.nsps['/'].adapter.rooms['killerGroup']===undefined?0:Object.keys(io.nsps['/'].adapter.rooms['killerGroup']).length;
            const policeCount = io.nsps['/'].adapter.rooms['policeGroup']===undefined?0:Object.keys(io.nsps['/'].adapter.rooms['policeGroup']).length;
            const doctorCount = io.nsps['/'].adapter.rooms['doctor']===undefined?0:Object.keys(io.nsps['/'].adapter.rooms['doctor']).length;
            const gunSmithCount = io.nsps['/'].adapter.rooms['gunSmith']===undefined?0:Object.keys(io.nsps['/'].adapter.rooms['gunSmith']).length;
            io.emit('message', "Game Starting!");
            if (killerCount > 0) {
                io.to('killerGroup').emit('killerAction', getAlivePlayers());
            } else {
                noPlayerAction('kill',round);
            }
            if (policeCount > 0) {
                io.to('policeGroup').emit('policeAction', getAlivePlayers());
            } else {
                noPlayerAction('check',round);
            }
            if (doctorCount > 0) {
                io.to('doctor').emit('doctorAction', getAlivePlayers());
            } else {
                noPlayerAction('inject',round);
            }
            if (gunSmithCount > 0) {
                io.to('gunSmith').emit('gunSmithAction', getAlivePlayers());
            } else {
                noPlayerAction('gun',round);
            }
            if (isRoundOver(round)) {
                roundOverAction(round, io);
            }
        }
    });

    socket.on('killPlayer', (playerId) => {
        playerAction(playerId, 'kill', round);
        // console.log(getAlivePlayers());
        io.to('killerGroup').emit('killComplete', {
            playerId: playerId, 
            alivePlayers: getAlivePlayers()
        });
        if (isRoundOver(round)) {
            roundOverAction(round, io);
        }
    });

    socket.on('checkPlayer', (playerId) => {
        playerAction(playerId, 'check', round);
        io.to('policeGroup').emit('checkComplete', {
            playerId: playerId,
            alivePlayers: getAlivePlayers()
        });
        if (isRoundOver(round)) {
            roundOverAction(round, io);
        }
    });

    socket.on('injectPlayer', (playerId) => {
        playerAction(playerId, 'inject', round);
        io.to('doctor').emit('injectComplete', {
            playerId: playerId,
            alivePlayers: getAlivePlayers()
        });
        if (isRoundOver(round)) {
            roundOverAction(round, io);
        }
    });

    socket.on('gunPlayer', (playerId) => {
        if (playerId==='0') {
            noPlayerAction('gun',round);
        } else {
            playerAction(playerId, 'gun', round);
        }
        io.to('gunSmith').emit('gunComplete', {
            playerId: playerId,
            alivePlayers: getAlivePlayers()
        });
        if (isRoundOver(round)) {
            roundOverAction(round, io);
        }
    });

    // socket.on('disconnect', () => {
    //     io.emit('message', 'A user has left');
    // });

    socket.on('chatMessage', (msg) => {
        io.emit('message', msg);
    });

});

function roundOverAction(round, io) {
    console.log('Round Over');
    const deadPlayers = calculateRoundResult(round);
    const deadPlayerMessage = `Player: ${deadPlayers} has been killed!`;
    io.emit('message', deadPlayerMessage);
    if (isBadGuysWon()) {
        io.emit('message', 'Game Over! Bad Guys Won!');
    } else if (isGoodGuysWon()) {
        io.emit('message', 'Game Over! Good Guys Won!');
    } else {
        // voteblePlayers consists elements of String
        voteblePlayers = getVotePlayers(deadPlayers);
        console.log(`Players can be voted (in order): ${voteblePlayers}`);
        io.emit('votePlayer', voteblePlayers);
    }
}

function getVotePlayers(deadPlayers) {
    var votePlayers=[];
    for (var i=0; i < getAlivePlayers().length; i++) {
        var exist = false;
        for (var j=0; j<deadPlayers.length; j++) {
            if ((parseInt(getAlivePlayers()[i].playerId)+1).toString() === deadPlayers[j]) {
                exist = true;
            }
        }
        if (!exist) {
            votePlayers.push((i+1).toString());
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
    if (!voteOrder) {
        voteOrder = votePlayers;
    }
    return voteOrder;
}

function isBadGuysWon() {
    return false;
}

function isGoodGuysWon() {
    return false;
}

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
