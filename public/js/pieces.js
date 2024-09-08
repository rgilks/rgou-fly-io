import { getPositionFromIndex } from "./utils.js";

const PIECES_PER_PLAYER = 7;
const BOARD_SIZE = 24;

export const createPieces = (scene) => {
  const pieces = {};
  for (let player of ["A", "B"]) {
    for (let i = 0; i < PIECES_PER_PLAYER; i++) {
      const piece = BABYLON.MeshBuilder.CreateCylinder(
        `piece_${player}_${i}`,
        { height: 0.5, diameter: 0.8 },
        scene
      );
      piece.material = new BABYLON.StandardMaterial(
        `pieceMat_${player}`,
        scene
      );
      piece.material.diffuseColor =
        player === "A"
          ? new BABYLON.Color3(0.7, 0, 0) // Red for player A
          : new BABYLON.Color3(0, 0, 0.7); // Blue for player B
      piece.isPickable = true;
      pieces[`${player}_${i}`] = piece;
    }
  }
  return pieces;
};

export const getPiecePositions = (state) => {
  let binString = state.toString(2).padStart(64, "0");
  let boardState = binString.slice(0, 48);
  let formattedBoardState = [];

  for (let i = 0; i < 24; i++) {
    formattedBoardState.push(boardState.slice(i * 2, i * 2 + 2));
  }

  return formattedBoardState.reverse();
};

export const positionPieces = (state, scene) => {
  const offBoardA = state & 0b111;
  const offBoardB = (state >> 3) & 0b111;
  const completedA = (state >> 6) & 0b111;
  const completedB = (state >> 9) & 0b111;

  console.log("Off board A:", offBoardA, "Off board B:", offBoardB);
  console.log("Completed A:", completedA, "Completed B:", completedB);

  positionOffBoardPieces(scene, "A", offBoardA);
  positionOffBoardPieces(scene, "B", offBoardB);

  const piecePositions = getPiecePositions(state);

  let aOnBoard = 0;
  let bOnBoard = 0;
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (isExcluded(i) && i !== 4 && i !== 20) continue; // Allow positions 4 and 20 (exit squares)

    const position = piecePositions[i];

    if (position === "01") {
      // Player A
      const piece = scene.getMeshByName(`piece_A_${aOnBoard}`);
      if (piece) {
        piece.position = getPositionFromIndex(i);
        piece.position.y = 0.25; // Half height of the piece
        piece.visibility = 1;
      }
      aOnBoard++;
    } else if (position === "10") {
      // Player B
      const piece = scene.getMeshByName(`piece_B_${bOnBoard}`);
      if (piece) {
        piece.position = getPositionFromIndex(i);
        piece.position.y = 0.25; // Half height of the piece
        piece.visibility = 1;
      }
      bOnBoard++;
    }
  }
};

const positionOffBoardPieces = (scene, player, count) => {
  const xPosition = player === "A" ? -5 : 5;
  for (let i = 0; i < PIECES_PER_PLAYER; i++) {
    const piece = scene.getMeshByName(`piece_${player}_${i}`);
    if (piece) {
        piece.position = new BABYLON.Vector3(xPosition, 0.25, i * 0.9 - 2.5);
    }
  }
}

const isExcluded = (position) => {
  return position === 5 || position === 21; // Only exclude positions 5 and 21
}

export const highlightValidMoves = (scene, gameState) => {
  clearHighlights(scene);
  gameState.moves.forEach((move) => {
    let highlight;
    if (move.to === BOARD_SIZE) {
      // Highlight the exit square
      const exitPosition = gameState.current_player === "A" ? 5 : 21;
      highlight = BABYLON.MeshBuilder.CreateCylinder(
        "moveHighlight",
        { height: 0.7, diameter: 0.4 },
        scene
      );
      highlight.position = getPositionFromIndex(exitPosition);
    } else {
      highlight = BABYLON.MeshBuilder.CreateCylinder(
        "moveHighlight",
        { height: 0.7, diameter: 0.4 },
        scene
      );
      highlight.position = getPositionFromIndex(move.to);
    }
    
    highlight.position.y = 0.3; // Slightly above the board
    highlight.material = new BABYLON.StandardMaterial("highlightMat", scene);
    highlight.material.diffuseColor = new BABYLON.Color3(0, 1, 0);
    highlight.material.alpha = 0.6;
    highlight.isPickable = true;
    highlight.move = move;
  });
};

export const clearHighlights = (scene) => {
  scene.meshes.forEach((mesh) => {
    if (mesh.name === "moveHighlight") {
      mesh.dispose();
    }
  });
};
