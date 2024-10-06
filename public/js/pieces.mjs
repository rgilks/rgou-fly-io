import { getPositionFromIndex } from "./utils.mjs";

const PIECES_PER_PLAYER = 7;
const BOARD_SIZE = 24;

const createLODPiece = (scene, name, highPolyMesh, lowPolyMesh) => {
  if (BABYLON.MeshLODLevel && BABYLON.MeshLODLevel.AddLODLevel) {
    const lodMesh = BABYLON.Mesh.CreateBox(name, 1, scene);
    lodMesh.isVisible = false;

    const lodDistance = 5; // Adjust this value based on your scene scale

    BABYLON.MeshLODLevel.AddLODLevel(lodDistance, lowPolyMesh);
    BABYLON.MeshLODLevel.AddLODLevel(0, highPolyMesh);
    
    return lodMesh;
  } else {
    // Fallback to using just the high poly mesh if LOD is not available
    console.log("LOD not available, using high poly mesh only");
    return highPolyMesh;
  }
};

export const createPieces = (scene) => {
  const pieces = {};
  const piecePositions = [];

  // Create high and low poly meshes for LOD
  const highPolyPiece = BABYLON.MeshBuilder.CreateCylinder("highPolyPiece", { height: 0.7, diameter: 0.8, tessellation: 32 }, scene);
  const lowPolyPiece = BABYLON.MeshBuilder.CreateCylinder("lowPolyPiece", { height: 0.7, diameter: 0.8, tessellation: 8 }, scene);
  
  highPolyPiece.isVisible = false;
  lowPolyPiece.isVisible = false;

  for (let player of ["A", "B"]) {
    const material = new BABYLON.StandardMaterial(`pieceMat_${player}`, scene);
    material.diffuseColor = player === "A" ? new BABYLON.Color3(0.7, 0, 0) : new BABYLON.Color3(0, 0, 0.7);
    
    const piece = createLODPiece(scene, `piece_${player}`, highPolyPiece, lowPolyPiece);
    piece.material = material;

    for (let i = 0; i < PIECES_PER_PLAYER; i++) {
      const instance = piece.createInstance(`piece_${player}_${i}`);
      instance.position = new BABYLON.Vector3(-5 + (player === "B" ? 10 : 0), 0.25, i * 0.9 - 2.5);
      pieces[`${player}_${i}`] = instance;
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
