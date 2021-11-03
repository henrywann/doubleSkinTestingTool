# doubleSkinTestingTool
This is the initial Double Skin Game testing tool. Please do `npm run dev`. Server will be running on localhost:4000

Current pending potential improvements:
- Add the option for Gun Smith to fire during day time. This will include both the discussion (before voting) or during voting. Player killed by Gun Smith cannot vote if he/she didn't vote yet.
- Dynamically move the side bar with the player information to a drop down for mobile view.
- Introduce the option to select the version of the game (6 players, 7 players).
- Add minimum waiting time for each night. This will make sure the nigh does not end immediately if there is no player with actions.

Technical improvements:
- Introduce video/audio communicatio natively in the app.
- Rewrite with any popular framework (React, Angular, Vue.js...)
- Allow multiple game room feature. 
- Save in game data in DB. 
- Introduce session feature (player should be able to refresh the page and come back to the same stage of the game).
