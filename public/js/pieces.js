const PIECES_PER_PLAYER = 7;
const BOARD_SIZE = 24;

export const createPieces = (scene) => {
  const pieces = {};
  const createPiece = (player, index) => {
    const piece = BABYLON.MeshBuilder.CreateCylinder(
      `piece_${player}_${index}`,
      { height: 0.2, diameter: 0.8 },
      scene
    );
    piece.material = new BABYLON.StandardMaterial(`pieceMat_${player}`, scene);
    piece.material.diffuseColor =
      player === "A"
        ? new BABYLON.Color3(0.7, 0, 0)
        : new BABYLON.Color3(0, 0, 0.7);
    piece.isPickable = true;
    return piece;
  };

  for (let i = 0; i < PIECES_PER_PLAYER; i++) {
    pieces[`A_${i}`] = createPiece("A", i);
    pieces[`B_${i}`] = createPiece("B", i);
  }

  return pieces;
};

export const positionPieces = (state, scene) => {
  const pieces = scene.meshes.filter((mesh) => mesh.name.startsWith("piece"));
  const boardPositions = new Array(BOARD_SIZE).fill(null);
  let offBoardA = PIECES_PER_PLAYER;
  let offBoardB = PIECES_PER_PLAYER;

  for (let i = 0; i < BOARD_SIZE; i++) {
    const position = (state >> (16 + i * 2)) & 3;
    if (position === 1) {
      boardPositions[i] = `A_${PIECES_PER_PLAYER - offBoardA}`;
      offBoardA--;
    } else if (position === 2) {
      boardPositions[i] = `B_${PIECES_PER_PLAYER - offBoardB}`;
      offBoardB--;
    }
  }

  pieces.forEach((piece) => {
    const [player, index] = piece.name.split("_").slice(1);
    const boardIndex = boardPositions.indexOf(piece.name);
    if (boardIndex !== -1) {
      piece.position = getPositionFromIndex(boardIndex);
    } else {
      // Position off-board pieces
      const offBoardIndex = player === "A" ? offBoardA : offBoardB;
      piece.position = new BABYLON.Vector3(
        player === "A" ? -5 : 5,
        0.2,
        offBoardIndex * 0.5 - 1
      );
      if (player === "A") offBoardA++;
      else offBoardB++;
    }
  });
};

const getPositionFromIndex = (index) => {
  const row = Math.floor(index / 8);
  const col = index % 8;
  return new BABYLON.Vector3(col - 3.5, 0.2, row - 1);
};
