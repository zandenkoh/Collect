 // Listen for the contextmenu event on the document
document.addEventListener('contextmenu', function(event) {
  // Prevent the default context menu behavior
  event.preventDefault();
});


const mapData = {
  minX: 1,
  maxX: 27,
  minY: 4,
  maxY: 12,
  blockedSpaces: {
    "7x4": true,
    "1x11": true,
    "12x10": true,
    "4x7": true,
    "5x7": true,
    "6x7": true,
    "8x6": true,
    "9x6": true,
    "10x6": true,
    "7x9": true,
    "8x9": true,
    "9x9": true,

    "20x4": true,
    "14x11": true,
    "25x10": true,
    "17x7": true,
    "18x7": true,
    "19x7": true,
    "21x6": true,
    "22x6": true,
    "23x6": true,
    "20x9": true,
    "21x9": true,
    "22x9": true,
  },
};

// Options for Player Colors... these are in the same order as our sprite sheet
const playerColors = ["blue", "red", "orange", "yellow", "green", "purple"];

//Misc Helpers
function randomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
}
function getKeyString(x, y) {
  return `${x}x${y}`;
}

function createName() {
  const storedName = localStorage.getItem('name');
  if (storedName) {
    return storedName;
  } else {
    const prefix = randomFromArray([
      "COOL",
      "SUPER",
      "HIP",
      "SMUG",
      "COOL",
      "SILKY",
      "GOOD",
      "SAFE",
      "DEAR",
      "DAMP",
      "WARM",
      "RICH",
      "LONG",
      "DARK",
      "SOFT",
      "BUFF",
      "DOPE",
    ]);
    const animal = randomFromArray([
      "BEAR",
      "DOG",
      "CAT",
      "FOX",
      "LAMB",
      "LION",
      "BOAR",
      "GOAT",
      "VOLE",
      "SEAL",
      "PUMA",
      "MULE",
      "BULL",
      "BIRD",
      "BUG",
    ]);
    return `${prefix} ${animal}`;
  }
}


function isSolid(x,y) {

  const blockedNextSpace = mapData.blockedSpaces[getKeyString(x, y)];
  return (
    blockedNextSpace ||
    x >= mapData.maxX ||
    x < mapData.minX ||
    y >= mapData.maxY ||
    y < mapData.minY
  )
}

function getRandomSafeSpot() {
  // We don't look things up by key here, so just return an x/y
  return randomFromArray([
    { x: 1, y: 4 },
    { x: 2, y: 4 },
    { x: 1, y: 5 },
    { x: 2, y: 6 },
    { x: 2, y: 8 },
    { x: 2, y: 9 },
    { x: 4, y: 8 },
    { x: 5, y: 5 },
    { x: 5, y: 8 },
    { x: 5, y: 10 },
    { x: 5, y: 11 },
    { x: 11, y: 7 },
    { x: 12, y: 7 },
    { x: 13, y: 7 },
    { x: 13, y: 6 },
    { x: 13, y: 8 },
    { x: 7, y: 6 },
    { x: 7, y: 7 },
    { x: 7, y: 8 },
    { x: 8, y: 8 },
    { x: 10, y: 8 },
    { x: 8, y: 8 },
    { x: 11, y: 4 },
    // Add more coordinates here to cover the entire 28 x range
    { x: 15, y: 4 },
    { x: 16, y: 4 },
    { x: 15, y: 5 },
    { x: 15, y: 6 },
    { x: 16, y: 8 },
    { x: 16, y: 9 },
    { x: 18, y: 8 },
    { x: 19, y: 5 },
    { x: 19, y: 8 },
    { x: 19, y: 10 },
    { x: 19, y: 11 },
    { x: 25, y: 7 },
    { x: 26, y: 7 },
    { x: 21, y: 7 },
    { x: 21, y: 8 },
    { x: 22, y: 8 },
    { x: 24, y: 8 },
    { x: 22, y: 8 },
    { x: 25, y: 4 },

  ]);
}



(function () {

  let playerId;
  let playerRef;
  let players = {};
  let playerElements = {};
  let coins = {};
  let coinElements = {};
  let leaderboardContainer;

  const gameContainer = document.querySelector(".game-container");
  const playerNameInput = document.querySelector("#player-name");
  const playerColorButton = document.querySelector("#player-color");

  // Function to handle visibility change
  function handleVisibilityChange() {
    if (document.hidden) {
      // Set the player's isOnline status to false when the tab is not visible
      playerRef.update({ isOnline: false });
    } else {
      // Set the player's isOnline status to true when the tab is visible again
      playerRef.update({ isOnline: true });
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);

  function placeCoin() {
    const { x, y } = getRandomSafeSpot();
    const coinRef = firebase.database().ref(`coins/${getKeyString(x, y)}`);
    coinRef.set({
      x,
      y,
    })

    const coinTimeouts = [300, 800, 1000, 2000];
    setTimeout(() => {
      placeCoin();
    }, randomFromArray(coinTimeouts));
  }

  function attemptGrabCoin(x, y) {
    const key = getKeyString(x, y);
    if (coins[key]) {
      // Remove this key from data, then uptick Player's coin count
      firebase.database().ref(`coins/${key}`).remove();
      playerRef.update({
        coins: players[playerId].coins + 1,
      })
    }
  }


  function handleArrowPress(xChange=0, yChange=0) {
    const newX = players[playerId].x + xChange;
    const newY = players[playerId].y + yChange;
    if (!isSolid(newX, newY)) {
      //move to the next space
      players[playerId].x = newX;
      players[playerId].y = newY;
      if (xChange === 1) {
        players[playerId].direction = "right";
      }
      if (xChange === -1) {
        players[playerId].direction = "left";
      }
      playerRef.set(players[playerId]);
      attemptGrabCoin(newX, newY);
    }
  }


  function initGame() {

    // Event listeners for WASD keys
    new KeyPressListener("KeyW", () => handleArrowPress(0, -1));
    new KeyPressListener("ArrowUp", () => handleArrowPress(0, -1));
    new KeyPressListener("KeyS", () => handleArrowPress(0, 1));
    new KeyPressListener("ArrowDown", () => handleArrowPress(0, 1));
    new KeyPressListener("KeyA", () => handleArrowPress(-1, 0));
    new KeyPressListener("ArrowLeft", () => handleArrowPress(-1, 0));
    new KeyPressListener("KeyD", () => handleArrowPress(1, 0));
    new KeyPressListener("ArrowRight", () => handleArrowPress(1, 0));

    const allPlayersRef = firebase.database().ref(`players`);
    const allCoinsRef = firebase.database().ref(`coins`);

    allPlayersRef.on("value", (snapshot) => {
  // Fires whenever a change occurs
  players = snapshot.val() || {};
  const onlinePlayers = Object.values(players).filter(player => player.isOnline);

  // First, clear the gameContainer of any offline players
  for (let id in playerElements) {
    if (!onlinePlayers.find(player => player.id === id)) {
      gameContainer.removeChild(playerElements[id]);
      delete playerElements[id];
    }
  }

  // Then, update or add the remaining online players
  onlinePlayers.forEach((player) => {
    const characterState = player;
    let el = playerElements[player.id];

    if (!el) {
      // Create a new character element if it doesn't exist
      el = document.createElement("div");
      el.classList.add("Character", "grid-cell");
      if (player.id === playerId) {
        el.classList.add("you");
      }
      el.innerHTML = `
        <div class="Character_shadow grid-cell"></div>
        <div class="Character_sprite grid-cell"></div>
        <div class="Character_name-container">
          <span class="Character_name"></span>
          <span class="Character_coins">0</span>
        </div>
        <div class="Character_you-arrow"></div>
      `;
      playerElements[player.id] = el;
      gameContainer.appendChild(el);
    }

    // Update the character's DOM element with their current state
    el.querySelector(".Character_name").innerText = characterState.name;
    el.querySelector(".Character_coins").innerText = characterState.coins;
    el.setAttribute("data-color", characterState.color);
    el.setAttribute("data-direction", characterState.direction);
    const left = 16 * characterState.x + "px";
    const top = 16 * characterState.y - 4 + "px";
    el.style.transform = `translate3d(${left}, ${top}, 0)`;

    // Highlight the current user's character
    if (player.id === playerId) {
      el.querySelector(".Character_name-container").classList.add("user-character");
    } else {
      el.querySelector(".Character_name-container").classList.remove("user-character");
    }

    // Only display characters that are online
    el.style.display = player.isOnline ? 'block' : 'none';
  });
});


    allPlayersRef.on("child_added", (snapshot) => {
      //Fires whenever a new node is added the tree
      const addedPlayer = snapshot.val();
      const characterElement = document.createElement("div");
      characterElement.classList.add("Character", "grid-cell");
      if (addedPlayer.id === playerId) {
        characterElement.classList.add("you");
      }
      characterElement.innerHTML = (`
        <div class="Character_shadow grid-cell"></div>
        <div class="Character_sprite grid-cell"></div>
        <div class="Character_name-container">
          <span class="Character_name"></span>
          <span class="Character_coins">0</span>
        </div>
        <div class="Character_you-arrow"></div>
      `);
      playerElements[addedPlayer.id] = characterElement;
      //Fill in some initial state
      characterElement.querySelector(".Character_name").innerText = addedPlayer.name;
      characterElement.querySelector(".Character_coins").innerText = addedPlayer.coins;
      characterElement.setAttribute("data-color", addedPlayer.color);
      characterElement.setAttribute("data-direction", addedPlayer.direction);
      const left = 16 * addedPlayer.x + "px";
      const top = 16 * addedPlayer.y - 4 + "px";
      characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
      gameContainer.appendChild(characterElement);
    })

    //Remove character DOM element after they leave
    allPlayersRef.on("child_removed", (snapshot) => {
      const removedKey = snapshot.val().id;
      gameContainer.removeChild(playerElements[removedKey]);
      delete playerElements[removedKey];
    })


    //New - not in the video!
    //This block will remove coins from local state when Firebase `coins` value updates
    allCoinsRef.on("value", (snapshot) => {
      coins = snapshot.val() || {};
    });
    //

    allCoinsRef.on("child_added", (snapshot) => {
      const coin = snapshot.val();
      const key = getKeyString(coin.x, coin.y);
      coins[key] = true;

      // Create the DOM Element
      const coinElement = document.createElement("div");
      coinElement.classList.add("Coin", "grid-cell");
      coinElement.innerHTML = `
        <div class="Coin_shadow grid-cell"></div>
        <div class="Coin_sprite grid-cell"></div>
      `;

      // Position the Element
      const left = 16 * coin.x + "px";
      const top = 16 * coin.y - 4 + "px";
      coinElement.style.transform = `translate3d(${left}, ${top}, 0)`;

      // Keep a reference for removal later and add to DOM
      coinElements[key] = coinElement;
      gameContainer.appendChild(coinElement);
    })
    allCoinsRef.on("child_removed", (snapshot) => {
      const {x,y} = snapshot.val();
      const keyToRemove = getKeyString(x,y);
      gameContainer.removeChild( coinElements[keyToRemove] );
      delete coinElements[keyToRemove];
    })
    
    const storedName = createName();
    playerRef.update({
      name: storedName
    });


    //Update player color on button click
    playerColorButton.addEventListener("click", () => {
      const mySkinIndex = playerColors.indexOf(players[playerId].color);
      const nextColor = playerColors[mySkinIndex + 1] || playerColors[0];
      playerRef.update({
        color: nextColor
      })
    })

    //Place my first coin
    placeCoin();

  }

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      playerId = user.uid;
      playerRef = firebase.database().ref(`players/${playerId}`);
  
      playerRef.once('value', (snapshot) => {
        const playerData = snapshot.val();

          // Define default player data
          const defaultPlayerData = {
            id: playerId,
            name: createName(),
            direction: "right",
            color: randomFromArray(playerColors),
            x: getRandomSafeSpot().x,
            y: getRandomSafeSpot().y,
            coins: 0,
            isOnline: true,
          };

  if (playerData) {
    // Ensure missing fields are filled in
    playerRef.update({
      ...defaultPlayerData,
      ...playerData,
    });
    playerNameInput.value = playerData.name;
  } else {
    // Player data doesn't exist, initialize with default values
    playerNameInput.value = defaultPlayerData.name;
    playerRef.set(defaultPlayerData);
  }
});

  
      // Update online status on disconnect and connect
      playerRef.onDisconnect().update({ isOnline: false }).then(() => {
        playerRef.update({ isOnline: true });
      });
  
      // Begin the game now that we are signed in
      initGame();
    } else {
      // Player is logged out
      // Remove the player's DOM element
      const existingPlayerElement = playerElements[playerId];
      if (existingPlayerElement) {
        gameContainer.removeChild(existingPlayerElement);
        delete playerElements[playerId];
      }
    }
  });
    
  firebase.database().ref('players').on('child_changed', (snapshot) => {
    const playerId = snapshot.key;
    const playerData = snapshot.val();
    console.log(`Player ${playerId} online status changed to ${playerData.isOnline}`);
    const characterElement = playerElements[playerId];
    if (!playerData.isOnline && characterElement) {
      // Player went offline, hide their character
      characterElement.classList.add('offline');
    } else if (playerData.isOnline && characterElement) {
      // Player came back online, show their character
      characterElement.classList.remove('offline');
    }
  });


  firebase.auth().signInAnonymously().catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;
    // ...
    console.log(errorCode, errorMessage);
  });


})();
