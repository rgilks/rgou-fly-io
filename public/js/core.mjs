import { createGame } from "./main.mjs";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const gameInfoDiv = document.getElementById("gameInfo");
const diceRollDiv = document.getElementById("diceRoll");
const restartButton = document.getElementById("restartButton");

const game = createGame({
  canvas,
  engine,
  gameInfoDiv,
  diceRollDiv,
  restartButton,
  localStorage,
});

game.initialize();

window.addEventListener("resize", () => {
  engine.resize();
});

window.addEventListener("beforeunload", () => {
  game.saveCameraPosition(game.scene);
});
