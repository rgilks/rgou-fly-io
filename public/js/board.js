// 
export const createScene = (engine, canvas) => {
  const scene = new BABYLON.Scene(engine);
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 2.5,
    15,
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);
  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  createBoard(scene);

  return scene;
};

const createBoard = (scene) => {
  const boardMaterial = new BABYLON.StandardMaterial("boardMat", scene);
  boardMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.5); // Light tan color

  const boardWidth = 8;
  const boardHeight = 3;
  const squareSize = 1;

  // Create the main board shape
  const shape = [
    new BABYLON.Vector3(0, 0, 0),
    new BABYLON.Vector3(boardWidth * squareSize, 0, 0),
    new BABYLON.Vector3(boardWidth * squareSize, 0, boardHeight * squareSize),
    new BABYLON.Vector3(0, 0, boardHeight * squareSize),
  ];

  // Cut out the gaps
  const hole1 = [
    new BABYLON.Vector3(4 * squareSize, 0, 0),
    new BABYLON.Vector3(6 * squareSize, 0, 0),
    new BABYLON.Vector3(6 * squareSize, 0, squareSize),
    new BABYLON.Vector3(4 * squareSize, 0, squareSize),
  ];
  const hole2 = [
    new BABYLON.Vector3(4 * squareSize, 0, 2 * squareSize),
    new BABYLON.Vector3(6 * squareSize, 0, 2 * squareSize),
    new BABYLON.Vector3(6 * squareSize, 0, 3 * squareSize),
    new BABYLON.Vector3(4 * squareSize, 0, 3 * squareSize),
  ];

  const board = BABYLON.MeshBuilder.CreatePolygon(
    "board",
    { shape: shape, holes: [hole1, hole2], depth: 0.2 },
    scene
  );
  board.material = boardMaterial;
  board.position.y = -0.1;

  createSquares(scene);
  createBorder(scene, boardWidth, boardHeight, squareSize);
};

const createSquares = (scene) => {
  const squarePositions = [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [6, 0],
    [7, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 1],
    [7, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
    [6, 2],
    [7, 2],
  ];

  const rosettePositions = [
    [0, 0],
    [3, 0],
    [0, 2],
    [3, 2],
    [4, 1],
  ];

  squarePositions.forEach(([x, z], index) => {
    const square = BABYLON.MeshBuilder.CreateBox(
      `square_${index}`,
      { width: 1, height: 0.1, depth: 1 },
      scene
    );
    square.position.set(x - 3.5, 0.05, z - 1);

    const squareMaterial = new BABYLON.StandardMaterial(
      `squareMat_${index}`,
      scene
    );
    if (rosettePositions.some((pos) => pos[0] === x && pos[1] === z)) {
      squareMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1); // Red color for rosettes
    } else {
      squareMaterial.diffuseColor =
        index % 2 === 0
          ? new BABYLON.Color3(0.9, 0.9, 0.9) // Light color
          : new BABYLON.Color3(0.2, 0.2, 0.7); // Dark blue color
    }
    square.material = squareMaterial;
  });
};

const createBorder = (scene, boardWidth, boardHeight, squareSize) => {
  const border = BABYLON.MeshBuilder.CreateBox(
    "border",
    {
      width: boardWidth * squareSize + 0.2,
      height: 0.1,
      depth: boardHeight * squareSize + 0.2,
    },
    scene
  );
  border.position.y = -0.15;
  const borderMaterial = new BABYLON.StandardMaterial("borderMat", scene);
  borderMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Dark color for border
  border.material = borderMaterial;
};
