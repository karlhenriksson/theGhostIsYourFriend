"use strict";
/*

Contains all the classes related to the game.

v0.1 (2023-12-08): Added base functionality, not yet done at all though
v0.2 (2023-12-12): Fixed a few bugs
v1.0 (2023-12-12): Finished base functionality
v1.1 (2024-01-19): Added hitSpecial method
v1.2 (2024-01-26): Made damage go up/down over time to screw up lategame players
v2.0 (2024-02-01): Pushed all class definitions into this script
v2.1 (2024-02-02): Abilities can now have their cooldowns set to null to only run once
Karl Henriksson
*/

class projectile {
  position;
  direction;
  size; // pixels, RADIUS NOT DIAMETER
  damage;
  piercing;

  // If this is true, hits player instead of enemies
  unfriendly;

  lifetime; // Seconds

  // Graphics system to display in
  graphicsSystem = undefined;
  // ID to use as reference in the graphics system
  graphicsID = undefined;

  // Runs when projectile is updated, can adjust anything with the projectile
  updateSpecial;
  // Runs when enemies are hit by the projectile
  hitSpecial;

  constructor(
    graphicsToUse,
    {
      position = { ...playerPosition },
      dir = { x: 0, y: 0 },
      size = 18,
      damage = 0,
      lifetime = 5,
      piercing = false,
      sprite = undefined,
      updateSpecial = (thisProjectile) => {},
      hitSpecial = (enemy) => {},
      dieSpecial = (thisProjectile) => {},
      unfriendly = false,
    }
  ) {
    if (!sprite) console.error("No sprite specified for projectile!");

    // Copy all the input values (could do this more easily and cleanly using Object.entries)
    this.position = position;
    this.direction = dir;
    this.size = size;
    this.damage = damage;
    this.lifetime = lifetime;
    this.piercing = piercing;
    this.updateSpecial = updateSpecial;
    this.hitSpecial = hitSpecial;
    this.dieSpecial = dieSpecial;
    this.unfriendly = unfriendly;

    // Do graphics stuff
    this.graphicsID = nextID;
    this.graphicsSystem = graphicsToUse;
    graphicsToUse.addObject("game", nextID, sprite, position.x, position.y);
    nextID++;
    // Copying the position from this object to the graphics object,
    //  this makes it automatically update
    graphicsToUse.gameObjects[this.graphicsID].position = this.position;
  }

  update() {
    // Move the projectile (since this.position and the position in the graphics object
    //  are the same, this also updates the gameObject in the graphics instance)
    this.position.x += this.direction.x * deltaTime;
    this.position.y += this.direction.y * deltaTime;

    this.lifetime -= deltaTime;

    this.updateSpecial(this);

    // Check if the lifetime is out. If so, run the dieSpecial and kill the projectile
    if (this.lifetime < 0) {
      this.dieSpecial(this);
      return false;
    }

    // If the bullet is unfriendly, check if it hit the player
    if (this.unfriendly) {
      // Sort of duplicate code from below
      let xDifference = this.position.x - playerPosition.x;
      let yDifference = this.position.y - playerPosition.y;
      if (Math.abs(xDifference) + Math.abs(yDifference) > 100) return true;
      let distanceSq = xDifference * xDifference + yDifference * yDifference;

      // If hit player...
      if (distanceSq < ((enemyDiameter + this.size) / 2) ** 2) {
        // Run the special hit function (no enemy specified)
        this.hitSpecial(null);
        // Deal damage (increasing with time)
        playerHealth -= this.damage * 1.05 ** minutesSurvived;
        if (this.piercing) return true; // If the projectile is piercing, it's still alive, so return true
        return false; // Otherwise, the projectile is dead. return false.
      }

      // Unfriendly update is done, return true
      return true;
    }

    // If the above statement didn't trigger, the projectile is friendly. Run this update function instead:

    // Check if the projectile hit somthing:
    // Loop through all enemies
    for (const enemy of enemies) {
      let xDifference = this.position.x - enemy.position.x;
      let yDifference = this.position.y - enemy.position.y;
      // If the projectile isn't remotely close to the enemy, don't bother calculating
      if (Math.abs(xDifference) + Math.abs(yDifference) > 100) continue;
      // Else, calculate the squared distance from the projectile to the enemy
      let distanceSq = xDifference * xDifference + yDifference * yDifference;

      // If distance is below the added size of the enemy and the projectile,
      //  do hitting stuff
      if (distanceSq < ((enemyDiameter + this.size) / 2) ** 2) {
        // Run the special hit function
        this.hitSpecial(enemy, this);
        // Deal damage (less over time, and when far away from ghost)
        // (if it's piercing, multiply by deltaTime)
        if (this.piercing) {
          enemy.health -=
            this.damage * 0.95 ** minutesSurvived * ghostPenalty * deltaTime;
        } else {
          enemy.health -= this.damage * 0.95 ** minutesSurvived * ghostPenalty;
        }
        if (this.piercing) return true; // If the projectile is piercing, it's still alive, so return true
        return false; // Otherwise, the projectile is dead. return false.
      }
    }
    // No enemy was hit, return true since the projectile is still alive
    return true;
  }
}

// Pickups. In the constructor, you can define an image, a position and a callback.
class pickup {
  position;
  spriteName;
  graphicsID;
  graphicsToUse;

  // Ran when picked up by player
  onPickup;

  constructor(graphicsToUse, { position, spriteName, onCreate, onPickup }) {
    // Run onCreate function
    if (onCreate) onCreate(this);

    // Set values
    this.position = position;
    this.spriteName = spriteName;
    this.onPickup = onPickup;

    // Do graphics (add as a background object)
    this.graphicsToUse = graphicsToUse;
    graphicsToUse.addObject("background", nextID, spriteName, this.position);
    this.graphicsID = nextID;
    nextID++;
  }

  update() {
    // If close to player, pick up:

    // Get the X and Y diff to player
    let xDifference = this.position.x - playerPosition.x;
    let yDifference = this.position.y - playerPosition.y;

    // If the pickup isn't close at all, don't bother calculating
    if (Math.abs(xDifference) + Math.abs(yDifference) > 100) return true;
    // Else, calculate the actual, squared distance
    let dstSq = xDifference * xDifference + yDifference * yDifference;
    // If this distance is lower than the pickupRangeSquared, pick up the object
    if (dstSq < pickupRangeSquared) {
      this.onPickup();
      return false;
    }

    // If not picked up, return true
    return true;
  }
}

// Abilities. Contain name, cooldown and callback, as well as leveling stuff
class ability {
  name = "Unknown ability";
  cooldown = 0; // Seconds, counting down

  graphics; // Graphics object to use when creating new projectiles

  level = 1;
  maxLevel = 1;
  levelValues = []; // Keeps values that change when the ability levels up

  run = function () {};
  levelUpCallback = function () {};

  constructor(name, graphicsToUse) {
    // Get data from abilityData
    const data = abilityData[name];
    if (!data) console.error("No data found for ability " + name);
    if (!data.callback)
      console.warn("No callback defined for ability " + this.name);

    // Set the values from the data
    this.name = name;
    this.run = data.callback;
    this.maxLevel = data.maxLevel;
    this.levelValues = data.levelValues;
    this.graphics = graphicsToUse;

    console.log("Added ability " + name);
  }

  // Decreases cooldown, and if the cooldown is done, run the ability
  update() {
    // If the cooldown is set to null, that means it shouldn't be updated. Igone the update call.
    if (this.cooldown === null) return;

    this.cooldown -= deltaTime;

    if (this.cooldown < 0) {
      this.run();
    }
  }

  levelUp() {
    if (this.level < this.maxLevel) {
      // Increase level and reset cooldown
      this.level++;
      this.cooldown = 0;
      console.log(
        "Ability " + this.name + " leveled up to level " + this.level
      );
    } else {
      console.warn("Tried to level", this.name, "above max level!");
    }
  }
}

// Enemies. They get their data (like health, speed etc) from the argument in the constructor.
class enemy {
  // Position (stores x and y)
  position = { x: 100, y: 300 };
  // Health
  health;
  // Speed
  speed;
  // Time until enemy unfreezes (0=unfrozen)
  freezeTime = 0;
  // Original sprite name used for resetting sprite when it changes back
  originalSpriteName;
  // Enemy ID, for linking to a graphics object
  graphicsID = null;
  // Graphics class to use when drawing
  graphicsToUse = null;
  // The special function used for this type of enemy
  updateSpecial;
  // Ran when the enemy is killed
  deathSpecial;
  // A list of arbitrary arguments that the update function can use
  args = [];

  // Constructs an enemy given a certain type
  // IN: graphics system to use, object containing all special traits for this particular type
  constructor(
    graphicsToUse,
    {
      onCreate = emptyFunction,
      updateCallback = emptyFunction,
      onDeath = emptyFunction,
      spriteName = "None",
      health = 100,
      speed = 100,
    }
  ) {
    // Set values that just need to be set
    this.position = randomSpawnPosition();
    this.spriteName = spriteName;
    this.health = health;
    this.speed = speed;
    this.originalSpriteName = spriteName;

    // Run the onCreate callback to modify any values that should be modified
    onCreate(this);

    // Set the update and death function to the provided callback
    this.updateSpecial = updateCallback;
    this.deathSpecial = onDeath;

    // Set the correct graphics system
    this.graphicsToUse = graphicsToUse;
    // Create a graphics object with the right sprite at that position
    //  (position will auto-update due to pointers :D)
    graphicsToUse.addObject("game", nextID, this.spriteName, this.position);
    this.graphicsID = nextID;
    nextID++;
  }

  // Runs every tick to update the enemy. Moves it closer to the player, checks if it's dead, etc.
  update() {
    // Check if it's dead. If so, return false to let the ingame main function know
    if (this.health <= 0) {
      this.deathSpecial(this);
      return false;
    }

    // Defrost enemy
    this.freezeTime -= deltaTime;

    // If the enemy is frozen, do nothing at all
    if (this.freezeTime > 0) return true;
    // Else, change sprite to the default one (the enemy could have been killed/removed
    //  when this runs, so there's a check for that)
    if (this.graphicsToUse.gameObjects[this.graphicsID])
      this.graphicsToUse.gameObjects[this.graphicsID].name =
        this.originalSpriteName;

    // If close to player, deal damage
    //  (assuming player size is equal to enemy size)
    if (
      (this.position.x - playerPosition.x) ** 2 +
        (this.position.y - playerPosition.y) ** 2 <
      enemyDiameterSq
    ) {
      playerHealth -= enemyDamage * deltaTime;
    }

    // Run the special function for this enemy
    this.updateSpecial(this);

    // Move towards player (integrate with an actual playerPosition later, for now just (0,0))
    let deltaX = playerPosition.x - this.position.x;
    let deltaY = playerPosition.y - this.position.y;
    let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY); // Avoiding **2 because of lag
    // If the distance is too low, don't move and return true since it's still alive
    if (distance < 20) return true;
    deltaX *= (deltaTime * this.speed) / distance;
    deltaY *= (deltaTime * this.speed) / distance;
    this.position.x += deltaX;
    this.position.y += deltaY;

    // Return true, since the enemy is still alive
    return true;
  }

  // Checks nearby enemies and moves away from them in order to not clip together
  updateCollision() {
    // If frozen, collision is being skipped
    if (this.freezeTime > 0) return;
    // Set temporary variables that keep track on where the enemy should move,
    //  and how many enemies there are
    let moveOffset = { x: 0, y: 0 };
    let numCollidedEnemies = 0;

    // Loop through all enemies later in the list
    for (let i = 0; i < enemies.length; i++) {
      let enemy = enemies[i];
      // Get the difference between the enemies
      let xDifference = this.position.x - enemy.position.x;
      let yDifference = this.position.y - enemy.position.y;
      // If the enemies are the same (aka if their positions match), ignore
      if (xDifference === 0 && yDifference === 0) continue;
      if (Math.abs(xDifference) + Math.abs(yDifference) > 100)
        // If the enemies aren't remotely close to each other, don't bother calculating
        continue;
      // Else, calculate the (squared) distance
      let dstSq = xDifference * xDifference + yDifference * yDifference;

      // If the squared distance is above the enemy hitbox size (also squared),
      //  move away from the enemy
      if (dstSq < enemyDiameterSq) {
        // Calculate the non-squared distance
        let dst = Math.sqrt(dstSq);

        // Add the required offset to the moveOffset variable
        moveOffset.x += (xDifference / dst) * enemyDiameter - xDifference;
        moveOffset.y += (yDifference / dst) * enemyDiameter - yDifference;
        numCollidedEnemies++;
      }
    }

    // If the enemy collided with anything...
    if (numCollidedEnemies) {
      // Scale the moveOffset depending on how many enemies were hit
      moveOffset.x /= numCollidedEnemies;
      moveOffset.y /= numCollidedEnemies;
      // Move the enemy using moveOffset and a friction multiplier
      this.position.x += 0.9 * moveOffset.x;
      this.position.y += 0.9 * moveOffset.y;
    }
  }

  // Freeze the enemy for a given time
  freezeFor(time) {
    // Set freezeTime
    this.freezeTime = Math.max(this.freezeTime, time);
    // Change sprite
    this.graphicsToUse.gameObjects[this.graphicsID].name = "Frozen";
  }
}
