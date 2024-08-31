class GameLogicVariables {
  constructor() {
      this._isPureVillagerExists = false;
      this._playerLength = "0";
      this._badGuysCombination = "-1";
      this._goodPlayerCardList = [];
      this._isNewGame = true;
  }

  // Setter for isPureVillagerExists
  set isPureVillagerExists(value) {
      if (typeof value === 'boolean') {
          this._isPureVillagerExists = value;
      } else {
          console.error('isPureVillagerExists should be a boolean');
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
          console.error('playerLength should be a number or a string that can be converted to a number');
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
          console.error('badGuysCombination should be a number or a string that can be converted to a number');
      }
  }

  // Getter for badGuysCombination
  get badGuysCombination() {
      return this._badGuysCombination;
  }

  // Setter for goodPlayerCardList
  set goodPlayerCardList(value) {
      if (Array.isArray(value)) {
          this._goodPlayerCardList = value;
      } else {
          console.error('goodPlayerCardList should be an array');
      }
  }

  // Getter for goodPlayerCardList
  get goodPlayerCardList() {
      return this._goodPlayerCardList;
  }

  // Setter for isNewGame
  set isNewGame(value) {
      if (typeof value === 'boolean') {
          this._isNewGame = value;
      } else {
          console.error('isNewGame should be a boolean');
      }
  }

  // Getter for isNewGame
  get isNewGame() {
      return this._isNewGame;
  }
}

module.exports = GameLogicVariables;