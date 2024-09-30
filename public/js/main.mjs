import { setupWebSocket } from "./websocket.mjs";
import { initGame, handlePieceClick, rollDice } from "./game.mjs";
import { createScene } from "./board.mjs";
import {
  createPieces,
  positionPieces,
  highlightValidMoves,
  clearHighlights,
} from "./pieces.mjs";
import { printStateBinary } from "./utils.mjs";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const gameInfoDiv = document.getElementById("gameInfo");
const diceRollDiv = document.getElementById("diceRoll");
const restartButton = document.getElementById("restartButton");

let scene;
let gameState = null;
let socket;

const updateGameState = (newState) => {
  gameState = newState;
  saveGameState(newState);
  printStateBinary(gameState.state);
  positionPieces(gameState.state, scene);

  let infoText = `Current player: ${gameState.current_player}`;
  if (gameState.current_player === "A") {
    infoText += " (You)";
  } else {
    infoText += " (AI)";
  }
  gameInfoDiv.textContent = infoText;

  diceRollDiv.textContent = `Dice roll: ${gameState.dice_roll}`;

  if (gameState.game_over) {
    gameInfoDiv.textContent += " - Game Over!";
  } else if (gameState.current_player === "A") {
    if (gameState.dice_roll === 0) {
      // Automatically roll the dice
      rollDice(socket);
      gameInfoDiv.textContent += " - Rolling the dice...";
      clearHighlights(scene);
    } else {
      if (gameState.moves.length > 0) {
        gameInfoDiv.textContent += " - Make a move";
        highlightValidMoves(scene, gameState);
      } else {
        gameInfoDiv.textContent += " - No moves available, turn passes";
        setTimeout(() => {
          socket.send(JSON.stringify({ type: "end_turn" }));
        }, 2000);
      }
    }
  } else {
    gameInfoDiv.textContent += " - AI is thinking...";
    clearHighlights(scene);
  }
};

const makeMove = async (from, to) => {
  try {
    await socket.send(JSON.stringify({ type: "make_move", from, to }));
  } catch (error) {
    console.error("Error making move:", error);
  }
};

const saveGameState = (state) => {
  localStorage.setItem("gameState", JSON.stringify(state));
};

const loadGameState = () => {
  const savedState = localStorage.getItem("gameState");
  return savedState ? JSON.parse(savedState) : null;
};

const saveCameraPosition = (scene) => {
  const camera = scene.activeCamera;
  const cameraPosition = {
    alpha: camera.alpha,
    beta: camera.beta,
    radius: camera.radius,
    target: {
      x: camera.target.x,
      y: camera.target.y,
      z: camera.target.z,
    },
  };
  localStorage.setItem("cameraPosition", JSON.stringify(cameraPosition));
};

const loadCameraPosition = (scene) => {
  const savedPosition = localStorage.getItem("cameraPosition");
  if (savedPosition) {
    const cameraPosition = JSON.parse(savedPosition);
    const camera = scene.activeCamera;
    camera.alpha = cameraPosition.alpha;
    camera.beta = cameraPosition.beta;
    camera.radius = cameraPosition.radius;
    camera.target = new BABYLON.Vector3(
      cameraPosition.target.x,
      cameraPosition.target.y,
      cameraPosition.target.z
    );
  }
};

const restartGame = async () => {
  localStorage.removeItem("gameState");
  await initGame(socket);
};

const main = async () => {
  scene = createScene(engine, canvas);
  createPieces(scene);

  // Load camera position after creating the scene
  loadCameraPosition(scene);

  scene.onPointerDown = (evt, pickResult) => {
    if (
      gameState &&
      gameState.current_player === "A" &&
      gameState.dice_roll > 0
    ) {
      handlePieceClick(pickResult, gameState, scene, makeMove);
    }
  };

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });

  // Save camera position before the page unloads
  window.addEventListener("beforeunload", () => {
    saveCameraPosition(scene);
  });

  restartButton.addEventListener("click", restartGame);

  try {
    socket = await setupWebSocket(updateGameState);
    const savedState = loadGameState();
    if (savedState) {
      await socket.send(
        JSON.stringify({ type: "restore_game", state: savedState })
      );
    } else {
      await initGame(socket);
    }
  } catch (error) {
    console.error("Failed to setup WebSocket or initialize game:", error);
  }
};

main();
