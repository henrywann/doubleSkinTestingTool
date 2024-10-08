class GameLogicVariables {
  constructor() {
    this._isPureVillagerExists = false;
    this._playerLength = "0";
    this._badGuysCombination = "-1";
    this._numberOfPlayers = "6";
    this._goodPlayerCardList = [];
    this._badPlayerCardList = [];
    this._isNewGame = true;
  }

  // Setter for isPureVillagerExists
  set isPureVillagerExists(value) {
    if (typeof value === "boolean") {
      this._isPureVillagerExists = value;
    } else {
      console.error("isPureVillagerExists should be a boolean");
    }
  }

  // Getter for isPureVillagerExists
  get isPureVillagerExists() {
    return this._isPureVillagerExists;
  }

  // Setter for playerLength
  set playerLength(value) {
    if (!isNaN(value)) {
      this._playerLength = value.toString();
    } else {
      console.error("playerLength should be a number or a string that can be converted to a number");
    }
  }

  // Getter for playerLength
  get playerLength() {
    return this._playerLength;
  }

  // Setter for badGuysCombination
  set badGuysCombination(value) {
    if (!isNaN(value)) {
      this._badGuysCombination = value.toString();
    } else {
      console.error("badGuysCombination should be a number or a string that can be converted to a number");
    }
  }

  // Getter for badGuysCombination
  get badGuysCombination() {
    return this._badGuysCombination;
  }

  // Getter for numberOfPlayers
  get numberOfPlayers() {
    return this._numberOfPlayers;
  }

  // Setter for numberOfPlayers
  set numberOfPlayers(value) {
    if (!isNaN(value)) {
      this._numberOfPlayers = value.toString();
    } else {
      console.error("numberOfPlayers should be a number or a string that can be converted to a number");
    }
  }

  // Setter for goodPlayerCardList
  set goodPlayerCardList(value) {
    if (Array.isArray(value)) {
      this._goodPlayerCardList = value;
    } else {
      console.error("goodPlayerCardList should be an array");
    }
  }

  // Getter for goodPlayerCardList
  get goodPlayerCardList() {
    return this._goodPlayerCardList;
  }

  // Setter for goodPlayerCardList
  set badPlayerCardList(value) {
    if (Array.isArray(value)) {
      this._badPlayerCardList = value;
    } else {
      console.error("badPlayerCardList should be an array");
    }
  }

  // Getter for badPlayerCardList
  get badPlayerCardList() {
    return this._badPlayerCardList;
  }

  // Setter for isNewGame
  set isNewGame(value) {
    if (typeof value === "boolean") {
      this._isNewGame = value;
    } else {
      console.error("isNewGame should be a boolean");
    }
  }

  // Getter for isNewGame
  get isNewGame() {
    return this._isNewGame;
  }
}

module.exports = GameLogicVariables;
