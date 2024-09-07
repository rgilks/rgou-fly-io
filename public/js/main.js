import { setupWebSocket } from "./websocket.js";
import { initGame, handlePieceClick, rollDice } from "./game.js";
import { createScene } from "./board.js";
import {
  createPieces,
  positionPieces,
  highlightValidMoves,
  clearHighlights,
} from "./pieces.js";
import { animateDiceRoll, printStateBinary } from "./utils.js";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const gameInfoDiv = document.getElementById("gameInfo");
const diceRollDiv = document.getElementById("diceRoll");
const rollDiceBtn = document.getElementById("rollDiceBtn");

let scene;
let gameState = null;
let socket;

const updateGameState = (newState) => {
  gameState = newState;
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
    rollDiceBtn.disabled = true;
  } else if (gameState.current_player === "A") {
    if (gameState.dice_roll === 0) {
      rollDiceBtn.disabled = false;
      gameInfoDiv.textContent += " - Roll the dice!";
      clearHighlights(scene);
    } else {
      rollDiceBtn.disabled = true;
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
    rollDiceBtn.disabled = true;
    gameInfoDiv.textContent += " - AI is thinking...";
    clearHighlights(scene);
    // Trigger AI move
    setTimeout(() => {
      socket.send(JSON.stringify({ type: "ai_move" }));
    }, 1000);
  }
};

const makeMove = async (from, to) => {
  try {
    await socket.send(JSON.stringify({ type: "make_move", from, to }));
  } catch (error) {
    console.error("Error making move:", error);
  }
};

const main = async () => {
  scene = createScene(engine, canvas);
  createPieces(scene);

  scene.onPointerDown = (evt, pickResult) => {
    if (
      gameState &&
      gameState.current_player === "A" &&
      gameState.dice_roll > 0
    ) {
      handlePieceClick(pickResult, gameState, scene, makeMove);
    }
  };

  rollDiceBtn.addEventListener("click", async () => {
    if (
      gameState &&
      gameState.current_player === "A" &&
      gameState.dice_roll === 0
    ) {
      rollDiceBtn.disabled = true;
      await rollDice(socket);
    }
  });

  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.resize();
  });

  try {
    socket = await setupWebSocket(updateGameState);
    await initGame(socket);
  } catch (error) {
    console.error("Failed to setup WebSocket or initialize game:", error);
  }
};

main();
