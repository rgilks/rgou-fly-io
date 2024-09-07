import { getPositionIndex, getPositionFromIndex } from "utils";

const BOARD_SIZE = 24;

export const initGame = async (socket) => {
  try {
    await socket.send(JSON.stringify({ type: "new_game" }));
  } catch (error) {
    console.error("Error starting new game:", error);
    throw error;
  }
};

export const handlePieceClick = (pickResult, gameState, scene) => {
  if (pickResult.hit && pickResult.pickedMesh.name.startsWith("piece")) {
    const [player, index] = pickResult.pickedMesh.name.split("_").slice(1);
    if (player === gameState.current_player) {
      highlightValidMoves(pickResult.pickedMesh, gameState, scene);
    }
  } else {
    const selectedPiece = scene.meshes.find(
      (mesh) => mesh.name.startsWith("piece") && mesh.isSelected
    );
    if (selectedPiece) {
      const targetPosition = pickResult.pickedPoint;
      const move = validateMove(selectedPiece, targetPosition, gameState);
      if (move) {
        makeMove(move.from, move.to, gameState.socket);
      }
      clearHighlights(scene);
      selectedPiece.isSelected = false;
    }
  }
};

const highlightValidMoves = (piece, gameState, scene) => {
  clearHighlights(scene);
  piece.isSelected = true;
  const validMoves = getValidMoves(piece, gameState);
  validMoves.forEach((move) => {
    const highlight = BABYLON.MeshBuilder.CreateGround(
      "highlight",
      { width: 1, height: 1 },
      scene
    );
    highlight.position = move.position;
    highlight.position.y += 0.01;
    highlight.material = new BABYLON.StandardMaterial("highlightMat", scene);
    highlight.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
    highlight.material.alpha = 0.5;
  });
};

const clearHighlights = (scene) => {
  scene.meshes.forEach((mesh) => {
    if (mesh.name === "highlight") {
      mesh.dispose();
    }
  });
};

const getValidMoves = (piece, gameState) => {
  const [player, index] = piece.name.split("_").slice(1);
  const currentPosition = getPositionIndex(piece.position);
  const roll = gameState.dice_roll;

  const moves = [];
  if (currentPosition === -1) {
    // Piece is off-board
    const entryPoint = player === "A" ? 3 : 19;
    if (roll > 0) {
      moves.push({
        from: -1,
        to: entryPoint,
        position: getPositionFromIndex(entryPoint),
      });
    }
  } else {
    const newPosition = currentPosition + roll;
    if (newPosition < BOARD_SIZE) {
      moves.push({
        from: currentPosition,
        to: newPosition,
        position: getPositionFromIndex(newPosition),
      });
    }
  }

  return moves;
};

const validateMove = (piece, targetPosition, gameState) => {
  const validMoves = getValidMoves(piece, gameState);
  const targetIndex = getPositionIndex(targetPosition);
  return validMoves.find((move) => move.to === targetIndex);
};

const makeMove = async (from, to, socket) => {
  try {
    await socket.send(JSON.stringify({ type: "make_move", from, to }));
  } catch (error) {
    console.error("Error making move:", error);
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
