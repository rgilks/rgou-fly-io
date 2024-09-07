import { getPositionIndex, getPositionFromIndex } from "./utils.js";
import { clearHighlights } from "./pieces.js";

export const initGame = async (socket) => {
  try {
    await socket.send(JSON.stringify({ type: "new_game" }));
  } catch (error) {
    console.error("Error starting new game:", error);
    throw error;
  }
};

export const handlePieceClick = (pickResult, gameState, scene, makeMove) => {
  if (!scene) {
    console.error("Scene is undefined in handlePieceClick");
    return;
  }

  if (pickResult.hit && pickResult.pickedMesh.name === "moveHighlight") {
    const move = pickResult.pickedMesh.move;
    if (move) {
      makeMove(move.from, move.to);
      clearHighlights(scene);
    }
  }
};

export const rollDice = async (socket) => {
  try {
    await socket.send(JSON.stringify({ type: "roll_dice" }));
  } catch (error) {
    console.error("Error rolling dice:", error);
    throw error;
  }
};
