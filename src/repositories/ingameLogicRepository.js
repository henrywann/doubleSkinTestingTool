class InGameLogicVariables {
  constructor() {
    this._killerCount = 0;
    this._policeCount = 0;
    this._doctorCount = 0;
    this._gunSmithCount = 0;
    this._silencerCount = 0;
    this._bioChemistCount = 0;
    this._turtleCount = 0;
    this._priestCount = 0;
    this._round = 0;
    this._poisonReleasedRound = 0;
    this._revivedRound = 0;
    this._noKillerPresent = false;
    this._roundAction = [];
    this._isGunSmithFired = false;
    this._isPoisonCompleted = false;
    this._isPriestRevived = false;
    this._numberOfPoinsonReleased = 0;
    this._revengeChosen = -1;
    this._revengeCard = -1;
    this._gunablePlayers = [];
    this._isPoliceCheckingInProgress = false;
    this._isKillerCheckingInProgress = false;
  }

  // Getter and Setter for killerCount
  get killerCount() {
    return this._killerCount;
  }
  set killerCount(value) {
    if (Number.isInteger(value)) {
      this._killerCount = value;
    } else {
      console.error("killerCount should be an integer");
    }
  }

  // Getter and Setter for policeCount
  get policeCount() {
    return this._policeCount;
  }
  set policeCount(value) {
    if (Number.isInteger(value)) {
      this._policeCount = value;
    } else {
      console.error("policeCount should be an integer");
    }
  }

  // Getter and Setter for doctorCount
  get doctorCount() {
    return this._doctorCount;
  }
  set doctorCount(value) {
    if (Number.isInteger(value)) {
      this._doctorCount = value;
    } else {
      console.error("doctorCount should be an integer");
    }
  }

  // Getter and Setter for gunSmithCount
  get gunSmithCount() {
    return this._gunSmithCount;
  }
  set gunSmithCount(value) {
    if (Number.isInteger(value)) {
      this._gunSmithCount = value;
    } else {
      console.error("gunSmithCount should be an integer");
    }
  }

  // Getter and Setter for silencerCount
  get silencerCount() {
    return this._silencerCount;
  }
  set silencerCount(value) {
    if (Number.isInteger(value)) {
      this._silencerCount = value;
    } else {
      console.error("silencerCount should be an integer");
    }
  }

  // Getter and Setter for bioChemistCount
  get bioChemistCount() {
    return this._bioChemistCount;
  }
  set bioChemistCount(value) {
    if (Number.isInteger(value)) {
      this._bioChemistCount = value;
    } else {
      console.error("bioChemistCount should be an integer");
    }
  }

  // Getter for turtleCount
  get turtleCount() {
    return this._turtleCount;
  }

  // Setter for turtleCount
  set turtleCount(value) {
    if (Number.isInteger(value)) {
      this._turtleCount = value;
    } else {
      console.error("turtleCount should be an integer");
    }
  }

  // Getter for priestCount
  get priestCount() {
    return this._priestCount;
  }

  // Setter for priestCount
  set priestCount(value) {
    if (Number.isInteger(value)) {
      this._priestCount = value;
    } else {
      console.error("priestCount should be an integer");
    }
  }

  // Getter and Setter for round
  get round() {
    return this._round;
  }
  set round(value) {
    if (Number.isInteger(value)) {
      this._round = value;
    } else {
      console.error("round should be an integer");
    }
  }

  // Getter and Setter for poisonReleasedRound
  get poisonReleasedRound() {
    return this._poisonReleasedRound;
  }
  set poisonReleasedRound(value) {
    if (Number.isInteger(value)) {
      this._poisonReleasedRound = value;
    } else {
      console.error("poisonReleasedRound should be an integer");
    }
  }

    // Getter and Setter for poisonReleasedRound
    get revivedRound() {
      return this._revivedRound;
    }
    set revivedRound(value) {
      if (Number.isInteger(value)) {
        this._revivedRound = value;
      } else {
        console.error("revivedRound should be an integer");
      }
    }

  // Getter and Setter for noKillerPresent
  get noKillerPresent() {
    return this._noKillerPresent;
  }
  set noKillerPresent(value) {
    if (typeof value === "boolean") {
      this._noKillerPresent = value;
    } else {
      console.error("noKillerPresent should be a boolean");
    }
  }

  // Getter and Setter for roundAction
  get roundAction() {
    return this._roundAction;
  }
  set roundAction(value) {
    if (Array.isArray(value)) {
      this._roundAction = value;
    } else {
      console.error("roundAction should be an array");
    }
  }

  // Getter and Setter for isGunSmithFired
  get isGunSmithFired() {
    return this._isGunSmithFired;
  }
  set isGunSmithFired(value) {
    if (typeof value === "boolean") {
      this._isGunSmithFired = value;
    } else {
      console.error("isGunSmithFired should be a boolean");
    }
  }

  // Getter and Setter for isPriestRevived
  get isPriestRevived() {
    return this._isPriestRevived;
  }
  // Setter for isPriestRevived
  set isPriestRevived(value) {
    if (typeof value === 'boolean') {
      this._isPriestRevived = value;
    } else {
      console.error("isPriestRevived should be a boolean");
    }
  }

  // Getter and Setter for isPoisonCompleted
  get isPoisonCompleted() {
    return this._isPoisonCompleted;
  }
  set isPoisonCompleted(value) {
    if (typeof value === "boolean") {
      this._isPoisonCompleted = value;
    } else {
      console.error("isPoisonCompleted should be a boolean");
    }
  }

  // Getter and Setter for numberOfPoinsonReleased
  get numberOfPoinsonReleased() {
    return this._numberOfPoinsonReleased;
  }
  set numberOfPoinsonReleased(value) {
    if (Number.isInteger(value)) {
      this._numberOfPoinsonReleased = value;
    } else {
      console.error("numberOfPoinsonReleased should be an integer");
    }
  }

  // Getter and Setter for revengeChosen
  get revengeChosen() {
    return this._revengeChosen;
  }
  set revengeChosen(value) {
    if (Number.isInteger(value)) {
      this._revengeChosen = value;
    } else {
      console.error("revengeChosen should be an integer");
    }
  }

  // Getter and Setter for revengeCard
  get revengeCard() {
    return this._revengeCard;
  }
  set revengeCard(value) {
    if (Number.isInteger(value)) {
      this._revengeCard = value;
    } else {
      console.error("revengeCard should be an integer");
    }
  }

  // Getter and Setter for gunablePlayers
  get gunablePlayers() {
    return this._gunablePlayers;
  }
  set gunablePlayers(value) {
    if (Array.isArray(value)) {
      this._gunablePlayers = value;
    } else {
      console.error("gunablePlayers should be an array");
    }
  }

  // Getter and Setter for isPoliceCheckingInProgress
  get isPoliceCheckingInProgress() {
    return this._isPoliceCheckingInProgress;
  }
  set isPoliceCheckingInProgress(value) {
    if (typeof value === "boolean") {
      this._isPoliceCheckingInProgress = value;
    } else {
      console.error("isPoliceCheckingInProgress should be a boolean");
    }
  }

  // Getter and Setter for isKillerCheckingInProgress
  get isKillerCheckingInProgress() {
    return this._isKillerCheckingInProgress;
  }
  set isKillerCheckingInProgress(value) {
    if (typeof value === "boolean") {
      this._isKillerCheckingInProgress = value;
    } else {
      console.error("isKillerCheckingInProgress should be a boolean");
    }
  }
}

module.exports = InGameLogicVariables;
