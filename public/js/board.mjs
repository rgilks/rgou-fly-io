export const createScene = async (engine, canvas) => {
  const scene = new BABYLON.Scene(engine);
  
  // Create a camera, but don't attach control yet
  const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 8, 10, new BABYLON.Vector3(0, 0, 0), scene);
  
  const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

  createBoard(scene);

  const xr = await scene.createDefaultXRExperienceAsync({
    floorMeshes: [scene.getMeshByName("boardBase")],  // Assuming you have a base mesh for the board
  });

  if (xr.baseExperience) {
    // VR is supported
    xr.baseExperience.camera.position.y = 1.6;  // Set initial camera height
    
    // Create a button for entering VR
    const vrButton = document.createElement("button");
    vrButton.textContent = "Enter VR";
    vrButton.style.position = "absolute";
    vrButton.style.bottom = "10px";
    vrButton.style.left = "50%";
    vrButton.style.transform = "translateX(-50%)";
    vrButton.style.padding = "10px";
    vrButton.style.fontSize = "16px";
    document.body.appendChild(vrButton);

    vrButton.addEventListener("click", () => {
      xr.baseExperience.enterXRAsync("immersive-vr", "local-floor");
    });
  } else {
    // VR not supported, use default camera controls
    camera.attachControl(canvas, true);
  }

  return scene;
};

export const createBoard = (scene) => {
  // Create a base for the board
  const boardBase = BABYLON.MeshBuilder.CreateBox("boardBase", {width: 8, height: 0.1, depth: 3}, scene);
  boardBase.position.y = -0.05;  // Slightly below the squares
  
  const baseMaterial = new BABYLON.StandardMaterial("baseMaterial", scene);
  baseMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);  // Brown color
  boardBase.material = baseMaterial;

  createSquares(scene);
};

export const createSquares = (scene) => {
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
    [7, 0],
    [3, 1],
    [0, 2],
    [7, 2],
  ];

  squarePositions.forEach(([x, z], index) => {
    const square = BABYLON.MeshBuilder.CreateBox(
      `square_${index}`,
      { width: 0.98, height: 0.5, depth: 0.98 },
      scene
    );
    square.index = index;
    square.position.set(x - 3.5, 0.2, z - 1);

    const squareMaterial = new BABYLON.StandardMaterial(
      `squareMat_${index}`,
      scene
    );
    if (rosettePositions.some((pos) => pos[0] === x && pos[1] === z)) {
      squareMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1); // Red color for rosettes
    }
    square.material = squareMaterial;
  });
};
