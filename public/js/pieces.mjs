import { getPositionFromIndex } from "./utils.mjs";

const PIECES_PER_PLAYER = 7;
const BOARD_SIZE = 24;

export const createPieces = (scene) => {
  const pieces = {};
  for (let player of ["A", "B"]) {
    for (let i = 0; i < PIECES_PER_PLAYER; i++) {
      const piece = BABYLON.MeshBuilder.CreateCylinder(
        `piece_${player}_${i}`,
        { height: 0.7, diameter: 0.8 },
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
    let position = boardState.slice(i * 2, i * 2 + 2);
    formattedBoardState.push(position);
  }

  return formattedBoardState.reverse();
};

export const positionPieces = (state, scene) => {
  const offBoardA = Number(state & 0b111n);
  const offBoardB = Number((state >> 3n) & 0b111n);
  const completedA = Number((state >> 6n) & 0b111n);
  const completedB = Number((state >> 9n) & 0b111n);

  console.log(`Off-board A: ${offBoardA}, B: ${offBoardB}`);
  console.log(`Completed A: ${completedA}, B: ${completedB}`);

  // Position off-board pieces
  positionOffBoardPieces(scene, "A", offBoardA);
  positionOffBoardPieces(scene, "B", offBoardB);

  // Position completed pieces
  positionCompletedPieces(scene, "A", completedA);
  positionCompletedPieces(scene, "B", completedB);

  const piecePositions = getPiecePositions(state);

  let aOnBoard = 0;
  let bOnBoard = 0;
  for (let i = 0; i < BOARD_SIZE; i++) {
    if (isExcluded(i) && i !== 4 && i !== 20) continue; // Allow positions 4 and 20 (exit squares)

    const position = piecePositions[i];

    if (position === "01") {
      // Player A
      const piece = scene.getMeshByName(`piece_A_${aOnBoard + offBoardA}`);
      if (piece) {
        piece.position = getPositionFromIndex(i);
        piece.position.y = 0.25; // Half height of the piece
        piece.visibility = 1;
      }
      aOnBoard++;
    } else if (position === "10") {
      // Player B
      const piece = scene.getMeshByName(`piece_B_${bOnBoard + offBoardB}`);
      if (piece) {
        piece.position = getPositionFromIndex(i);
        piece.position.y = 0.25; // Half height of the piece
        piece.visibility = 1;
      }
      bOnBoard++;
    }
  }

  console.log(`Pieces on board - A: ${aOnBoard}, B: ${bOnBoard}`);
};

const positionOffBoardPieces = (scene, player, count) => {
  const xPosition = player === "A" ? -5 : 5;
  for (let i = 0; i < PIECES_PER_PLAYER; i++) {
    const piece = scene.getMeshByName(`piece_${player}_${i}`);
    if (piece) {
      if (i < count) {
        piece.position = new BABYLON.Vector3(xPosition, 0.25, i * 0.9 - 2.5);
        piece.visibility = 1;
      } else {
        // Move pieces that are not off-board out of view
        piece.position = new BABYLON.Vector3(xPosition, -5, 0);
        piece.visibility = 1;
      }
    }
  }
};

const positionCompletedPieces = (scene, player, count) => {
  const xPosition = player === "A" ? -6 : 6;
  for (let i = 0; i < PIECES_PER_PLAYER; i++) {
    const piece = scene.getMeshByName(
      `piece_${player}_${i + PIECES_PER_PLAYER - count}`
    );
    if (piece) {
      if (i < count) {
        piece.position = new BABYLON.Vector3(xPosition, 0.25, i * 0.9 - 2.5);
        piece.visibility = 1;
      } else {
        // Move pieces that are not completed out of view
        piece.position = new BABYLON.Vector3(xPosition, -5, 0);
        piece.visibility = 1;
      }
    }
  }
};

const isExcluded = (position) => {
  return position === 5 || position === 21; // Only exclude positions 5 and 21
};

export const highlightValidMoves = (scene, gameState) => {
  clearHighlights(scene);
  gameState.moves.forEach((move) => {
    let highlight;
    if (move.to === BOARD_SIZE) {
      // Highlight the exit square
      const exitPosition = gameState.current_player === "A" ? 5 : 21;
      highlight = BABYLON.MeshBuilder.CreateCylinder(
        "moveHighlight",
        { height: 0.7, diameter: 0.5 },
        scene
      );
      highlight.position = getPositionFromIndex(exitPosition);
    } else {
      highlight = BABYLON.MeshBuilder.CreateCylinder(
        "moveHighlight",
        { height: 0.7, diameter: 0.63 },
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
  scene.meshes
    .filter((mesh) => mesh.name === "moveHighlight")
    .forEach((mesh) => {
      if (mesh.dispose && typeof mesh.dispose === "function") {
        mesh.dispose();
      }
    });
};
