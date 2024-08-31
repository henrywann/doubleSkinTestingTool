class VotingLogicVariables {
  constructor() {
      this._playersThatVoted = 0;
      this._voteblePlayers = [];
      this._whoVotedWho = [];
      this._playersWithMostVotes = [];
      this._isFirstRoundVoting = true;
      this._gunnedPlayerDuringVoting = "-1";
  }

  // Getter and Setter for playersThatVoted
  get playersThatVoted() {
      return this._playersThatVoted;
  }
  set playersThatVoted(value) {
      if (Number.isInteger(value)) {
          this._playersThatVoted = value;
      } else {
          console.error('playersThatVoted should be an integer');
      }
  }

  // Getter and Setter for voteblePlayers
  get voteblePlayers() {
      return this._voteblePlayers;
  }
  set voteblePlayers(value) {
      if (Array.isArray(value)) {
          this._voteblePlayers = value;
      } else {
          console.error('voteblePlayers should be an array');
      }
  }

  // Getter and Setter for whoVotedWho
  get whoVotedWho() {
      return this._whoVotedWho;
  }
  set whoVotedWho(value) {
      if (Array.isArray(value)) {
          this._whoVotedWho = value;
      } else {
          console.error('whoVotedWho should be an array');
      }
  }

  // Getter and Setter for playersWithMostVotes
  get playersWithMostVotes() {
      return this._playersWithMostVotes;
  }
  set playersWithMostVotes(value) {
      if (Array.isArray(value)) {
          this._playersWithMostVotes = value;
      } else {
          console.error('playersWithMostVotes should be an array');
      }
  }

  // Getter and Setter for isFirstRoundVoting
  get isFirstRoundVoting() {
      return this._isFirstRoundVoting;
  }
  set isFirstRoundVoting(value) {
      if (typeof value === 'boolean') {
          this._isFirstRoundVoting = value;
      } else {
          console.error('isFirstRoundVoting should be a boolean');
      }
  }

  // Getter and Setter for gunnedPlayerDuringVoting
  get gunnedPlayerDuringVoting() {
      return this._gunnedPlayerDuringVoting;
  }
  set gunnedPlayerDuringVoting(value) {
    if (!isNaN(value)) {
        this._gunnedPlayerDuringVoting = value.toString();
    } else {
        console.error('gunnedPlayerDuringVoting should be a number or a string that can be converted to a number');
    }
  }
}

module.exports = VotingLogicVariables;

