
function updateSocketRoomRole(io, currentPlayer) {
    // var socket = io.of("/").connected[currentPlayer.id];
    var socket = io.of('/').sockets.get(currentPlayer.id);
    if (socket===undefined) {
        console.log(currentPlayer);
        socket = io.sockets.connected[currentPlayer.id];
    }
    if (currentPlayer.card1==='killer') {
        socket.join('killerGroup');
        return 'killer';
    } else if (currentPlayer.card1==='' && currentPlayer.card2==='killer') {
        socket.leave('policeGroup');
        socket.leave('doctor');
        socket.leave('gunSmith');
        socket.join('killerGroup');
        return 'killer';
    }
    if (currentPlayer.card1==='police') {
        socket.join('policeGroup');
        return 'police';
    } else if (currentPlayer.card1==='' && currentPlayer.card2==='police') {
        socket.leave('killerGroup');
        socket.leave('doctor');
        socket.leave('gunSmith');
        socket.join('policeGroup');
        return 'police';
    }
    if (currentPlayer.card1==='doctor') {
        socket.join('doctor');
        return 'doctor';
    } else if (currentPlayer.card1==='' && currentPlayer.card2==='doctor') {
        socket.leave('policeGroup');
        socket.leave('killerGroup');
        socket.leave('gunSmith');
        socket.join('doctor');
        return 'doctor';
    }
    if (currentPlayer.card1==='gunSmith') {
        socket.join('gunSmith');
        return 'gunSmith';
    } else if (currentPlayer.card1==='' && currentPlayer.card2==='gunSmith') {
        socket.leave('policeGroup');
        socket.leave('doctor');
        socket.leave('killerGroup');
        socket.join('gunSmith');
        return 'gunSmith';
    }
    if (currentPlayer.card1==='' && (currentPlayer.card2==='villager' || currentPlayer.card2==='')) {
        socket.leave('policeGroup');
        socket.leave('doctor');
        socket.leave('killerGroup');
        socket.leave('gunSmith');
        return 'villager';
    }
}

module.exports = {
    updateSocketRoomRole
}