const {
    getAlivePlayers
} = require('./players');

const isSideKillFlag = false;

function updateSocketRoomRole(io, currentPlayer) {
    // var socket = io.of("/").connected[currentPlayer.id];
    var socket = io.of('/').sockets.get(currentPlayer.id);
    if (socket===undefined) {
        console.log(currentPlayer);
        // socket = io.sockets.connected[currentPlayer.id];
    }
    if (currentPlayer.card1==='silencer') {
        return 'silencer';
    } else if (currentPlayer.card1==='' && currentPlayer.card2==='silencer') {
        return 'silencer';
    }
    if (currentPlayer.card1==='killer') {
        // socket.join('killerGroup');
        return 'killer';
    } else if (currentPlayer.card1==='' && currentPlayer.card2==='killer') {
        // socket.leave('policeGroup');
        // socket.leave('doctor');
        // socket.leave('gunSmith');
        // socket.join('killerGroup');
        return 'killer';
    }
    if (currentPlayer.card1==='police') {
        // socket.join('policeGroup');
        return 'police';
    } else if (currentPlayer.card1==='' && currentPlayer.card2==='police') {
        // socket.leave('killerGroup');
        // socket.leave('doctor');
        // socket.leave('gunSmith');
        // socket.join('policeGroup');
        return 'police';
    }
    if (currentPlayer.card1==='doctor') {
        // socket.join('doctor');
        return 'doctor';
    } else if (currentPlayer.card1==='' && currentPlayer.card2==='doctor') {
        // socket.leave('policeGroup');
        // socket.leave('killerGroup');
        // socket.leave('gunSmith');
        // socket.join('doctor');
        return 'doctor';
    }
    if (currentPlayer.card1==='gunSmith') {
        // socket.join('gunSmith');
        return 'gunSmith';
    } else if (currentPlayer.card1==='' && currentPlayer.card2==='gunSmith') {
        // socket.leave('policeGroup');
        // socket.leave('doctor');
        // socket.leave('killerGroup');
        // socket.join('gunSmith');
        return 'gunSmith';
    }
    if (currentPlayer.card1==='' && (currentPlayer.card2==='villager' || currentPlayer.card2==='')) {
        // socket.leave('policeGroup');
        // socket.leave('doctor');
        // socket.leave('killerGroup');
        // socket.leave('gunSmith');
        return 'villager';
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

function isBadGuysWon(isPureVillagerExists) {
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
    if (isSideKillFlag) {
        return (!pureVillagerExists && isPureVillagerExists) || !godExists;
    } else {
        return !godExists && !pureVillagerExists;
    }
    
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

function getRoleCount(card) {
    var count = 0;
    for (i=0; i<getAlivePlayers().length; i++) {
        const currentPlayer = getAlivePlayers()[i];
        if (currentPlayer.card1===card) {
            count++;
        } else if (currentPlayer.card1==='' && currentPlayer.card2===card) {
            count++;
        }
    }
    return count;
}

module.exports = {
    updateSocketRoomRole,
    isBadGuysWon,
    isGoodGuysWon,
    getVotePlayers,
    getRoleCount
}