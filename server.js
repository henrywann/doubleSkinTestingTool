const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const {
    playerJoin,
    playerReady,
    killPlayer,
    checkPlayer
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
            console.log("starting game!");
            round++;
            io.emit('message', "Game Starting!");
            io.to('killerGroup').emit('killerAction', playerList);
            io.to('policeGroup').emit('policeAction', playerList);
        }
    });

    socket.on('killPlayer', (playerId) => {
        killPlayer(playerId, round);
        io.to('killerGroup').emit('killComplete', ({playerId, alivePlayers}));
    });

    socket.on('checkPlayer', (playerId) => {
        checkPlayer(playerId, round);
        io.to('policeGroup').emit('checkComplete', ({playerId, alivePlayers}));
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
