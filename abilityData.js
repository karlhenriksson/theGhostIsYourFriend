"use strict";
/*

Defining the different abilities and what they do.

Karl Henriksson 
*/

// This is where I store the abilities that can be bought when upgrading.
// All abilities sit here until they reach max level, after which they get removed
//  and can thus not be taken again.
let untakenAbilities = [
  //                        [Type]    |   [Character]
  "Cookie shot", //         Normal    |   Aimed
  "Electric Arcs", //       Piercing  |   Wipe
  "Piercing Diamond", //    Piercing  |   Aimed
  "Frozen Pizza", //        Freeze    |   Aimed
  "Ice cubes", //           Freeze    |   Wipe
  "Fireball", //            Explosive |   Aimed
  "Explosive Stick", //     Explosive |   Stationary
  "Passive Healing", //     Passive   |
  "Speed Increase", //      Passive   |
  "Ghost Speed", //         Passive   |
  "Max Health", //          Passive   |
];

const abilityData = {
  // COOKIE SHOT: Shoots a cookie at the mouse pointer
  "Cookie shot": {
    description:
      "Shoots a cookie towards the mouse pointer. Upgrades decrease cooldown.",
    callback: function () {
      // Set cooldown depending on level
      this.cooldown = this.levelValues[this.level];
      // Calculate direction to go in
      let distanceToMouse = Math.sqrt(
        (ingameInput.mouseX - window.innerWidth / 2) ** 2 +
          (ingameInput.mouseY - window.innerHeight / 2) ** 2
      );
      let dir = {
        x:
          movementVector.x +
          (1200 * (ingameInput.mouseX - window.innerWidth / 2)) /
            distanceToMouse,
        y:
          movementVector.y +
          (1200 * (ingameInput.mouseY - window.innerHeight / 2)) /
            distanceToMouse,
      };
      // Create a cookie projectile
      projectiles.push(
        new projectile(this.graphics, {
          sprite: "Cookie",
          dir: dir,
          damage: 120,
        })
      );
    },
    maxLevel: 5,
    levelValues: {
      // Honestly, a list would work fine here
      // Cooldown values, in this case. But these lists can contain anything
      1: 1,
      2: 0.8,
      3: 0.6,
      4: 0.4,
      5: 0.2,
    },
  },

  // BAD APPLE: Shoots an apple towards the ghost.
  "Bad Apple": {
    description:
      "Shoots an apple towards the ghost. The apple hurts enemies, and not the ghost. Upgrades decrease cooldown.",
    callback: function () {
      this.cooldown = this.levelValues[this.level];
      // Calculate direction to go in
      let dir = distanceToGhost
        ? {
            x: (1000 * (ghostPosition.x - playerPosition.x)) / distanceToGhost,
            y: (1000 * (ghostPosition.y - playerPosition.y)) / distanceToGhost,
          }
        : { x: 0, y: 0 };
      // Create a cookie projectile
      projectiles.push(
        new projectile(this.graphics, {
          sprite: "Apple",
          dir: dir,
          damage: 50,
        })
      );
    },
    maxLevel: 5,
    levelValues: {
      1: 0.55,
      2: 0.45,
      3: 0.35,
      4: 0.25,
      5: 0.15,
    },
  },

  // PIERCING DIAMOND: Shoot a piercing diamond toward the mouse pointer
  "Piercing Diamond": {
    description:
      "Shoots a damaging, piercing diamond towards the mouse pointer. Upgrades increase damage.",
    callback: function () {
      this.cooldown = 0.9;
      // Calculate direction to go in
      let distanceToMouse = Math.sqrt(
        (ingameInput.mouseX - window.innerWidth / 2) ** 2 +
          (ingameInput.mouseY - window.innerHeight / 2) ** 2
      );
      let dir = {
        x:
          movementVector.x +
          (1200 * (ingameInput.mouseX - window.innerWidth / 2)) /
            distanceToMouse,
        y:
          movementVector.y +
          (1200 * (ingameInput.mouseY - window.innerHeight / 2)) /
            distanceToMouse,
      };
      // Create a projectile
      projectiles.push(
        new projectile(this.graphics, {
          sprite: "Diamond",
          dir: dir,
          piercing: true,
          damage: this.levelValues[this.level],
        })
      );
    },
    maxLevel: 5,
    levelValues: {
      // Damage
      1: 1200,
      2: 1800,
      3: 2400,
      4: 3000,
      5: 3600,
    },
  },

  // ICE CUBES: Shoot an ice cube in a random direction that freezes and damages enemies
  "Ice cubes": {
    description:
      "Shoots ice cubes in 6 directions. Ice cubes temporarily freeze enemies and deal slight damage. Upgrades increase freeze time.",
    callback: function () {
      // Set cooldown
      this.cooldown = 1.5;
      // For 6 directions...
      for (let n = 0; n < 6; n++) {
        const v = (n / 6) * Math.PI * 2;
        // Create an ice cube projectile which freezes and enemies on contact
        projectiles.push(
          new projectile(this.graphics, {
            sprite: "Ice",
            dir: { x: Math.sin(v) * 150, y: Math.cos(v) * 150 },
            damage: 20,
            hitSpecial: (enemy) =>
              enemy.freezeFor(this.levelValues[this.level]),
          })
        );
      }
    },
    // The freeze duration is what's being leveled up
    maxLevel: 5,
    levelValues: {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
    },
  },

  // FROZEN PIZZA: Shoot a piercing pizza that freezes all enemies it hits for a significant amount of time.
  "Frozen Pizza": {
    description:
      "Shoots a piercing pizza at slow intervals that freezes all enemies it hits for a significant amount of time. Upgrades decrease cooldown.",
    callback: function () {
      this.cooldown = this.levelValues[this.level];
      // Calculate direction to go in
      let distanceToMouse = Math.sqrt(
        (ingameInput.mouseX - window.innerWidth / 2) ** 2 +
          (ingameInput.mouseY - window.innerHeight / 2) ** 2
      );
      const dir = {
        x:
          movementVector.x +
          (800 * (ingameInput.mouseX - window.innerWidth / 2)) /
            distanceToMouse,
        y:
          movementVector.y +
          (800 * (ingameInput.mouseY - window.innerHeight / 2)) /
            distanceToMouse,
      };
      // Create a projectile
      projectiles.push(
        new projectile(this.graphics, {
          sprite: "Pizza",
          dir: dir,
          piercing: true,
          damage: 0,
          hitSpecial: function (enemy) {
            enemy.freezeFor(5);
          },
        })
      );
    },
    maxLevel: 5,
    levelValues: {
      1: 5,
      2: 4.5,
      3: 4,
      4: 3.5,
      5: 3,
    },
  },

  // EXPLOSIVE STICK: Drop a TNT at the player position that explodes after a little while
  "Explosive Stick": {
    description:
      "Drops a TNT at the player location. TNT:s explode after a short delay, dealing damage to enemies (not to the player). Upgrades increase damage.",
    callback: function () {
      // Set cooldown
      this.cooldown = 1;
      // Drop an unmoving TNT projectile
      projectiles.push(
        new projectile(this.graphics, {
          sprite: "Explosive",
          piercing: true,
          lifetime: 2,
          // Spawn an explosion projectile when projectile dies
          dieSpecial: (thisProjectile) => {
            projectiles.push(
              new projectile(this.graphics, {
                sprite: "Explosion",
                lifetime: 0.25,
                position: thisProjectile.position,
                piercing: true,
                size: 96,
                damage: this.levelValues[this.level],
              })
            );
          },
        })
      );
    },
    maxLevel: 5,
    levelValues: {
      1: 400,
      2: 600,
      3: 800,
      4: 1000,
      5: 1200,
    },
  },

  "Passive Healing": {
    description:
      "Passively heals the player when near the ghost. Upgrades increase healing rate.",
    callback: function () {
      if (distanceToGhost < 128)
        playerHealth = Math.min(
          playerMaxHealth,
          playerHealth + deltaTime * this.levelValues[this.level]
        );
    },
    maxLevel: 5,
    levelValues: {
      // In percent of health healed per second
      1: 2,
      2: 4,
      3: 6,
      4: 8,
      5: 10,
    },
  },

  "Electric Arcs": {
    description:
      "Shoots piercing electric bolts in a spiral pattern. Bolts slow down over time and deal damage to enemies. Upgrades increase damage.",
    callback: function () {
      this.cooldown = 0.25;
      // Advance angle
      if (!this.angle) this.angle = 0;
      this.angle = (this.angle + 0.5) % Math.PI;
      // Create 2 projectiles
      projectiles.push(
        new projectile(this.graphics, {
          sprite: "Bolt",
          piercing: true,
          dir: {
            x: Math.sin(this.angle) * 500 + movementVector.x,
            y: Math.cos(this.angle) * 500 + movementVector.y,
          },
          damage: this.levelValues[this.level],
        })
      );
      projectiles.push(
        new projectile(this.graphics, {
          sprite: "Bolt",
          piercing: true,
          dir: {
            x: Math.sin(this.angle + Math.PI) * 500 + movementVector.x,
            y: Math.cos(this.angle + Math.PI) * 500 + movementVector.y,
          },
          damage: this.levelValues[this.level],
        })
      );
    },
    maxLevel: 5,
    levelValues: {
      1: 480,
      2: 540,
      3: 600,
      4: 660,
      5: 720,
    },
  },

  // FIREBALL: Shoot a fireball towards mouse. Fireballs explode on impact, dealing damage to anything around.
  Fireball: {
    description:
      "Shoots a slow fireball towards the mouse pointer. Fireballs explode on impact, dealing damage to all nearby enemies. Upgrades increase damage.",
    callback: function () {
      this.cooldown = 1;
      // Calculate direction to go in
      let distanceToMouse = Math.sqrt(
        (ingameInput.mouseX - window.innerWidth / 2) ** 2 +
          (ingameInput.mouseY - window.innerHeight / 2) ** 2
      );
      let dir = {
        x:
          movementVector.x +
          (600 * (ingameInput.mouseX - window.innerWidth / 2)) /
            distanceToMouse,
        y:
          movementVector.y +
          (600 * (ingameInput.mouseY - window.innerHeight / 2)) /
            distanceToMouse,
      };
      // Create a fireball projectile
      projectiles.push(
        new projectile(this.graphics, {
          sprite: "Fire",
          dir: dir,
          damage: 120,
          hitSpecial: (enemyHit, thisProjectile) => {
            projectiles.push(
              new projectile(this.graphics, {
                sprite: "Explosion",
                lifetime: 0.25,
                position: thisProjectile.position,
                piercing: true,
                size: 96,
                damage: this.levelValues[this.level],
              })
            );
          },
        })
      );
    },
    maxLevel: 5,
    levelValues: {
      1: 480,
      2: 540,
      3: 600,
      4: 660,
      5: 720,
    },
  },

  // SPEED INCREASE: Increases speed.
  "Speed Increase": {
    description: "Increases player speed. Does NOT increase speed of ghost.",
    callback: function () {
      // Set cooldown to null to make this callback never run again
      this.cooldown = null;
      playerSpeed = this.levelValues[this.level];
    },
    maxLevel: 3,
    levelValues: {
      1: 330,
      2: 360,
      3: 390,
    },
  },

  // GHOST SPEED: Increases ghost speeed
  "Ghost Speed": {
    description: "Increases ghost speed. Does NOT increase speed of player.",
    callback: function () {
      // Set cooldown to null to make this callback never run again
      this.cooldown = null;
      ghostSpeed = this.levelValues[this.level];
    },
    maxLevel: 3,
    levelValues: {
      1: 110,
      2: 120,
      3: 130,
    },
  },

  // MAX HEALTH: Increases max health
  "Max Health": {
    description: "Increases max health of player.",
    callback: function () {
      // Set cooldown to null to make this callback never run again
      this.cooldown = null;
      playerMaxHealth = this.levelValues[this.level];
    },
    maxLevel: 3,
    levelValues: {
      1: 120,
      2: 140,
      3: 160,
    },
  },
};
