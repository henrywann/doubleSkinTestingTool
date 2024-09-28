const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");
const socket = io();
const userList = document.getElementById("users");
const gunSmithAction = document.getElementById("activateGun");
var currentPlayer;
var switchOrder = document.getElementById("switchOrder");
switchOrder.addEventListener("click", clickSwitchOrder);
const ready = document.getElementById("ready");
ready.addEventListener("click", readyToPlay);
const restart = document.getElementById("restartBtn");
restart.addEventListener("click", restartGame);

const { username, numOfPlayers } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
socket.on("connect", () => {
  console.log(socket.id);
});
// Join Game
socket.emit(
  "joinGame",
  (joinGame = {
    username: username,
    numOfPlayers: numOfPlayers,
    socketId: sessionStorage.getItem("socketId"),
    state: sessionStorage.getItem("state"),
    voteIndex: sessionStorage.getItem("voteIndex"),
  })
);

/**
 * This section handles the general gameplay and display message events sent from the server
 */

socket.on("restartGameForAll", () => {
  sessionStorage.clear();
  window.location.href = "index.html";
});
// Display player cards
socket.on("showIdentity", (player) => {
  outputIdentity(player);
});

socket.on("roomUsers", (users) => {
  outputUsers(users);
});

socket.on("playerReadyCheckmark", (allPlayers) => {
  outputUsers(allPlayers);
});

// Displays player typed messages
socket.on("playerChatmessage", ({ message, playername, playerId }) => {
  outputPlayerChatMessage(message, playername, playerId);
});

// Displays game messages
socket.on("message", (message) => {
  outputMessage(message);
});

/**
 * This section handles the prompt of player's actions sent from the server at the beginning of night time
 */

socket.on("revengerAction", () => {
  if (sessionStorage.getItem("isRevenger") === "true") {
    outputRevengerSelection();
  }
});

socket.on("completeRevengeAction", ({ playerId, cardId }) => {
  console.log(`playerId: ${playerId}`);
  if (sessionStorage.getItem("isRevenger") === "true") {
    for (var i = 0; i < 7; i++) {
      document.getElementById(`revenge${i + 1}-card1`).disabled = true;
      document.getElementById(`revenge${i + 1}-card2`).disabled = true;
    }
  }
  if (sessionStorage.getItem("playerId") === playerId.toString()) {
    const message = `您的第${cardId}张牌被复仇者选中！`;
    outputMessage(message);
  }
});

socket.on("silencerAction", ({ alivePlayers, round }) => {
  if (sessionStorage.getItem("currentCard") === "silencer") {
    sessionStorage.setItem("state", "silencerAction");
    outputSilencerSelection(alivePlayers, round);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

socket.on("turtleAction", ({ alivePlayers, round }) => {
  console.log("received turtle action");
  if (sessionStorage.getItem("currentCard") === "turtle") {
    sessionStorage.setItem("state", "turtleAction");
    outputTurtleSelection(round);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

socket.on("killerAction", ({ alivePlayers, round, killerCount }) => {
  if (sessionStorage.getItem("currentCard") === "killer") {
    sessionStorage.setItem("state", "killerAction");
    sessionStorage.setItem("isInitiatingKill", false);
    outputKillerSelection(alivePlayers, round, killerCount);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

socket.on("bioChemistAction", ({ alivePlayers, round, bioChemistCount }) => {
  if (sessionStorage.getItem("currentCard") === "bioChemist") {
    sessionStorage.setItem("state", "bioChemistAction");
    outputBioChemistSelection(alivePlayers, round, bioChemistCount);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

socket.on("policeAction", ({ alivePlayers, round, policeCount }) => {
  if (sessionStorage.getItem("currentCard") === "police") {
    sessionStorage.setItem("state", "policeAction");
    sessionStorage.setItem("isInitiatingCheck", false);
    outputPoliceSelection(alivePlayers, round, policeCount);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

socket.on("doctorAction", ({ alivePlayers, round }) => {
  if (sessionStorage.getItem("currentCard") === "doctor") {
    sessionStorage.setItem("state", "doctorAction");
    outputDoctorSelection(alivePlayers, round);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

socket.on("gunSmithAction", ({ alivePlayers, round, isVotingRound }) => {
  if (sessionStorage.getItem("currentCard") === "gunSmith") {
    sessionStorage.setItem("state", "gunSmithAction");
    outputGunSmithSelection(alivePlayers, round, isVotingRound);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

socket.on("priestAction", ({ alivePlayers, round }) => {
  if (sessionStorage.getItem("currentCard") === "priest") {
    sessionStorage.setItem("state", "priestAction");
    outputPriestSelection(alivePlayers, round);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

socket.on("verifyKill", ({ playerIdTriggeredEvent, playerIdBeingKilled, alivePlayers, round }) => {
  if (
    sessionStorage.getItem("currentCard") === "killer" &&
    sessionStorage.getItem("playerId") !== playerIdTriggeredEvent
  ) {
    sessionStorage.setItem("state", "killerVerify");
    outputVerifyKill(playerIdBeingKilled, alivePlayers, round);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

socket.on("verifyCheck", ({ playerIdTriggeredEvent, playerIdBeingChecked, alivePlayers, round }) => {
  if (
    sessionStorage.getItem("currentCard") === "police" &&
    sessionStorage.getItem("playerId") !== playerIdTriggeredEvent
  ) {
    sessionStorage.setItem("state", "policeVerify");
    outputVerifyCheck(playerIdBeingChecked, alivePlayers, round);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  // if (sessionStorage.getItem("currentCard")==="police" && sessionStorage.getItem("isInitiatingCheck")==='false') {
  //     sessionStorage.setItem("state", "policeVerify");
  //     outputVerifyCheck(playerId, alivePlayers, round);
  //     chatMessages.scrollTop = chatMessages.scrollHeight;
  // }
});

socket.on("gunComplete", ({ playerId, alivePlayers, round }) => {
  if (sessionStorage.getItem("currentCard") === "gunSmith") {
    sessionStorage.setItem("state", "gunComplete");
    alivePlayers.forEach((e) => {
      console.log(`gunSmith${e.playerId + 1}-${round}`);
      document.getElementById(`gunSmith${e.playerId + 1}-${round}`).disabled = true;
    });
    var noGunBtn = document.getElementById(`noGun-${round}`);
    noGunBtn.disabled = true;
    if (playerId !== "0") {
      outputMessage(`玩家${playerId}被崩了!`);
    } else {
      outputMessage("本轮选择不发动技能");
    }
  }
});

socket.on("reviveComplete", ({ playerId, alivePlayers, round }) => {
  if (sessionStorage.getItem("currentCard") === "priest") {
    sessionStorage.setItem("state", "reviveComplete");
    alivePlayers.forEach((e) => {
      if (e.card1 === "") {
        document.getElementById(`priest${e.playerId + 1}-${round}`).disabled = true;
      }
    });
    document.getElementById(`noRevive-${round}`).disabled = true;
    if (playerId !== "0") {
      outputMessage(`玩家${playerId}将在下一晚复活!`);
    } else {
      outputMessage("本轮选择不发动技能");
    }
  }
});

socket.on("injectComplete", ({ playerId, alivePlayers, round }) => {
  if (sessionStorage.getItem("currentCard") === "doctor") {
    sessionStorage.setItem("state", "injectComplete");
    alivePlayers.forEach((e) => {
      document.getElementById(`doctor${e.playerId + 1}-${round}`).disabled = true;
    });
    outputMessage(`玩家${playerId}被扎了!`);
  }
});

socket.on("poisonReleaseComplete", ({ playerId, alivePlayers, round }) => {
  if (sessionStorage.getItem("currentCard") === "bioChemist") {
    sessionStorage.setItem("state", "releaseComplete");
    alivePlayers.forEach((e) => {
      document.getElementById(`bioChemist${e.playerId + 1}-${round}`).disabled = true;
    });
    var noReleaseBtn = document.getElementById(`noRelease-${round}`);
    noReleaseBtn.disabled = true;
    if (playerId !== "0") {
      outputMessage(`玩家${playerId}被释放了毒气!并且毒气扩散到了左右玩家！`);
    } else {
      outputMessage("本轮选择不发动技能");
    }
  }
});

socket.on("killComplete", ({ playerId, alivePlayers, round }) => {
  if (sessionStorage.getItem("currentCard") === "killer") {
    sessionStorage.setItem("state", "killComplete");
    alivePlayers.forEach((e) => {
      document.getElementById(`kill${e.playerId + 1}-${round}`).disabled = true;
    });
    const message = `玩家${playerId}被杀死!`;
    outputMessage(message);
  }
});

socket.on("silenceComplete", ({ playerId, alivePlayers, round }) => {
  if (sessionStorage.getItem("currentCard") === "silencer") {
    sessionStorage.setItem("state", "silenceComplete");
    alivePlayers.forEach((e) => {
      document.getElementById(`silence${e.playerId + 1}-${round}`).disabled = true;
    });
    var noSilenceBtn = document.getElementById(`noSilence-${round}`);
    noSilenceBtn.disabled = true;
    if (playerId !== "0") {
      outputMessage(`玩家${playerId}被禁言!`);
    } else {
      outputMessage("本轮选择不发动技能");
    }
  }
});

socket.on("retractComplete", ({ round, isRetracted }) => {
  if (sessionStorage.getItem("currentCard") === "turtle") {
    sessionStorage.setItem("state", "retractComplete");
    document.getElementById(`yesRetract-${round}`).disabled = true;
    document.getElementById(`noRetract-${round}`).disabled = true;
    const message = isRetracted ? "缩头乌龟！白天不能投票！" : "勇敢的乌龟！白天可以投票！";
    outputMessage(message);
  }
});

socket.on("checkComplete", ({ playerId, alivePlayers, round }) => {
  if (sessionStorage.getItem("currentCard") === "police") {
    sessionStorage.setItem("state", "checkComplete");
    alivePlayers.forEach((e) => {
      document.getElementById(`police${e.playerId + 1}-${round}`).disabled = true;
    });
    alivePlayers.forEach((e) => {
      if (e.playerId === playerId - 1) {
        const currentCard = e.card1 === "" ? e.card2 : e.card1;
        const currentId =
          currentCard === "killer" || currentCard === "silencer" || currentCard === "bioChemist" ? "坏人" : "好人";
        const message = `玩家${playerId}的目前身份是${currentId}`;
        outputMessage(message);
      }
    });
  }
});

socket.on("updateRevivedCard", ({ alivePlayers }) => {
  console.log("entering updateRevivedCard");
  alivePlayers.forEach((e) => {
    if ((e.playerId + 1).toString() === sessionStorage.getItem("playerId")) {
      if (e.isRevived) {
        sessionStorage.setItem("currentCard", e.cardToBeRevived);
        const message = "你今天晚上被牧师复活了！";
        outputMessage(message);
      }
    }
  });
});

socket.on("revertRevivedCard", ({ alivePlayers }) => {
  console.log("entering revertRevivedCard");
  alivePlayers.forEach((e) => {
    if ((e.playerId + 1).toString() === sessionStorage.getItem("playerId")) {
      if (e.isRevived) {
        sessionStorage.setItem("currentCard", e.card2);
      }
    }
  });
});

/**
 * This section handles the prompt of player's voting options sent from the server during day time
 */

socket.on("votePlayer", ({ voteThisPlayer, voteIndex, voteblePlayers, round, isFirstRoundVoting }) => {
  sessionStorage.setItem("state", "votePlayer");
  sessionStorage.setItem("voteIndex", voteIndex);
  voteblePlayers.forEach((e) => {
    if (e.playerId === sessionStorage.getItem("playerId")) {
      if (e.alreadyVoted === "Y") {
        voteNo(voteThisPlayer.playerId, round);
      } else {
        outputVoteSelection(voteThisPlayer, round, isFirstRoundVoting);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }
  });
});

socket.on("updateCurrentCard", ({ alivePlayers, nightOrDay }) => {
  console.log("entering updateCurrentCard");
  var isPlayerAlive = false;
  alivePlayers.forEach((e) => {
    if ((e.playerId + 1).toString() === sessionStorage.getItem("playerId")) {
      isPlayerAlive = true;
      // Resetting isRetracted to false for turtle for next night
      if (sessionStorage.getItem("currentCard") === "turtle" && nightOrDay === "turningNight") {
        sessionStorage.setItem("isRetracted", false);
      }
      if (
        (sessionStorage.getItem("currentCard") === "revenger" && e.card1 === "killer") ||
        (sessionStorage.getItem("currentCard") === "revenger" && e.card1 === "" && e.card2 == "killer")
      ) {
        sessionStorage.setItem("currentCard", "killer");
      }
      if (e.card1 === "") {
        console.log("card1 is empty, setting card2 to currentCard");
        sessionStorage.setItem("currentCard", e.card2);
      }
    }
  });
  if (!isPlayerAlive) {
    sessionStorage.setItem("currentCard", "");
  }
});

socket.on("gunSmithVotingRoundAction", ({ alivePlayers, round, isVotingRound }) => {
  console.log("entering gunSmithVotingRoundAction");
  if (sessionStorage.getItem("currentCard") === "gunSmith") {
    sessionStorage.setItem("state", "gunSmithAction");
    outputGunSmithSelection(alivePlayers, round, isVotingRound);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});

socket.on("voteComplete", ({ currentPlayer, round, isFirstRoundVoting, playerBeingVoted }) => {
  if (sessionStorage.getItem("playerId") === currentPlayer) {
    if (document.getElementById(`voteYes${playerBeingVoted}-${round}-${isFirstRoundVoting}`) != null) {
      document.getElementById(`voteYes${playerBeingVoted}-${round}-${isFirstRoundVoting}`).disabled = true;
    }
    if (document.getElementById(`voteNo${playerBeingVoted}-${round}-${isFirstRoundVoting}`) != null) {
      document.getElementById(`voteNo${playerBeingVoted}-${round}-${isFirstRoundVoting}`).disabled = true;
    }
  }
});

// Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  let msg = e.target.elements.msg.value;
  msg = msg.trim();
  if (!msg) {
    return false;
  }
  socket.emit("chatMessage", { msg, username });
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

function outputIdentity(player) {
  currentPlayer = player;
  console.log(currentPlayer);
  // check if admin-message div already exist
  if_admin_exist = document.getElementsByClassName("admin-message").length > 0;
  if (if_admin_exist) {
    admin_div = document.getElementsByClassName("admin-message")[0];
    console.log(admin_div);
    admin_div.innerHTML = `<p class="meta">Admin</p>
        <p class="text">
            Hello [玩家${player.playerId + 1}] ${player.username}, 你的身份牌是： \n
            身份1: ${player.card1Chinese}
            身份2: ${player.card2Chinese}
        </p>`;
    sessionStorage.setItem("playerId", player.playerId + 1);
    sessionStorage.setItem("socketId", player.id);
  } else {
    const div = document.createElement("div");
    div.classList.add("admin-message");
    div.innerHTML = `<p class="meta">Admin</p>
        <p class="text">
            Hello [玩家${player.playerId + 1}] ${player.username}, 你的身份牌是： \n
            身份1: ${player.card1Chinese}
            身份2: ${player.card2Chinese}
        </p>`;
    document.querySelector(".chat-messages").appendChild(div);
    sessionStorage.setItem("playerId", player.playerId + 1);
    sessionStorage.setItem("socketId", player.id);
  }
  if (player.card1 === "revenger" || player.card2 === "revenger") {
    sessionStorage.setItem("isRevenger", true);
    sessionStorage.setItem("isRevengerActivated", false);
  }
}

function outputRevengerSelection() {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="text">复仇者请选择<p>`;
  for (var i = 0; i < 7; i++) {
    div.insertAdjacentHTML(
      "beforeEnd",
      `<button class="actionBtn" id="revenge${i + 1}-card1" onclick="revenge(${i + 1}, 1)"> 玩家${i + 1}身份1 </button>`
    );
    div.insertAdjacentHTML(
      "beforeEnd",
      `<button class="actionBtn" id="revenge${i + 1}-card2" onclick="revenge(${i + 1}, 2)"> 玩家${i + 1}身份2 </button>`
    );
  }
  document.querySelector(".chat-messages").appendChild(div);
}

function revenge(playerId, cardId) {
  socket.emit("chooseRevenge", { playerId: playerId, cardId: cardId });
}

function outputVoteSelection(playerTobeVoted, round, isFirstRoundVoting) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="text">是否投玩家${playerTobeVoted.playerId}？<p>`;
  // div.insertAdjacentHTML(
  //   "beforeEnd",
  //   `<button id="voteYes${playerTobeVoted.playerId}-${round}-${isFirstRoundVoting}"
  //                                       onclick="voteYes(${playerTobeVoted.playerId},${round},${isFirstRoundVoting})"> &nbsp;是&nbsp; </button>
  //                                       <button id="voteNo${playerTobeVoted.playerId}-${round}-${isFirstRoundVoting}"
  //                                       onclick="voteNo(${playerTobeVoted.playerId},${round},${isFirstRoundVoting})"> &nbsp;否&nbsp; </button>`
  // );
  if (sessionStorage.getItem("currentCard") !== "turtle" || sessionStorage.getItem("isRetracted") === "false") {
    div.insertAdjacentHTML(
      "beforeEnd",
      `<button id="voteYes${playerTobeVoted.playerId}-${round}-${isFirstRoundVoting}" onclick="voteYes(${playerTobeVoted.playerId},${round},${isFirstRoundVoting})"> &nbsp;是&nbsp; </button>`
    );
  }
  div.insertAdjacentHTML(
    "beforeEnd",
    `<button id="voteNo${playerTobeVoted.playerId}-${round}-${isFirstRoundVoting}" onclick="voteNo(${playerTobeVoted.playerId},${round},${isFirstRoundVoting})"> &nbsp;否&nbsp; </button>`
  );
  document.querySelector(".chat-messages").appendChild(div);
}

function voteYes(player, round, isFirstRoundVoting) {
  const currentPlayerId = sessionStorage.getItem("playerId");
  const voteIndex = sessionStorage.getItem("voteIndex");
  socket.emit("increaseVote", {
    votedPlayer: player,
    currentPlayerId: currentPlayerId,
    voteIndex: voteIndex,
    round: round,
  });
}

function voteNo(player, round, isFirstRoundVoting) {
  console.log("clicked on voteNo");
  const voteIndex = sessionStorage.getItem("voteIndex");
  const playerId = sessionStorage.getItem("playerId");
  socket.emit("voteNo", { voteIndex: voteIndex, playerId: playerId.toString() });
}

function outputVerifyKill(playerId, alivePlayers, round) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="text">确认要杀玩家${playerId}吗?<p>`;
  div.insertAdjacentHTML(
    "beforeEnd",
    `<button id="killYes${playerId}-${round}" 
                                        onclick="killYes(${playerId},${round})"> &nbsp;是&nbsp; </button>
                                        <button id="killNo${playerId}-${round}" 
                                        onclick="killNo(${playerId})"> &nbsp;否&nbsp; </button>`
  );
  document.querySelector(".chat-messages").appendChild(div);
}

function killYes(playerId, round) {
  document.getElementById(`killYes${playerId}-${round}`).disabled = true;
  document.getElementById(`killNo${playerId}-${round}`).disabled = true;
  killPlayer(playerId);
}

function killNo(playerId) {
  socket.emit("chooseKillAgain", playerId.toString());
}

function outputVerifyCheck(playerId, alivePlayers, round) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="text">确认要验玩家${playerId}吗?<p>`;
  div.insertAdjacentHTML(
    "beforeEnd",
    `<button id="checkYes${playerId}-${round}" 
                                        onclick="checkYes(${playerId},${round})"> &nbsp;是&nbsp;</button>
                                        <button id="checkNo${playerId}-${round}" 
                                        onclick="checkNo(${playerId})"> &nbsp;否&nbsp; </button>`
  );
  document.querySelector(".chat-messages").appendChild(div);
}

function checkYes(playerId, round) {
  document.getElementById(`checkYes${playerId}-${round}`).disabled = true;
  document.getElementById(`checkNo${playerId}-${round}`).disabled = true;
  checkPlayer(playerId);
}

function checkNo(playerId) {
  socket.emit("chooseCheckAgain", playerId.toString());
}

function outputGunSmithSelection(alivePlayers, round, isVotingRound) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = '<p class="text">Gun Smith 请开枪<p>';
  alivePlayers.forEach((e) => {
    div.insertAdjacentHTML(
      "beforeEnd",
      `<button class="actionBtn" id="gunSmith${e.playerId + 1}-${round}" onclick="gunPlayer(${
        e.playerId + 1
      }, ${isVotingRound})"> ${e.playerId + 1} </button>`
    );
  });
  if (!isVotingRound)
    div.insertAdjacentHTML(
      "beforeEnd",
      `<button class="actionBtn" id="noGun-${round}" onclick="gunPlayer(0,false)">不开枪 </button>`
    );
  document.querySelector(".chat-messages").appendChild(div);
}

function outputPriestSelection(alivePlayers, round) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = '<p class="text">牧师请复活玩家<p>';
  alivePlayers.forEach((e) => {
    if (e.card1 === "") {
      div.insertAdjacentHTML(
        "beforeEnd",
        `<button class="actionBtn" id="priest${e.playerId + 1}-${round}" onclick="revivePlayer(${e.playerId + 1})"> ${
          e.playerId + 1
        } </button>`
      );
    }
  });
  div.insertAdjacentHTML(
    "beforeEnd",
    `<button class="actionBtn" id="noRevive-${round}" onclick="revivePlayer(0)"> 不复活 </button>`
  );
  document.querySelector(".chat-messages").appendChild(div);
}

function outputDoctorSelection(alivePlayers, round) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = '<p class="text">医生请扎人<p>';
  alivePlayers.forEach((e) => {
    div.insertAdjacentHTML(
      "beforeEnd",
      `<button class="actionBtn" id="doctor${e.playerId + 1}-${round}" onclick="injectPlayer(${e.playerId + 1})"> ${
        e.playerId + 1
      } </button>`
    );
  });
  document.querySelector(".chat-messages").appendChild(div);
}

function outputPoliceSelection(alivePlayers, round, policeCount) {
  var teamMate = getTeamMate(alivePlayers, policeCount, "police");
  const div = document.createElement("div");
  div.classList.add("message");
  if (teamMate !== -1) {
    div.innerHTML = `<p class="text">玩家 ${teamMate} 是你的队友. 警察请验人<p>`;
  } else {
    div.innerHTML = '<p class="text">警察请验人<p>';
  }
  alivePlayers.forEach((e) => {
    div.insertAdjacentHTML(
      "beforeEnd",
      `<button class="actionBtn" id="police${e.playerId + 1}-${round}" onclick="checkPlayerRouter(${
        e.playerId + 1
      }, ${policeCount})"> ${e.playerId + 1} </button>`
    );
  });
  document.querySelector(".chat-messages").appendChild(div);
}

function outputKillerSelection(alivePlayers, round, killerCount) {
  var teamMate = getTeamMate(alivePlayers, killerCount, "killer");

  const div = document.createElement("div");
  div.classList.add("message");
  if (teamMate !== -1) {
    div.innerHTML = `<p class="text">玩家 ${teamMate} 是你的队友. 杀手请杀人<p>`;
  } else {
    div.innerHTML = '<p class="text">杀手请杀人<p>';
  }
  alivePlayers.forEach((e) => {
    div.insertAdjacentHTML(
      "beforeEnd",
      `<button class="actionBtn" id="kill${e.playerId + 1}-${round}" onclick="killerPlayerRouter(${
        e.playerId + 1
      }, ${killerCount})"> ${e.playerId + 1} </button>`
    );
  });
  document.querySelector(".chat-messages").appendChild(div);
}

function outputBioChemistSelection(alivePlayers, round, bioChemistCount) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = '<p class="text">生化学家请放毒<p>';

  alivePlayers.forEach((e) => {
    div.insertAdjacentHTML(
      "beforeEnd",
      `<button class="actionBtn" id="bioChemist${e.playerId + 1}-${round}" onclick="releasePoison(${
        e.playerId + 1
      })"> ${e.playerId + 1} </button>`
    );
  });
  div.insertAdjacentHTML(
    "beforeEnd",
    `<button class="actionBtn" id="noRelease-${round}" onclick="releasePoison(0)"> 不放毒 </button>`
  );
  document.querySelector(".chat-messages").appendChild(div);
}

function getTeamMate(alivePlayers, count, card) {
  var teamMate = -1;
  if (count > 1) {
    alivePlayers.forEach((e) => {
      if ((e.playerId + 1).toString() !== sessionStorage.getItem("playerId")) {
        if (e.card1 === card || (e.card1 === "" && e.card2 === card)) {
          teamMate = e.playerId + 1;
        }
      }
    });
  }
  return teamMate;
}

function outputSilencerSelection(alivePlayers, round) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = '<p class="text">禁言请禁言<p>';
  alivePlayers.forEach((e) => {
    div.insertAdjacentHTML(
      "beforeEnd",
      `<button class="actionBtn" id="silence${e.playerId + 1}-${round}" onclick="silencePlayer(${e.playerId + 1})"> ${
        e.playerId + 1
      } </button>`
    );
  });
  div.insertAdjacentHTML(
    "beforeEnd",
    `<button class="actionBtn" id="noSilence-${round}" onclick="silencePlayer(0)"> 不禁言 </button>`
  );
  document.querySelector(".chat-messages").appendChild(div);
}

function outputTurtleSelection(round) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = '<p class="text">乌龟是否缩头<p>';
  div.insertAdjacentHTML(
    "beforeEnd",
    `<button class="actionBtn" id="yesRetract-${round}" onclick="retract(true)"> 是 </button>`
  );
  div.insertAdjacentHTML(
    "beforeEnd",
    `<button class="actionBtn" id="noRetract-${round}" onclick="retract(false)"> 否 </button>`
  );
  document.querySelector(".chat-messages").appendChild(div);
}

/***************************
 * 
 * On click action functions
 * 
 ***************************/



function retract(isRetracted) {
  if (isRetracted) {
    sessionStorage.setItem("isRetracted", true);
  } else {
    sessionStorage.setItem("isRetracted", false);
  }
  const currentPlayerId = sessionStorage.getItem("playerId");
  socket.emit("retractSelected", {
    currentPlayerId: currentPlayerId.toString(),
    isRetracted: isRetracted,
  });
}

function injectPlayer(injectedPlayer) {
  socket.emit("injectPlayer", injectedPlayer.toString());
}

function checkPlayerRouter(playerId, policeCount) {
  if (policeCount > 1) {
    verifyCheckPlayer(playerId);
  } else {
    checkPlayer(playerId);
  }
}

/**
 *
 * @param {*} playerId the playerId that is being checked
 */
function verifyCheckPlayer(playerId) {
  // sessionStorage.setItem("isInitiatingCheck", true);
  outputMessage("等待队友确认...");
  const currentPlayerId = sessionStorage.getItem("playerId");
  socket.emit("verifyCheckPlayer", currentPlayerId.toString(), playerId);
}

function checkPlayer(checkedPlayerId) {
  socket.emit("checkPlayer", checkedPlayerId.toString());
}

function killerPlayerRouter(playerId, killerCount) {
  console.log(`killerCount: ${typeof killerCount} ${killerCount}`);
  if (killerCount > 1) {
    verifyKillPlayer(playerId);
  } else {
    killPlayer(playerId);
  }
}

/**
 *
 * @param {*} playerId the playerId that is being killed
 */
function verifyKillPlayer(playerId) {
  //   sessionStorage.setItem("isInitiatingKill", true);
  outputMessage("等待队友确认...");
  const currentPlayerId = sessionStorage.getItem("playerId");
  socket.emit("verifyKillPlayer", currentPlayerId.toString(), playerId);
}

function killPlayer(playerId) {
  socket.emit("killPlayer", playerId.toString());
}

function gunPlayer(playerId, isVotingRound) {
  var voteIndex = sessionStorage.getItem("voteIndex");
  socket.emit("gunPlayer", {
    playerId: playerId.toString(),
    isVotingRound: isVotingRound,
    voteIndex: voteIndex,
  });
}

function revivePlayer(playerId) {
  socket.emit("revivePlayer", {
    playerId: playerId.toString(),
  });
}

function silencePlayer(playerId) {
  socket.emit("silencePlayer", playerId.toString());
}

function releasePoison(playerId) {
  socket.emit("releasePoison", playerId.toString());
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
  document.querySelector("#switchOrder").disabled = true;
  document.querySelector("#ready").disabled = true;
  sessionStorage.setItem("currentCard", currentPlayer.card1);
  // console.log(currentPlayer);
  socket.emit("playerReady", currentPlayer);
}

function restartGame() {
  socket.emit("restartGame");
}

function outputPlayerChatMessage(message, playername, playerId) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${playername} <span> Player ${playerId + 1}</span></p>
    <p class="text">
        ${message}
    </p>`;
  document.querySelector(".chat-messages").appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">God Message</p>
    <p class="text">
        ${message}
    </p>`;
  document.querySelector(".chat-messages").appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    const numOfCards = user.card1 === "" ? 1 : 2;
    if (user.isReady) {
      li.innerText = `${user.username} 编号: ${user.playerId + 1} 剩余卡牌: ${numOfCards} ✅`;
    } else {
      li.innerText = `${user.username} 编号: ${user.playerId + 1} 剩余卡牌: ${numOfCards}`;
    }

    userList.appendChild(li);
  });
}

function gunMidRoundAction() {
  socket.emit("gunSmithVotingRoundFire", "success");
}
