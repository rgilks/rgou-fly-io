import { getPositionIndex, getPositionFromIndex } from "./utils.js";

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

  console.log("handlePieceClick", pickResult);

  if (pickResult.hit && pickResult.pickedMesh.name.startsWith("piece")) {
    const [player, index] = pickResult.pickedMesh.name.split("_").slice(1);
    if (player === gameState.current_player) {
      highlightValidMoves(pickResult.pickedMesh, gameState, scene, makeMove);
    }
  } else if (pickResult.hit && pickResult.pickedMesh.name === "moveHighlight") {
    const move = gameState.moves.find((m) =>
      getPositionFromIndex(m.to).equals(pickResult.pickedMesh.position)
    );
    if (move) {
      makeMove(move.from, move.to);
      clearHighlights(scene);
    }
  } else {
    clearHighlights(scene);
  }
};

const highlightValidMoves = (piece, gameState, scene, makeMove) => {
  clearHighlights(scene);
  console.log("Highlighting valid moves for", piece.name);
  const validMoves = gameState.moves.filter(
    (move) => move.from === getPositionIndex(piece.position)
  );

  console.log("Valid moves:", validMoves);
  
  validMoves.forEach((move) => {
    const highlight = BABYLON.MeshBuilder.CreateCylinder(
      "moveHighlight",
      { height: 0.1, diameter: 0.8 },
      scene
    );
    highlight.position = getPositionFromIndex(move.to);
    highlight.position.y += 0.05;
    highlight.material = new BABYLON.StandardMaterial("highlightMat", scene);
    highlight.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
    highlight.material.alpha = 0.6;
    highlight.isPickable = true;
  });

  // Highlight the selected piece
  piece.material.emissiveColor = new BABYLON.Color3(1, 1, 0);
};

const clearHighlights = (scene) => {
  if (!scene || !scene.meshes) {
    console.error("Scene or scene.meshes is undefined in clearHighlights");
    return;
  }
  scene.meshes.forEach((mesh) => {
    if (mesh.name === "moveHighlight") {
      mesh.dispose();
    }
    if (mesh.name.startsWith("piece")) {
      mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
    }
  });
};

export const rollDice = async (socket) => {
  try {
    await socket.send(JSON.stringify({ type: "roll_dice" }));
  } catch (error) {
    console.error("Error rolling dice:", error);
    throw error;
  }
};
