"use strict";
/*

My main script, interacting with the other scripts and manages the flow of the game.

Sprites for the game have been downloaded from:
https://axelpale.github.io/openmoji-sprites/#-smileys-emotion

SECTIONS:
- FLAGS
- INGAME
- LEVELUP
- PAUSE MENU
- DEFEAT MENU
- MAIN MENU
- FLOW

NOTES ON THE PROGRAM STRUCTURE:
I'm using the stateManager script in order to manage the states that the game can be
in. So what I'm doing here is defining different update functions for the different
states, together with functions that are being run during the "real" update loop, by
simply updating the stateManager.
Because of this, I have divided the program into sections (see above) where every section
(except the first and last one) corresponds to a separate state and has a separate update 
function, init function and exit function.
to quickly go to a state, Ctrl-F for [name of state] + " STATE:".

v0.1 (2023-11-21): Added base functionality
v0.2 (2023-11-24): Started experimenting with enemies
v0.3 (2023-12-01): Made enemy collision update after the enemies move
v0.3 (2023-12-08): Added some projectile functionality
v0.4 (2023-12-12): Cleaned up the code and added/clarified comments
v0.5 (2023-12-16): Added a bunch of sprites to ingame
v0.6 (2024-01-12): Started work on level-up mechanic
v0.7 (2024-01-25): Added a scrolling background image
v0.8 (2024-01-26): Finished level-up state, added defeat state
v0.9 (2024-02-01): Added help menu, reworked enemy spawning
v0.10 (2024-02-01): Started working on the ghost
Karl Henriksson
*/

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// FLAGS:

// Enemies
const enemyDiameter = 48;
const enemyDamage = 100; // Damage per second per enemy touching player

// Game
const renderDistance = 2 * Math.max(window.innerWidth, window.innerHeight); // px, calculated automatically
const spawnDst = renderDistance / 2; // px

// Deltatime stuff
let deltaTime = 0;
let lastTime = 0; // Time last frame

// Keeps track on the next ID to use for graphicsID. This simply increases as time goes on,
//  with no way to reuse old ID:s. But ints are big, so this shouldn't be an issue
let nextID = 0;

// Ingame stuff (stored here b/c flags, but reset when not in the game)
// Should I push related variables into objects to reduce the number of flags?
const playerPosition = { x: 0, y: 0 };
const ghostPosition = { x: 0, y: 0 };
let playerMaxHealth = 100;
let playerHealth = playerMaxHealth;
let playerSpeed = 300;
let ghostSpeed = 100;
let distanceToGhost = 0;
let ghostPenalty = 0; // Goes up towards 1 the further away from the ghost you are
const pickupRange = 64;
let playerMoney = 0;
let playerMoneyNeeded = 3;
let playerLevel = 0;
let minutesSurvived = 0; // How long the player has been playing
let movementVector = { x: 0, y: 0 }; // Keeps player movement
let abilities = []; // Player abilities (aka powers)
let enemies = [];
let projectiles = [];
let pickups = [];
const enemyDiameterSq = enemyDiameter ** 2;
const pickupRangeSquared = pickupRange ** 2;

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// INGAME STATE:

// Used for spawning objects at a random nearby point
function randomSpawnPosition() {
    const v = Math.random() * Math.PI * 2;
    return {
        x: Math.sin(v) * spawnDst + playerPosition.x,
        y: Math.cos(v) * spawnDst + playerPosition.y,
    };
}

// IngameGraphics is used as an overlay to other graphics objects, and as such
//  is defined out of the scope
let ingameGraphics;
// Input system (also defined out of scope for a globally usable input object):
let ingameInput = new input();
{
    // To pause menu
    ingameInput.addKeyListener("keydown", "escape", () =>
        stateManager.switchState("Paused")
    );

    // Define a graphics system to use
    ingameGraphics = new graphics(
        "canvas",
        "Atlases/ingame.png",
        "Atlases/ingame-background.png"
    );
    // Add all sprites that will be used ingame to the imageLookup of the graphics system
    ingameGraphics.addObjectType("PlayerSprite", {
        sx: 288,
        sy: 216,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Ghost", {
        sx: 216,
        sy: 216,
        width: 72,
        height: 72,
    });
    // ENEMIES
    ingameGraphics.addObjectType("Standard1", {
        sx: 0,
        sy: 0,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Standard2", {
        sx: 72,
        sy: 0,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Standard3", {
        sx: 144,
        sy: 0,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Standard4", {
        sx: 216,
        sy: 0,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Standard5", {
        sx: 288,
        sy: 0,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Kissing", {
        sx: 0,
        sy: 72,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Money", {
        sx: 72,
        sy: 72,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Party", {
        sx: 144,
        sy: 72,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("StarEyes", {
        sx: 216,
        sy: 72,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Sick", {
        sx: 288,
        sy: 72,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Angry", {
        sx: 0,
        sy: 144,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Furious", {
        sx: 72,
        sy: 144,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Sleeping", {
        sx: 144,
        sy: 144,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("WokenUp", {
        sx: 216,
        sy: 144,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Laughing", {
        sx: 288,
        sy: 144,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Sunglasses", {
        sx: 0,
        sy: 216,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Frozen", {
        sx: 144,
        sy: 216,
        width: 72,
        height: 72,
    });
    // PROJECTILES
    ingameGraphics.addObjectType("Ice", {
        sx: 360,
        sy: 0,
        width: 36,
        height: 36,
    });
    ingameGraphics.addObjectType("Cookie", {
        sx: 396,
        sy: 0,
        width: 36,
        height: 36,
    });
    ingameGraphics.addObjectType("Diamond", {
        sx: 360,
        sy: 36,
        width: 36,
        height: 36,
    });
    ingameGraphics.addObjectType("Germ", {
        sx: 396,
        sy: 36,
        width: 36,
        height: 36,
    });
    ingameGraphics.addObjectType("Candy", {
        sx: 360,
        sy: 72,
        width: 36,
        height: 36,
    });
    ingameGraphics.addObjectType("Pizza", {
        sx: 396,
        sy: 72,
        width: 36,
        height: 36,
    });
    ingameGraphics.addObjectType("Apple", {
        sx: 360,
        sy: 108,
        width: 36,
        height: 36,
    });
    ingameGraphics.addObjectType("Star", {
        sx: 396,
        sy: 108,
        width: 36,
        height: 36,
    });
    ingameGraphics.addObjectType("Fire", {
        sx: 360,
        sy: 144,
        width: 36,
        height: 36,
    });
    ingameGraphics.addObjectType("Heart", {
        sx: 396,
        sy: 144,
        width: 36,
        height: 36,
    });
    ingameGraphics.addObjectType("Bolt", {
        sx: 360,
        sy: 180,
        width: 36,
        height: 36,
    });
    ingameGraphics.addObjectType("Party1", {
        sx: 360,
        sy: 216,
        width: 36,
        height: 36,
    });
    ingameGraphics.addObjectType("Party2", {
        sx: 396,
        sy: 216,
        width: 36,
        height: 36,
    });
    ingameGraphics.addObjectType("Explosive", {
        sx: 360,
        sy: 252,
        width: 36,
        height: 36,
    });
    // PICKUPS
    ingameGraphics.addObjectType("MoneyPickup", {
        sx: 0,
        sy: 288,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("PresentPickup", {
        sx: 72,
        sy: 288,
        width: 72,
        height: 72,
    });
    // OTHER
    ingameGraphics.addObjectType("Explosion", {
        // Explosion effect
        sx: 144,
        sy: 288,
        width: 72,
        height: 72,
    });
    ingameGraphics.addObjectType("Background", {
        // Background image
        sx: 0,
        sy: 0,
        width: 3200,
        height: 2400,
    });

    // Add 9 background objects to ingameGraphics, and link their positions to objects in a list
    const backgroundTilePositions = {};
    for (let x = -1; x < 2; x++) {
        for (let y = -1; y < 2; y++) {
            const imagePosition = { x: x * 3154, y: y * 2394 };
            backgroundTilePositions[x + ":" + y] = imagePosition;
            ingameGraphics.addObject(
                "backgroundImage",
                x + ":" + y,
                "Background",
                imagePosition
            );
        }
    }

    // Set the graphics instance's camera position to the player position
    //  Since objects are stored by pointer, the variables are now the same
    //  and will update automatically
    ingameGraphics.cameraPosition = playerPosition;

    // Sets the overlayCallback for the graphicsObject to deal with the status bars
    ingameGraphics.overlayCallback = function (ctx) {
        // Health bar
        ctx.fillStyle = "black";
        ctx.fillRect(
            window.innerWidth / 2 - 36,
            window.innerHeight / 2 + 36,
            72,
            14
        );
        ctx.fillStyle = "red";
        if (playerHealth > 0)
            ctx.fillRect(
                window.innerWidth / 2 - 34,
                window.innerHeight / 2 + 38,
                68 * (playerHealth / playerMaxHealth),
                10
            );

        // Money bar
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, window.innerWidth, 14);
        ctx.fillStyle = "green";
        ctx.fillRect(
            2,
            2,
            ((window.innerWidth - 4) * playerMoney) / playerMoneyNeeded,
            10
        );

        // Time survived
        ctx.fillStyle = "black";
        ctx.font = "32px serif";
        ctx.textAlign = "left";
        const seconds = Math.floor((minutesSurvived % 1) * 60);
        ctx.fillText(
            `Your time: ${Math.floor(minutesSurvived)}:${
                seconds < 10 ? "0" + seconds : seconds
            }`,
            10,
            window.innerHeight - 10
        );
    };

    // Updates the player
    function updatePlayer() {
        // Add dT to the minutes survived
        minutesSurvived += deltaTime / 60;

        movementVector = { x: 0, y: 0 }; // To make sure the player is moving at a fixed speed
        if (ingameInput.pressedKeys.indexOf("w") !== -1) movementVector.y -= 1;
        if (ingameInput.pressedKeys.indexOf("a") !== -1) movementVector.x -= 1;
        if (ingameInput.pressedKeys.indexOf("s") !== -1) movementVector.y += 1;
        if (ingameInput.pressedKeys.indexOf("d") !== -1) movementVector.x += 1;

        // If the player is moving at all...
        if (movementVector.x !== 0 || movementVector.y !== 0) {
            // ...add normalized movement vector to player position
            let movementMagnitude = Math.sqrt(
                movementVector.x * movementVector.x +
                    movementVector.y * movementVector.y
            );
            // Normalize the movement vector to the player speed times ghost penalty
            movementVector.x =
                (movementVector.x / movementMagnitude) *
                playerSpeed *
                ghostPenalty;
            movementVector.y =
                (movementVector.y / movementMagnitude) *
                playerSpeed *
                ghostPenalty;
            // Move the player
            playerPosition.x += movementVector.x * deltaTime;
            playerPosition.y += movementVector.y * deltaTime;

            // Modify the positions of the background tiles to match the nex position. For a better
            //  explanation of what's going on, see https://www.desmos.com/calculator/oqipkg1f7w
            for (let x = -1; x < 2; x++) {
                for (let y = -1; y < 2; y++) {
                    // Modify the x and y values in order to keep the link with the graphics object
                    backgroundTilePositions[x + ":" + y].x =
                        x * 3154 + 3154 * Math.round(playerPosition.x / 3154);
                    backgroundTilePositions[x + ":" + y].y =
                        y * 2394 + 2394 * Math.round(playerPosition.y / 2394);
                }
            }
        }
    }

    // Moves existing projectiles and checks if they hit
    function updateProjectiles() {
        for (let i = 0; i < projectiles.length; ) {
            const projectileToUpdate = projectiles[i];
            // If enemy is not dead after the update...
            if (projectileToUpdate.update()) {
                // ...increase the index
                i++;
            } else {
                // Else, delete the enemy and its graphics object
                ingameGraphics.removeObject(
                    "game",
                    projectileToUpdate.graphicsID
                );
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
                projectiles.splice(i, 1);
            }
        }
    }

    // Run all abilities
    function runAbilities() {
        // Run all abilities that are active (modify stuff depending on level???)
        for (const ability of abilities) {
            ability.update();
        }
    }

    // Check if the player has leveled up this tick. If so, switch to levelUp state
    function checkPlayerUpgrade() {
        // Diminishing returns, can tweak later
        if (playerMoney >= playerMoneyNeeded) {
            // If there are no more abilities to buy, ignore the fact that the player is leveling up
            if (untakenAbilities.length === 0) {
                playerMoney = playerMoneyNeeded;
                return;
            }
            // Increase level and reset money counter
            playerLevel++;
            playerMoney = 0;
            playerMoneyNeeded = playerLevel + 2;
            // Switch to the level-up screen, the rest will be managed there
            console.log("Level up!");
            stateManager.switchState("LevelUp");
        }
    }

    // Update all the enemies
    function updateEnemies() {
        // Move the enemies (only increasing the index if the enemy is still alive)
        for (let i = 0; i < enemies.length; ) {
            const enemyToUpdate = enemies[i];

            // If enemy is too far away from player, delete it
            //  (using a fast but orthographic distance formula)
            if (
                Math.abs(enemyToUpdate.position.x - playerPosition.x) +
                    Math.abs(enemyToUpdate.position.y - playerPosition.y) >
                renderDistance
            ) {
                enemyToUpdate.graphicsToUse.removeObject(
                    "game",
                    enemyToUpdate.graphicsID
                );
                enemies.splice(i, 1);
            }

            // Update the enemy
            if (enemyToUpdate.update()) {
                // If enemy still alive after update, increase the index to keep counting
                i++;
            } else {
                // Else, delete the enemy and its graphics object
                ingameGraphics.removeObject("game", enemyToUpdate.graphicsID);
                // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
                enemies.splice(i, 1);
                // (since the enemy at the current index has now changed, no increment is needed)
            }
        }
        // Do enemy collision
        for (let i = 0; i < enemies.length; i++) {
            enemies[i].updateCollision(i);
        }

        // If the player is dead, send to defeat menu
        if (playerHealth < 0) stateManager.switchState("Defeat");
    }

    // Runs every tick in order to spawn new objects (depending on time)
    function spawnNewObjects() {
        //
        // Depending on what "stage" of the game the player is in, spawn enemies in different ways
        //  See wavePlanning.txt for explanation
        if (minutesSurvived < 1) {
            spawnEnemies({
                standard: 0.5,
                money: 0.25,
            });
        } else if (minutesSurvived < 3) {
            spawnEnemies({
                standard: 0.5,
                money: 0.4,
                kissing: 0.2,
                sick: 0.1,
            });
        } else if (minutesSurvived < 5) {
            spawnEnemies({
                standard: 1,
                money: 0.4,
                kissing: 0.25,
                angry: 0.1,
                laughing: 0.2,
            });
        } else if (minutesSurvived < 7) {
            spawnEnemies({
                standard: 1,
                money: 0.3,
                sick: 0.1,
                party: 0.25,
                sunglasses: 0.15,
            });
        } else if (minutesSurvived < 9) {
            spawnEnemies({
                standard: 1,
                money: 0.4,
                kissing: 0.3,
                sick: 0.2,
                angry: 0.1,
                laughing: 0.2,
            });
        } else if (minutesSurvived < 11) {
            spawnEnemies({
                standard: 1.5,
                money: 0.25,
                kissing: 0.4,
                party: 0.3,
                star: 0.1,
                sunglasses: 0.1,
            });
        } else if (minutesSurvived < 13) {
            spawnEnemies({
                standard: 1,
                money: 0.2,
                sick: 0.3,
                angry: 0.3,
                party: 0.4,
                star: 0.2,
                laughing: 0.3,
            });
        } else if (minutesSurvived < 15) {
            spawnEnemies({
                money: 0.15,
                kissing: 0.5,
                sick: 0.4,
                angry: 0.4,
                party: 0.6,
                star: 0.3,
                laughing: 0.2,
                sunglasses: 0.2,
            });
        } else {
            spawnEnemies({
                money: 0.1,
                kissing: 1,
                sick: 0.5,
                angry: 0.5,
                party: 1,
                star: 0.5,
                laughing: 0.5,
                sunglasses: 0.5,
            });
        }

        // Spawn health pickup
        if (Math.random() < 0.005)
            pickups.push(
                new pickup(ingameGraphics, {
                    position: randomSpawnPosition(),
                    onPickup: () =>
                        (playerHealth = Math.min(
                            playerMaxHealth,
                            playerHealth + 10
                        )),
                    spriteName: "PresentPickup",
                })
            );
    }

    // Used in spawnObjects() to spawn enemies. Takes in probabilities of enemies of different types spawning
    function spawnEnemies({
        standard = 0,
        money = 0,
        kissing = 0,
        sick = 0,
        angry = 0,
        party = 0,
        starEyes = 0,
        laughing = 0,
        sunglasses = 0,
    }) {
        if (Math.random() < standard * deltaTime)
            enemies.push(new enemy(ingameGraphics, enemyData["standard"]));
        if (Math.random() < money * deltaTime)
            enemies.push(new enemy(ingameGraphics, enemyData["money"]));
        if (Math.random() < kissing * deltaTime)
            enemies.push(new enemy(ingameGraphics, enemyData["kissing"]));
        if (Math.random() < sick * deltaTime)
            enemies.push(new enemy(ingameGraphics, enemyData["sick"]));
        if (Math.random() < angry * deltaTime)
            enemies.push(new enemy(ingameGraphics, enemyData["angry"]));
        if (Math.random() < party * deltaTime)
            enemies.push(new enemy(ingameGraphics, enemyData["party"]));
        if (Math.random() < starEyes * deltaTime)
            enemies.push(new enemy(ingameGraphics, enemyData["star"]));
        if (Math.random() < laughing * deltaTime)
            enemies.push(new enemy(ingameGraphics, enemyData["laughing"]));
        if (Math.random() < sunglasses * deltaTime)
            enemies.push(new enemy(ingameGraphics, enemyData["sunglasses"]));
    }

    // Updates all the pickups
    function updatePickups() {
        for (let i = 0; i < pickups.length; ) {
            const pickupToUpdate = pickups[i];

            // Render distance stuff, if pickup too far away then delete
            if (
                Math.abs(pickupToUpdate.position.x - playerPosition.x) +
                    Math.abs(pickupToUpdate.position.y - playerPosition.y) >
                renderDistance
            ) {
                pickupToUpdate.graphicsToUse.removeObject(
                    "background",
                    pickupToUpdate.graphicsID
                );
                pickups.splice(i, 1);
            }

            // Update the pickup
            if (pickupToUpdate.update()) {
                // If pickup is still there, increase the index counter
                i++;
            } else {
                // Else, delete the pickup and its graphics object
                ingameGraphics.removeObject(
                    "background",
                    pickupToUpdate.graphicsID
                );
                pickups.splice(i, 1);
            }
        }
    }

    // Update the ghost.
    function updateGhost() {
        // Move the ghost closer to the player
        distanceToGhost = Math.sqrt(
            (ghostPosition.x - playerPosition.x) ** 2 +
                (ghostPosition.y - playerPosition.y) ** 2
        );
        if (distanceToGhost !== 0) {
            ghostPosition.x +=
                (deltaTime *
                    ghostSpeed *
                    (playerPosition.x - ghostPosition.x)) /
                distanceToGhost;
            ghostPosition.y +=
                (deltaTime *
                    ghostSpeed *
                    (playerPosition.y - ghostPosition.y)) /
                distanceToGhost;
        }

        // Set the ghost penalty. Goes up according to a 1/x formula, moved to fit between
        //  1 and 0. Which, for some unknown reason, is featuring phi??? I tested in
        //  Desmos, so I might be wrong there.
        ghostPenalty =
            distanceToGhost >= 1000
                ? 0 // I added this just to be sure that the player didn't get to the "other side" of the 1/x thing
                : Math.min(1, 1 / (distanceToGhost / 1000 - 1.618) + 1.618);

        // If the ghost penalty is too large, warn the player by placing text on the screen
        if (ghostPenalty < 0.6) {
            ingameGraphics.ctx.fillStyle = "red";
            ingameGraphics.ctx.textAlign = "center";
            ingameGraphics.ctx.fillText(
                "You are leaving your ghost behind, and losing power!",
                window.innerWidth / 2,
                window.innerHeight - 100
            );
        }
    }

    // - - - - - - -

    // Run when entering the "Ingame" state, aka when a game starts
    function ingameInit() {
        // Add the ghost's graphics object
        ingameGraphics.addObject("effect", "ghost", "Ghost", ghostPosition);
        // Add the player graphics object
        ingameGraphics.addObject(
            "effect",
            "player",
            "PlayerSprite",
            playerPosition
        );

        // Add a base ability to the abilities list if the ability list is empty
        if (abilities.length === 0)
            abilities.push(new ability("Cookie shot", ingameGraphics));
    }

    // Main function for when in game
    function ingameMain() {
        updatePlayer();
        updateGhost();
        runAbilities();
        checkPlayerUpgrade();
        updateEnemies();
        updatePickups();
        updateProjectiles();
        spawnNewObjects();
    }

    // Run when exiting the "Ingame" state, aka when a game ends
    function ingameExit() {}

    // Add the ingame state to stateManager
    stateManager.addState({
        name: "Ingame",
        init: ingameInit,
        update: ingameMain,
        exit: ingameExit,
        inputSystem: ingameInput,
        graphicsSystem: ingameGraphics,
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// LEVELUP STATE:

let levelUpInput;
{
    // Input system. This will be reset every time init() is called, and new mouseListeners will
    //  be added depending on how many levelUp options are availible
    levelUpInput = new input();

    const levelUpGraphics = new graphics("canvas", "Atlases/ingame.png");
    // Set the secondaryGraphicsObject property to the ingame graphics object,
    //  to make this screen an overlay of the ingame graphics
    levelUpGraphics.secondaryGraphicsObject = ingameGraphics;

    // Runs when state is entered
    function levelUpInit() {
        const availibleChoices = [];
        // Choose four random abilities, or less if there are fewer availible
        // Do this by looking at the first elements of a shuffled array and putting them into the availibleChoices array
        // (https://dev.to/codebubb/how-to-shuffle-an-array-in-javascript-2ikj)
        untakenAbilities = untakenAbilities.sort(() => 0.5 - Math.random());
        for (let i = 0; i < Math.min(4, untakenAbilities.length); i++)
            availibleChoices.push(untakenAbilities[i]);

        // Calculate button width/height
        const buttonPadding = window.innerWidth < 1000 ? 10 : 100;
        const buttonWidth =
            (window.innerWidth - buttonPadding) / availibleChoices.length -
            buttonPadding;
        const buttonHeight = window.innerHeight - 200;

        // Place button on the screen using the overlay function for now, adjusted for the amount of choices
        levelUpGraphics.overlayCallback = function (ctx) {
            // Darken the screen
            ctx.fillStyle = "#00000088";
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

            // Place buttons:
            // (https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_text) for text
            for (let i = 0; i < availibleChoices.length; i++) {
                const buttonX =
                    buttonPadding + i * (buttonPadding + buttonWidth);
                const buttonY = 100; // Stationary for now at least

                // Buttons are black
                ctx.fillStyle = "black";
                // Draw the button
                ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

                // Text is white
                ctx.fillStyle = "white";
                // Draw ability name bigger
                ctx.font = "24px serif";
                ctx.textAlign = "center";
                ctx.fillText(
                    availibleChoices[i],
                    buttonX + buttonWidth / 2,
                    buttonY + 48,
                    buttonWidth - 48
                );
            }

            // Draw the 50% redeem button
            ctx.fillStyle = "black";
            ctx.fillRect(window.innerWidth / 2 - 150, 20, 300, 48);
            ctx.fillStyle = "white";
            ctx.fillText("50% money redeem", window.innerWidth / 2, 52);
        };

        // Reset the levelUpInput mouse listeners in order to allow new button locations
        //  (depending on how many options are left)
        levelUpInput.mouseListenersPress = {};

        // Add a listener for if the player wants to recieve 50% of their money back
        //  instead of leveling up
        levelUpInput.addMouseListener(
            "mousedown",
            0,
            [window.innerWidth / 2 - 150, 20, window.innerWidth / 2 + 150, 68],
            () => {
                playerMoney = Math.ceil(playerMoneyNeeded / 2);
                stateManager.switchState("Ingame");
            }
        );

        // Do stuff to the buttons that should only be done once
        for (const abilityIndex in availibleChoices) {
            const abilityName = availibleChoices[abilityIndex];

            // Get the position of the button corresponding to the ability
            const buttonX =
                buttonPadding + abilityIndex * (buttonPadding + buttonWidth);
            const buttonY = 100;

            // Create a paragraph element for displaying ability description
            const p = document.createElement("p");
            // https://stackoverflow.com/questions/18083061/make-element-unclickable-click-things-behind-it
            p.style = `
        position: absolute;
        pointer-events: none;
        top: ${buttonY + 48}px;
        left: ${buttonX}px;
        width: ${buttonWidth - 20}px;
        padding: 10px;
        color: white;
        font-size: 20px;`;
            p.class = "levelUpText";
            p.innerText = abilityData[abilityName].description;
            document.getElementById("textHolder").appendChild(p);

            // Add a mouse listener with bounds corresponding to the button
            levelUpInput.addMouseListener(
                "mousedown",
                0,
                [
                    buttonX,
                    buttonY,
                    buttonWidth + buttonX,
                    buttonHeight + buttonY,
                ],
                () => {
                    // Get the index of the ability to be leveled up. Left at -1 if the ability wasn't found.
                    // Essentially my own indexOf(), because I can't use the real one here (since I only have the ability's name)
                    let abilityIndexInAbilitiesList = -1;
                    for (const abilityListIndex in abilities) {
                        if (abilities[abilityListIndex].name === abilityName) {
                            abilityIndexInAbilitiesList = abilityListIndex;
                            break;
                        }
                    }
                    let upgradedAbility =
                        abilities[abilityIndexInAbilitiesList];
                    // If the ability is being chosen for the first time, add to abilities list
                    if (abilityIndexInAbilitiesList === -1) {
                        upgradedAbility = new ability(
                            abilityName,
                            ingameGraphics
                        );
                        abilities.push(upgradedAbility);
                    } else {
                        // Otehrwise, just level it up
                        upgradedAbility.levelUp();
                    }
                    // If the ability has reched max level, remove it from untakenAbilities
                    if (upgradedAbility.level >= upgradedAbility.maxLevel) {
                        untakenAbilities.splice(
                            untakenAbilities.indexOf(abilityName),
                            1
                        );
                    }

                    stateManager.switchState("Ingame");
                }
            );
        }
    }

    // Clear the paragraphs and prepare for ingame state
    function levelUpExit() {
        // Remove all text elements
        document.getElementById("textHolder").innerHTML = "";
    }

    stateManager.addState({
        name: "LevelUp",
        init: levelUpInit,
        exit: levelUpExit,
        inputSystem: levelUpInput,
        graphicsSystem: levelUpGraphics,
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// PAUSE MENU STATE:

{
    const pauseInput = new input();
    const pauseGraphics = new graphics("canvas", "Atlases/ingame.png");

    // Add input listeners
    pauseInput.addKeyListener("keydown", "escape", () =>
        stateManager.switchState("Ingame")
    );
    pauseInput.addMouseListener("mousedown", 0, [20, 24, 260, 72], () =>
        stateManager.switchState("Ingame")
    );
    pauseInput.addMouseListener("mousedown", 0, [20, 96, 260, 144], () =>
        stateManager.switchState("Main")
    );

    // Add graphics overlay stuff
    pauseGraphics.secondaryGraphicsObject = ingameGraphics;
    pauseGraphics.overlayCallback = function () {
        const ctx = pauseGraphics.ctx;
        // Darken screen
        ctx.fillStyle = "#00000088";
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        // Draw buttons
        ctx.fillStyle = "black";
        ctx.fillRect(20, 24, 240, 48);
        ctx.fillRect(20, 96, 240, 48);
        // Draw button text
        ctx.font = "24px serif";
        ctx.textAlign = "left";
        ctx.fillStyle = "white";
        ctx.fillText("Resume", 36, 56);
        ctx.fillText("Main Menu", 36, 128);
    };

    stateManager.addState({
        name: "Paused",
        inputSystem: pauseInput,
        graphicsSystem: pauseGraphics,
        init: () => console.log("Paused game"),
        exit: () => console.log("Unpaused game"),
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// DEFEAT MENU STATE:

{
    // Create input and graphics objects
    const defeatInput = new input();
    const defeatGraphics = new graphics("canvas", "Atlases/ingame.png");

    // Add mouse listener for return to menu button
    defeatInput.addMouseListener(
        "mousedown",
        0,
        [
            window.innerWidth / 2 - 120,
            window.innerHeight - 100,
            window.innerWidth / 2 + 120,
            window.innerHeight - 52,
        ],
        () => stateManager.switchState("Main")
    );

    // Make the graphics overlay over the ingame screen
    defeatGraphics.secondaryGraphicsObject = ingameGraphics;
    // Add a darkening effect and other defeat stuff
    defeatGraphics.overlayCallback = function (ctx) {
        // Darken
        ctx.fillStyle = "#00000088";
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        // Place defeat text
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "54px serif";
        ctx.fillText("You Died", window.innerWidth / 2, 100);

        // Show survived time
        const seconds = Math.floor((minutesSurvived % 1) * 60);
        ctx.fillText(
            `Your time: ${Math.floor(minutesSurvived)}:${
                seconds < 10 ? "0" + seconds : seconds
            }`,
            window.innerWidth / 2,
            window.innerHeight / 2
        );

        // "Return to menu"-button
        ctx.fillStyle = "black";
        ctx.fillRect(
            window.innerWidth / 2 - 120,
            window.innerHeight - 100,
            240,
            48
        );
        ctx.fillStyle = "white";
        ctx.font = "24px serif";
        ctx.fillText(
            "Return to menu",
            window.innerWidth / 2,
            window.innerHeight - 68
        );
    };

    stateManager.addState({
        name: "Defeat",
        inputSystem: defeatInput,
        graphicsSystem: defeatGraphics,
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// MAIN MENU STATE:
{
    const mainInput = new input();
    const mainGraphics = new graphics("canvas", "Atlases/mainMenu.png");
    // Add a logo
    mainGraphics.addObjectType("Logo", {
        sx: 0,
        sy: 0,
        width: 600,
        height: 192,
    });
    // Add a dead emoji for animating
    mainGraphics.addObjectType("Dead", {
        sx: 0,
        sy: 190,
        width: 120,
        height: 100,
    });
    mainGraphics.addObject("ui", "Logo", "Logo", { x: 0, y: -200 });

    // Set values that will be useful later
    const halfX = window.innerWidth / 2;
    const halfY = window.innerHeight / 2;
    const buttonWidth = 300;
    const buttonHeight = 48;

    // Add input mouse listeners for the button locations
    mainInput.addMouseListener(
        "mousedown",
        0,
        [
            halfX - buttonWidth / 2,
            halfY - buttonHeight,
            halfX + buttonWidth / 2,
            halfY,
        ],
        () => stateManager.switchState("Ingame")
    );
    mainInput.addMouseListener(
        "mousedown",
        0,
        [
            halfX - buttonWidth / 2,
            halfY + buttonHeight,
            halfX + buttonWidth / 2,
            halfY + buttonHeight * 2,
        ],
        () => stateManager.switchState("Help")
    );

    // Make the graphics overlay display buttons
    mainGraphics.overlayCallback = function (ctx) {
        // Draw buttons
        ctx.fillStyle = "black";
        ctx.fillRect(
            halfX - buttonWidth / 2,
            halfY - buttonHeight,
            buttonWidth,
            buttonHeight
        );
        ctx.fillRect(
            halfX - buttonWidth / 2,
            halfY + buttonHeight,
            buttonWidth,
            buttonHeight
        );
        // Draw button text
        ctx.fillStyle = "white";
        ctx.font = "24px serif";
        ctx.textAlign = "center";
        ctx.fillText("Start Game", halfX, halfY - buttonHeight / 2 + 6);
        ctx.fillText("Help/Credits", halfX, halfY + buttonHeight * 1.5 + 6);
    };

    // When entering the main menu, reset any and all variables related to the game
    function mainInit() {
        playerPosition.x = 0;
        playerPosition.y = 0;
        ghostPosition.x = 0;
        ghostPosition.y = 0;
        playerHealth = playerMaxHealth;
        playerMoney = 0;
        playerMoneyNeeded = 3;
        playerLevel = 0;
        minutesSurvived = 0;
        movementVector = { x: 0, y: 0 };
        abilities = [];
        enemies = [];
        projectiles = [];
        pickups = [];
        // Set untakenAbilities to the keys in abilityData
        untakenAbilities = [];
        for (const [key] of Object.entries(abilityData))
            untakenAbilities.push(key);
        // Reset the graphics data
        ingameGraphics.backgroundObjects = {};
        ingameGraphics.gameObjects = {};
        ingameGraphics.effectObjects = {};
    }

    // Adds and removes falling dead emojis
    function handleAnimatedMainMenu() {
        // Add on average 1 dead emoji per second, slightly above the screen
        if (Math.random() < deltaTime) {
            // I'm relying on Math.random() giving a new string every time. But it really won't matter if it doesn't
            mainGraphics.addObject("game", Math.random(), "Dead", {
                x: (Math.random() - 0.5) * window.innerWidth,
                y: -window.innerHeight / 2 - 100,
            });
        }

        // For every game object in the main menu...
        for (const [key, obj] of Object.entries(mainGraphics.gameObjects)) {
            // Move downwards (faster whne lower down to simulate inertia)
            obj.position.y +=
                // A bunch of normalization and stuff to make it look decent
                ((obj.position.y + 300 + window.innerHeight / 2) ** 2 / 500) *
                deltaTime;
            // If too far down to be visible, remove from the graphics object
            if (obj.position.y > window.innerHeight)
                mainGraphics.removeObject("game", key);
        }
    }

    // Update function for the main menu
    function mainUpdate() {
        // Animate
        handleAnimatedMainMenu();
    }

    stateManager.addState({
        name: "Main",
        init: mainInit,
        update: mainUpdate,
        inputSystem: mainInput,
        graphicsSystem: mainGraphics,
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// HELP MENU STATE:
{
    const helpInput = new input();
    const helpGraphics = new graphics("canvas", "Atlases/ingame.png");

    // Display a "back" button
    helpGraphics.overlayCallback = function (ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(window.innerWidth / 2 - 150, 20, 300, 48);
        ctx.fillStyle = "white";
        ctx.font = "24px serif";
        ctx.textAlign = "center";
        ctx.fillText("Back", window.innerWidth / 2, 50);
    };

    // Add a mouse listener for the back button
    helpInput.addMouseListener(
        "mousedown",
        0,
        [window.innerWidth / 2 - 150, 20, window.innerWidth / 2 + 150, 54],
        () => {
            stateManager.switchState("Main");
        }
    );

    // Enable and disable the help text display on enter and exit
    function helpInit() {
        // https://developer.mozilla.org/en-US/docs/Web/CSS/display
        document.getElementById("helpMenu").style.display = "block";
    }
    function helpExit() {
        document.getElementById("helpMenu").style.display = "none";
    }

    stateManager.addState({
        name: "Help",
        init: helpInit,
        exit: helpExit,
        inputSystem: helpInput,
        graphicsSystem: helpGraphics,
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// FLOW:

function init() {
    // Fix canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Start in the main menu
    stateManager.switchState("Main");
}

function main(time) {
    // Get delta time (in seconds, not millis)
    deltaTime = (time - lastTime) / 1000;

    // Update the game through the stateManager
    //  (see the program sections for their respecitve main loop)
    stateManager.update();

    // Finish function and order a new one
    lastTime = time;
    requestAnimationFrame(main);
}

init();
requestAnimationFrame(main);

// Temporary function to reload game without reloading page
function restart() {
    ingameExit();
    ingameInit();
}
