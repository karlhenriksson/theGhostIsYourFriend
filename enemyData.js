"use strict";
/*

This is where I define the different enemy types and their behaviour

v1.0 (2024-02-01): Moved script to here. Added sunglasses and laughing
Karl Henriksson
*/

const enemyData = {
  //
  // The standard enemy
  standard: {
    spriteName: "Standard1",
    // Randomize the sprite from Standard1 to Standard5
    onCreate: (enemy) => {
      enemy.originalSpriteName = "Standard" + Math.floor(1 + Math.random() * 5);
    },
  },

  // Will shoot damaging hearts at the player
  kissing: {
    spriteName: "Kissing",
    onCreate: function (enemy) {
      enemy.args[0] = 2; // Setting a cooldown argument
    },
    updateCallback: function (enemy) {
      enemy.args[0] -= deltaTime; // Decrease cooldown
      if (enemy.args[0] < 0) {
        enemy.args[0] = 4;
        // Calculate the projectile direction
        const dX = playerPosition.x - enemy.position.x;
        const dY = playerPosition.y - enemy.position.y;
        const dst = Math.sqrt(dX * dX + dY * dY);
        // Spawn an unfriendly heart projectile
        projectiles.push(
          new projectile(ingameGraphics, {
            position: { ...enemy.position },
            dir: { x: (300 * dX) / dst, y: (300 * dY) / dst },
            damage: 10,
            sprite: "Heart",
            unfriendly: true,
          })
        );
      }
    },
  },

  // Will drop money when killed
  money: {
    spriteName: "Money",
    onDeath: function (enemy) {
      pickups.push(
        new pickup(enemy.graphicsToUse, {
          spriteName: "MoneyPickup",
          position: enemy.position,
          onPickup: () => {
            playerMoney++;
          },
        })
      );
    },
  },

  // Shoots unfriendly party projectiles in random directions
  party: {
    spriteName: "Party",
    onCreate: function (enemy) {
      enemy.args[0] = 0.8; // Argument used as cooldown
    },
    updateCallback: function (enemy) {
      enemy.args[0] -= deltaTime; // Decrease cooldown
      if (enemy.args[0] < 0) {
        enemy.args[0] = 1;
        // Random direction
        const v = Math.random() * Math.PI * 2;
        // Spawn projectile
        projectiles.push(
          new projectile(ingameGraphics, {
            position: { ...enemy.position },
            dir: { x: 450 * Math.sin(v), y: 450 * Math.cos(v) },
            damage: 9,
            // Choose randomly between projectile 1 and 2
            sprite: Math.random() > 0.5 ? "Party1" : "Party2",
            unfriendly: true,
          })
        );
      }
    },
  },

  // Beefy enemy that loses its stars and spawns a copy of itself without stars once it dies
  //  They also drop money when they die.
  star: {
    spriteName: "StarEyes",
    health: 300,
    onDeath: function (deadEnemy) {
      // Drop money
      pickups.push(
        new pickup(ingameGraphics, {
          spriteName: "MoneyPickup",
          position: deadEnemy.position,
          onPickup: () => {
            playerMoney++;
          },
        })
      );
      // Spawn another enemy at this location
      const newEnemy = new enemy(ingameGraphics, enemyData["starNoEyes"]);
      newEnemy.position.x = deadEnemy.position.x; // Setting it value by value in order to not overwrite the link
      newEnemy.position.y = deadEnemy.position.y; //  between the newEnemy position and the object in ingameGraphics
      enemies.push(newEnemy);
      // Shoot two stars in random directions (if not frozen)
      if (enemy.freezeTime < 0) {
        for (let i = 0; i < 2; i++) {
          const v = Math.random() * Math.PI * 2;
          projectiles.push(
            new projectile(ingameGraphics, {
              position: { ...deadEnemy.position },
              dir: { x: 300 * Math.sin(v), y: 300 * Math.cos(v) },
              damage: 25,
              sprite: "Star",
              unfriendly: true,
            })
          );
        }
      }
    },
  },

  // A stronger version of standard5 that is spawned after a star-eyed enemy dies
  starNoEyes: {
    spriteName: "Standard5",
    health: 200,
  },

  // Sprays germs on death.
  sick: {
    spriteName: "Sick",
    onDeath: function (enemy) {
      // If the enemy was killed while frozen, do nothing
      if (enemy.freezeTime > 0) return;
      // Spawn 12 germ projectiles
      for (let v = 0; v < 2 * Math.PI; v += Math.PI / 6) {
        projectiles.push(
          new projectile(ingameGraphics, {
            position: { ...enemy.position },
            dir: { x: 450 * Math.sin(v), y: 450 * Math.cos(v) },
            damage: 20,
            sprite: "Germ",
            unfriendly: true,
            lifetime: 2,
            updateSpecial: function (projectile) {
              projectile.direction.x *= 1 - deltaTime;
              projectile.direction.y *= 1 - deltaTime;
            },
          })
        );
      }
    },
  },

  // Becomes a furious enemy when hit
  angry: {
    spriteName: "Angry",
    health: 1,
    onDeath: function (deadEnemy) {
      // Spawn a furious enemy at this location
      const newEnemy = new enemy(ingameGraphics, enemyData["furious"]);
      newEnemy.position.x = deadEnemy.position.x; // Setting it value by value in order to not overwrite the link
      newEnemy.position.y = deadEnemy.position.y; //  between the newEnemy position and the object in ingameGraphics
      enemies.push(newEnemy);
    },
  },

  // Fast and sort of strong. Spawned when an angry is hit
  furious: {
    spriteName: "Furious",
    health: 200,
    speed: 200,
  },

  // Becomes a woken up enemy when hit
  sleeping: {
    spriteName: "Sleeping",
    health: 1,
    speed: 0,
    onDeath: function (deadEnemy) {
      // Spawn a furious enemy at this location
      const newEnemy = new enemy(ingameGraphics, enemyData["wokenUp"]);
      newEnemy.position.x = deadEnemy.position.x;
      newEnemy.position.y = deadEnemy.position.y;
      enemies.push(newEnemy);
    },
  },

  // Average enemy
  wokenUp: {
    spriteName: "WokenUp",
  },

  // Fast and weak. Runs in the direction that the player was to them when they spawned.
  laughing: {
    spriteName: "Laughing",
    health: 80,
    speed: 0,
    // Calculate a direction to go in
    onCreate: function (enemy) {
      const dstToPlayer = Math.sqrt(
        (enemy.position.x - playerPosition.x) ** 2 +
          (enemy.position.y - playerPosition.y) ** 2
      );
      // Set the direction to go in as a custom argument
      enemy.args[0] = {
        x: (200 * (playerPosition.x - enemy.position.x)) / dstToPlayer,
        y: (200 * (playerPosition.y - enemy.position.y)) / dstToPlayer,
      };
    },
    // Go in the calculated direction
    updateCallback: function (enemy) {
      enemy.position.x += enemy.args[0].x * deltaTime;
      enemy.position.y += enemy.args[0].y * deltaTime;
    },
  },

  //  Slow, lots of health. Drops money
  sunglasses: {
    spriteName: "Sunglasses",
    health: 600,
    speed: 50,
    onDeath: function (enemy) {
      pickups.push(
        new pickup(enemy.graphicsToUse, {
          spriteName: "MoneyPickup",
          position: enemy.position,
          onPickup: () => {
            playerMoney++;
          },
        })
      );
    },
  },
};
// Storing an empty function so that I don't create new functions for every
//  enemy added (I should probably move this to gameManager.js and use it everywhere
//  I need an empty function)
const emptyFunction = () => {};
