const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const {
    playerJoin,
    playerReady,
    playerAction,
    noPlayerAction,
    isRoundOver
} = require('./utils/players');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

var round = 0;
var alivePlayers =[];
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
        playerList = playerReady(socket.id, currentPlayer);
        alivePlayers = playerList;
        // console.log(playerList);
        if (playerList.length==6) {
            round++;
            console.log("starting game!");
            const killerCount = io.nsps['/'].adapter.rooms['killerGroup']===undefined?0:Object.keys(io.nsps['/'].adapter.rooms['killerGroup']).length;
            const policeCount = io.nsps['/'].adapter.rooms['policeGroup']===undefined?0:Object.keys(io.nsps['/'].adapter.rooms['policeGroup']).length;
            const doctorCount = io.nsps['/'].adapter.rooms['doctor']===undefined?0:Object.keys(io.nsps['/'].adapter.rooms['doctor']).length;
            const gunSmithCount = io.nsps['/'].adapter.rooms['gunSmith']===undefined?0:Object.keys(io.nsps['/'].adapter.rooms['gunSmith']).length;
            io.emit('message', "Game Starting!");
            if (killerCount > 0) {
                io.to('killerGroup').emit('killerAction', playerList);
            } else {
                noPlayerAction('kill',round);
            }
            if (policeCount > 0) {
                io.to('policeGroup').emit('policeAction', playerList);
            } else {
                noPlayerAction('check',round);
            }
            if (doctorCount > 0) {
                io.to('doctor').emit('doctorAction', playerList);
            } else {
                noPlayerAction('inject',round);
            }
            if (gunSmithCount > 0) {
                io.to('gunSmith').emit('gunSmithAction', playerList);
            } else {
                noPlayerAction('gun',round);
            }
        }
    });

    socket.on('killPlayer', (playerId) => {
        playerAction(playerId, 'kill', round);
        io.to('killerGroup').emit('killComplete', ({playerId, alivePlayers}));
        if (isRoundOver(round)) {
            console.log('Round Over');
        }
    });

    socket.on('checkPlayer', (playerId) => {
        playerAction(playerId, 'check', round);
        io.to('policeGroup').emit('checkComplete', ({playerId, alivePlayers}));
        if (isRoundOver(round)) {
            console.log('Round Over');
        }
    });

    socket.on('injectPlayer', (playerId) => {
        playerAction(playerId, 'inject', round);
        io.to('doctor').emit('injectComplete', ({playerId, alivePlayers}));
        if (isRoundOver(round)) {
            console.log('Round Over');
        }
    });

    socket.on('gunPlayer', (playerId) => {
        playerAction(playerId, 'gun', round);
        io.to('gunSmith').emit('gunComplete', ({playerId, alivePlayers}));
        if (isRoundOver(round)) {
            console.log('Round Over');
        }
    });

    socket.on('voteReady', (votedPlayer) => {

    });



    // socket.broadcast.emit();

    // socket.on('disconnect', () => {
    //     io.emit('message', 'A user has left');
    // });

    socket.on('chatMessage', (msg) => {
        io.emit('message', msg);
    });

});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
