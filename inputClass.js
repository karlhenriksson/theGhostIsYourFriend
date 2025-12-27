"use strict";
/*

Defines an 'input' class, which can be used for things related to mouse and keyboard input.

PROPERTIES:
keyIsPressed (bool): Is any key pressed?
pressedKey (string): Key last pressed
pressedKeys (Array): Array of all keys pressed
keyListenersPress (Object): Keeps track on all key listeners for keydown
keyListenersRelease (Object): Like keyListenersPress, but for keyup
mouseButtonsPressed (Array): If mouse button nr.x is pressed, mouseButtonsPressed[x] is true
mouseX, mouseY (int): Store mouse position
mouseListenersPressed (Array): Keeps track on all mouse listeners for mousedown
mouseListenersPressed (Array): Keeps track on all mouse listeners for mouseup

METHODS:
addKeyListener (listenerType, key, callback): Add a key listener for the key corresponding with the callback
removeKeyListener (listenerType, key): Remove a given key listener
addMouseListener (listenerType, buttonNumber, [bound coords], callback)
addMouseListener (listenerType, buttonNumber, [bound coords])

NOTES:
- If 6 or more keys are pressed simultaneoulsy, javascript stops registering keypresses
  reliably. This shouldn't be a problem, since 6 is more than enough, but good to remember
- Only one listener allowed per key/mouse button!
- Since I don't know how many mouse buttons a given mouse can have, mouseButtonsPressed contains
  undefined if the button has never been pressed. I can't really see this being an issue though

v0.1 (2023-11-10): Started work on the script, adding some basic properties
v0.2 (2023-11-13): Fixed a bug with a 'this' word referencing a function instead of an object in
  the addKeyListener method and made the listeners actually execute
v1.0 (2023-11-14): Added mouse functionality with mouse listeners. Also made the object a constructor
  so that I can have multiple input systems. This also warranted a way to disable input objects
v1.1 (2023-11-15): Removed the distinction between shifted and non-shifted keys in key listeners.
  Also removed the temporary testing code
v1.2 (2023-11-20): Added mouseX and mouseY
v1.3 (2023-11-21): Made mouse callbacks need a hitbox in order to be called
v1.4 (2024-01-19): Fixed some minor bugs
Karl Henriksson
*/

// A constructor returning an input element
class input {
  // If enabled is false, the input stops reacting to events
  enabled = true;
  // Is any key pressed atm?
  keyIsPressed = false;
  // Key last pressed
  pressedKey = "";
  // List of pressed keys
  pressedKeys = [];
  // Internal list of keys that the program should listen to.
  // Parameter names are the keys, the values are callbacks to run.
  // OBS: Only one listener per key!
  keyListenersPress = {};
  keyListenersRelease = {};
  // List of mouse buttons, to see what mouse buttons are pressed atm
  mouseButtonsPressed = [];
  // Mouse position
  mouseX = undefined;
  mouseY = undefined;
  // List of functions to run when the corresponding button is presseed.
  //  Contains objecta with hitbox data and callbacks.
  mouseListenersPress = [];
  mouseListenersRelease = [];

  // Just adds event listeners; the rest is managed outside of the constructor
  constructor() {
    // Adds a listener for when a key is pressed so that the object can respond
    document.addEventListener("keydown", (event) => {
      // If the key is already pressed (aka is being held down), also do nothing
      if (this.pressedKeys.indexOf(event.key.toLowerCase()) !== -1) return;

      // Change the parameters to be accurate
      this.keyIsPressed = true;
      this.lastKey = event.key;
      // Add key to pressedKeys
      this.pressedKeys.push(event.key.toLowerCase());
      // If disabled, don't check listeners
      if (!this.enabled) return;
      // Execute a listener callback if it's existent (might not need the if statement)
      if (this.keyListenersPress[event.key.toLowerCase()]) {
        this.keyListenersPress[event.key.toLowerCase()]();
      }
    });

    // Adds a listener for when a key is let go of so that the object can respond
    document.addEventListener("keyup", (event) => {
      // Remove key from pressed keys
      //  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
      this.pressedKeys.splice(
        this.pressedKeys.indexOf(event.key.toLowerCase()),
        1
      );
      // Set keyIsPressed to false if no key is pressed
      this.keyIsPressed = this.pressedKeys.length != 0;

      // If disabled, don't check listeners
      if (!this.enabled) return;
      // Execute a listener callback if it's existent
      if (this.keyListenersRelease[event.key.toLowerCase()]) {
        this.keyListenersRelease[event.key.toLowerCase()]();
      }
    });

    // Adds a listener for when a mouse button is pressed
    //  https://developer.mozilla.org/en-US/docs/Web/API/Element/mousedown_event
    document.addEventListener("mousedown", (event) => {
      // Change the correct index in mouseButtonsPressed
      this.mouseButtonsPressed[event.button] = true;

      // If disabled, don't check listeners
      if (!this.enabled) return;

      // Only continue if there is a listener list for the given button
      if (!this.mouseListenersPress[event.button]) return;
      // Loop through all listeners for this button
      for (let listenerObject of this.mouseListenersPress[event.button]) {
        // If the mouse is inside the listener's hitbox, execute the callback
        if (
          this.mouseX >= listenerObject.x1 &&
          this.mouseX <= listenerObject.x2 &&
          this.mouseY >= listenerObject.y1 &&
          this.mouseY <= listenerObject.y2
        ) {
          listenerObject.callback();
        }
      }
    });

    // Adds a listener for when a mouse button is released
    document.addEventListener("mouseup", (event) => {
      // If disabled, to nothing
      if (!this.enabled) return;

      // Change the correct index in mouseButtonsPressed
      this.mouseButtonsPressed[event.button] = false;
      // Execute a potential listener callback
      if (this.mouseListenersRelease[event.button])
        this.mouseListenersRelease[event.button]();
    });

    // Add a listener for when the mouse is moved to change mouse X and Y
    // (https://stackoverflow.com/questions/7790725/javascript-track-mouse-position)
    document.addEventListener("mousemove", (event) => {
      this.mouseX = event.pageX;
      this.mouseY = event.pageY;
    });
  }

  // METHODS:

  // Add a callback function to run when the specified key is pressed/released.
  // IN: "keydown" or "keyup" , key to listen for , callback to run
  // Fix for 'this' referring to a function instead of the object:
  //   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects
  addKeyListener(listenerType, key, callback) {
    // Check what object to add the "listener" to; keydown or keyup? Then add the key/value
    switch (listenerType) {
      case "keydown": {
        this.keyListenersPress[key] = callback;
        break;
      }
      case "keyup": {
        this.keyListenersRelease[key] = callback;
        break;
      }
      default:
        console.warn("Tried to add an invalid key listener!");
    }
  }
  // Remove the given key listener
  removeKeyListener(listenerType, key) {
    // Check what object to remove the "listener" from; keydown or keyup? Then remove that reference
    switch (listenerType) {
      case "keydown": {
        delete this.keyListenersPress[key];
        break;
      }
      case "keyup": {
        delete this.keyListenersRelease[key];
        break;
      }
      default:
        console.warn("Tried to remove an invalid key listener!");
    }
  }

  // Function to add a listener for a given mouse button
  //  IN: "mousedown" or "mouseup" , mouse button number , rect coordinates (in array) , callback to run
  //  (basically addKeyListener, but for mouse buttons)
  addMouseListener(listenerType, buttonNumber, [x1, y1, x2, y2], callback) {
    // Check what list to add the "listener" to; mousedown or mouseup?
    let listenerObject = {
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      callback: callback,
    };
    switch (listenerType) {
      case "mousedown": {
        // If this is the first listener, create a new array
        if (this.mouseListenersPress[buttonNumber] === undefined)
          this.mouseListenersPress[buttonNumber] = [];
        this.mouseListenersPress[buttonNumber].push(listenerObject);
        break;
      }
      case "mouseup": {
        // If this is the first listener, create a new array
        if (this.mouseListenersRelease[buttonNumber])
          this.mouseListenersRelease[buttonNumber] = [];
        this.mouseListenersRelease[buttonNumber].push(listenerObject);
        break;
      }
      default:
        console.warn("Tried to add an invalid mouse listener!");
    }
  }

  // Remove the given mouse listener
  // IN: The same parameters as when adding, except for the callback
  removeMouseListener(listenerType, buttonNumber, [x1, y1, x2, y2]) {
    // Check what list to remove the "listener" from; keydown or keyup? Then remove that reference
    let checkedList;
    switch (listenerType) {
      case "mousedown": {
        checkedList = this.mouseListenersPress[buttonNumber];
        break;
      }
      case "mouseup": {
        checkedList = this.mouseListenersRelease[buttonNumber];
        break;
      }
      default: {
        console.warn("Tried to remove an invalid mouse listener!");
        return;
      }
    }
    // Loop through all mouse listeners
    for (let index in checkedList) {
      let listenerObject = checkedList[index];
      // If the hitbox coords match, remove the listener
      if (
        listenerObject.x1 === x1 &&
        listenerObject.x2 === x2 &&
        listenerObject.y1 === y1 &&
        listenerObject.y2 === y2
      )
        this.pressedKeys.splice(index, 1);
    }
  }
}
