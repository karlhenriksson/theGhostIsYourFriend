"use strict";
/*

Creates a stateManager object that manages states. Updating the state manager runs the
correct update function, which should be defined from the outside. Switches state using a method.
Basically, the state manager allows for creating a kind of flow chart

Uses inputClass.js and graphicsClass.js script, should be loaded after that script!

PROPERTIES:
activeState (string): The active state
activeInput (input): The active input system
activeGraphics (graphics): The active graphics system
states (Object): All possible states

METHODS:
addState(name, update, variables, inputSystem)
removeState(name)
update()
updateIndependent(name)
switchState(name)

v0.1 (2023-11-14): Added activeState and states
v0.2 (2023-11-14): Added functions for updating and switching state
v0.3 (2023-11-15): Completed the switchState method, moved all testing to a new script,
  and changed the way addState takes in arguments based on a suggestion by Isac.
v1.0 (2023-11-17): Added a few final checks, and modified the script to work with inputClass 1.2.
v1.1 (2023-11-21): Added activeInput and activeGraphics for easy referencing
*/

const stateManager = {
  // Keeps the name of the active state
  activeState: "default",
  // Keeps the active input system
  activeInput: null,
  // Keeps the active graphics system
  activeGraphics: null,
  // The dictionary of states. States have independent update functions, variables etc.
  states: {},

  // Add a new state.
  // IN: {
  //  name: name of state
  //  init: Function ran when switching to state
  //  update: Function to run whhen state is active
  //  exit: Function to run when switchiung from state
  //  inputSystem: Input system tied to state
  //  graphicsSystem: Graphics system tied to state
  // }
  // Isac, Na22C, proposed this syntax for large functions with default values.
  addState({
    name = "default",
    init = () => {},
    update = () => {},
    exit = () => {},
    inputSystem = undefined,
    graphicsSystem = undefined,
  }) {
    console.log("Added a new state: " + name);

    // Disable the input system given to the function
    inputSystem.enabled = false;

    // Create a new state and add it to the states list
    this.states[name] = {
      // Properties recieve their values from the function input
      // (Some variables have the same names, but that doesn't cause an issue thankfully)
      init: init,
      update: update,
      exit: exit,
      input: inputSystem,
      graphics: graphicsSystem,
    };
  },

  // Remove a given state
  // IN: name of state to remove
  removeState(name) {
    delete this.states[name];
  },

  // Runs the update function for the currently active state (if the state is valid)
  update() {
    let stateToUpdate = this.states[this.activeState];
    if (stateToUpdate) {
      // Run the graphics system's draw function if the graphics system is defined
      if (stateToUpdate.graphics) stateToUpdate.graphics.draw();
      // Run the update function
      stateToUpdate.update();
    }
  },

  // Runs an update for another state, but does not change the currently active state
  // IN: name of state to update
  updateIndependent(name) {
    // Run the update function
    this.states[name].update();
    // Run the graphics system's draw function
    this.states[name].graphics.draw();
  },

  // Switches the active state
  switchState(name) {
    // Only switch if the state is valid
    if (!this.states[name]) {
      console.error(
        "Cannot switch to state '" + name + "' because it doesn't exist."
      );
      return;
    }
    // Only disable old state if it exists
    if (this.states[this.activeState]) {
      // Disable the old state's input system
      this.states[this.activeState].input.enabled = false;
      // Run the exit function for the exited state
      this.states[this.activeState].exit();
    }

    // Switch activeState/Input/Graphics variables
    this.activeState = name;
    this.activeInput = this.states[name].input;
    this.activeGraphics = this.states[name].graphics;

    // Enable input system for new state after 1 tick
    requestAnimationFrame(
      () => (this.states[this.activeState].input.enabled = true)
    );
    // Run the init function for the new state
    this.states[this.activeState].init();
  },
};
