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

  if (pickResult.hit && pickResult.pickedMesh.name.startsWith("piece")) {
    const [player, index] = pickResult.pickedMesh.name.split("_").slice(1);
    if (player === gameState.current_player) {
      highlightValidMoves(pickResult.pickedMesh, gameState, scene, makeMove);
    }
  } else {
    const highlightedMesh = scene.getMeshByName("moveHighlight");
    if (highlightedMesh) {
      const move = gameState.moves.find((m) =>
        getPositionFromIndex(m.to).equals(highlightedMesh.position)
      );
      if (move) {
        makeMove(move.from, move.to);
      }
    }
    clearHighlights(scene);
  }
};

const highlightValidMoves = (piece, gameState, scene, makeMove) => {
  clearHighlights(scene);
  const validMoves = gameState.moves.filter(
    (move) => move.from === getPositionIndex(piece.position)
  );
  validMoves.forEach((move) => {
    const highlight = BABYLON.MeshBuilder.CreateGround(
      "moveHighlight",
      { width: 1, height: 1 },
      scene
    );
    highlight.position = getPositionFromIndex(move.to);
    highlight.position.y += 0.01;
    highlight.material = new BABYLON.StandardMaterial("highlightMat", scene);
    highlight.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
    highlight.material.alpha = 0.5;
    highlight.isPickable = true;

    highlight.actionManager = new BABYLON.ActionManager(scene);
    highlight.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
        makeMove(move.from, move.to);
        clearHighlights(scene);
      })
    );
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
