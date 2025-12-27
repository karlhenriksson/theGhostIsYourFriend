"use strict";
/*

A definition of a graphics class that will manage all drawing to the screen. It
can have moving objects with images pulled from an atlas

Seems to start lagging at around 2000 gameObjects, when nothing else except inputClass.js,
stateManager.js and testing.js are being run

v0.0 (2023-11-17): Technically sort of functional, but doesn't contain enough functionality to warrant a 1.x.
  Can hold objects and image references
v0.1 (2023-11-20): Made draw() clear the canvas at the start of function call, and added UI functionality
v1.0 (2023-11-21): Made objects have an ID for easy getting of objects
v1.1 (2023-11-24): Fixed some bugs
v1.2 (2023-12-13): Added an overlayCallback variable for doing arbitrary stuff after the other things have been done
Karl Henriksson
v1.3 (2024-01-12): Added the secondaryGraphicsObject property for overlay drawing
*/

class graphics {
  // Contains the atlas/spritesheet that the graphics instance pulls data from
  atlas = undefined;
  // Canvas object that is being drawn to
  canvas = undefined;
  // Context of the canvas to draw to
  ctx = undefined;
  // "Camera position"
  cameraPosition = { x: 0, y: 0 };
  // Contains values for getting an image from a spritesheet.
  // Loaded from the outside
  // For example, "stoneTile" may correspond to {sx:30, sy:60, width, height}
  // See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
  imageLookup = {};
  // Contains the background image that might exist
  backgroundImages = {};
  backgroundImageAtlas; // A special atlas for the background image
  // Contains objects that are part of the background and should be drawn first.
  // Every object has a position and a string being a key in imageLookup
  backgroundObjects = {};
  // A list of objects to draw after the background. A lot like backgroundObjects, but drawn above them.
  gameObjects = {};
  // A list of things to draw over the graphics objects.
  effectObjects = {};
  // A list of UI elements.
  uiObjects = {};

  // This is another graphics object, which is being drawn before this graphics object
  //  does its job. This allows for animated overlay graphics
  // (Yes, I could probably do it with two canvases. But this way I can nest overlays)
  secondaryGraphicsObject;

  // Overlay callback is used to draw anything else, overlayed over the objects (including UI!)
  overlayCallback = () => {};

  constructor(canvasId, atlasSource, bgAtlasSource) {
    // Get context
    this.canvas = document.getElementById(canvasId);
    this.ctx = canvas.getContext("2d");

    // Get atlas
    // (https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement)
    this.atlas = new Image();
    this.atlas.src = atlasSource;
    if (bgAtlasSource) {
      this.backgroundImageAtlas = new Image();
      this.backgroundImageAtlas.src = bgAtlasSource;
    }
  }

  // Draws all the objects, in order.
  draw() {
    // Clear screen
    // (https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clearRect)
    // (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // If there is a secondaryGraphicsObject, draw that first
    if (this.secondaryGraphicsObject) this.secondaryGraphicsObject.draw();

    // Draw the background images
    for (let [, obj] of Object.entries(this.backgroundImages)) {
      this.drawObject(obj, false, this.backgroundImageAtlas);
    }
    // Draw the background objects
    for (let [, obj] of Object.entries(this.backgroundObjects)) {
      this.drawObject(obj, false);
    }
    // Draw the game objects
    for (let [, obj] of Object.entries(this.gameObjects)) {
      this.drawObject(obj, false);
    }
    // Draw the effect objects
    for (let [, obj] of Object.entries(this.effectObjects)) {
      this.drawObject(obj, false);
    }
    // Draw the UI objects (these should not change depending on camera position!)
    for (let [, obj] of Object.entries(this.uiObjects)) {
      this.drawObject(obj, true);
    }

    // Do whatever the overlay callback wants to do
    this.overlayCallback(this.ctx);
  }

  // Used inside of draw() to draw objects
  drawObject(obj, ignoreCamera, atlasToUse = this.atlas) {
    let imageData = this.imageLookup[obj.name];
    if (!imageData) console.error("Image data not found for image " + obj.name);
    // Draw the image
    // (https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage)
    this.ctx.drawImage(
      atlasToUse,
      imageData.sx,
      imageData.sy,
      imageData.width,
      imageData.height,
      // Drawing position offset by 1) camera position 2) Canvas size/2 3) image size/2
      obj.position.x -
        (ignoreCamera ? 0 : this.cameraPosition.x) +
        this.canvas.width / 2 -
        imageData.width / 2,
      obj.position.y -
        (ignoreCamera ? 0 : this.cameraPosition.y) +
        this.canvas.height / 2 -
        imageData.height / 2,

      imageData.width,
      imageData.height
    );
  }

  // Add an object TYPE to the loaded types. This type can then be referenced by
  //  name in addObject
  addObjectType(name, data) {
    this.imageLookup[name] = data;
  }

  // Add an object to a list
  // IN: "background" or "game" or "effect" or "ui" , name of object , x , y
  addObject(layer, id, objectName, position) {
    let objToAdd = {
      name: objectName,
      position: position,
    };
    switch (layer) {
      case "backgroundImage":
        this.backgroundImages[id] = objToAdd;
        break;
      case "background":
        this.backgroundObjects[id] = objToAdd;
        break;
      case "game":
        this.gameObjects[id] = objToAdd;
        break;
      case "effect":
        this.effectObjects[id] = objToAdd;
        break;
      case "ui":
        this.uiObjects[id] = objToAdd;
        break;
      default:
        console.error(
          "Tried to create a graphics object on a nonexistent layer"
        );
    }
  }

  // Remove the object on the given layer with the given ID
  removeObject(layer, id) {
    switch (layer) {
      case "backgroundImage":
        delete this.backgroundImages[id];
        break;
      case "background":
        delete this.backgroundObjects[id];
        break;
      case "game":
        delete this.gameObjects[id];
        break;
      case "effect":
        delete this.effectObjects[id];
        break;
      case "ui":
        delete this.uiObjects[id];
        break;
    }
  }
}
