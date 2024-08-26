// let gameLogicVariables = {
//   isPureVillagerExists: false,
//   playerLength: "0",
//   // 0: 6 players, 1: killer, revenger, silencer, 2: killer, bioChemist, sliencer
//   badGuysCombination: 0,
//   goodPlayerCardList: [],
//   isNewGame: true,
// };

// function resetGameLogicVariables() {
//   this.isPureVillagerExists = false;
//   this.playerLength = "0";
//   this.badGuysCombination = 0;
//   this.goodPlayerCardList = [];
//   this.isNewGame = true;
// }

// module.exports = { gameLogicVariables, resetGameLogicVariables };

class GameLogicVariables {
  constructor() {
      this._isPureVillagerExists = false;
      this._playerLength = "0";
      this._badGuysCombination = 0;
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
      if (Number.isInteger(value)) {
          this._badGuysCombination = value;
      } else {
          console.error('badGuysCombination should be an integer');
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