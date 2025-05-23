import { setupWebSocket } from "./websocket.mjs";
import { initGame, handlePieceClick, rollDice } from "./game.mjs";
import { createScene } from "./board.mjs";
import {
  createPieces,
  positionPieces,
  highlightValidMoves,
  clearHighlights,
} from "./pieces.mjs";
import { printStateBinary } from "./utils.mjs";

export const createGame = (deps) => {
  const {
    canvas,
    engine,
    gameInfoDiv,
    diceRollDiv,
    restartButton,
    localStorage,
  } = deps;

  let scene;
  let gameState = null;
  let socket;

  const updateGameState = (newState) => {
    gameState = newState;
    saveGameState(newState);
    printStateBinary(gameState.state);
    positionPieces(gameState.state, scene);

    let infoText = `Current player: ${gameState.current_player}`;
    if (gameState.current_player === "A") {
      infoText += " (You)";
    } else {
      infoText += " (AI)";
    }
    gameInfoDiv.textContent = infoText;

    diceRollDiv.textContent = `Dice roll: ${gameState.dice_roll}`;

    if (gameState.game_over) {
      gameInfoDiv.textContent += " - Game Over!";
    } else if (gameState.current_player === "A") {
      if (gameState.dice_roll === 0) {
        rollDice(socket);
        gameInfoDiv.textContent += " - Rolling the dice...";
        clearHighlights(scene);
      } else {
        if (gameState.moves.length > 0) {
          gameInfoDiv.textContent += " - Make a move";
          highlightValidMoves(scene, gameState);
        } else {
          gameInfoDiv.textContent += " - No moves available, turn passes";
          setTimeout(() => {
            socket.send(JSON.stringify({ type: "end_turn" }));
          }, 2000);
        }
      }
    } else {
      gameInfoDiv.textContent += " - AI is thinking...";
      clearHighlights(scene);
    }
  };

  const makeMove = async (from, to) => {
    try {
      await socket.send(JSON.stringify({ type: "make_move", from, to }));
    } catch (error) {
      console.error("Error making move:", error);
    }
  };

  const saveGameState = (state) => {
    const serializedState = {
      ...state,
      state: state.state.toString(),
    };
    localStorage.setItem("gameState", JSON.stringify(serializedState));
  };

  const loadGameState = () => {
    const savedState = localStorage.getItem("gameState");
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      return {
        ...parsedState,
        state: parsedState.state,
      };
    }
    return null;
  };

  const saveCameraPosition = () => {
    const camera = scene.activeCamera;
    const cameraPosition = {
      alpha: camera.alpha,
      beta: camera.beta,
      radius: camera.radius,
      target: {
        x: camera.target.x,
        y: camera.target.y,
        z: camera.target.z,
      },
    };
    localStorage.setItem("cameraPosition", JSON.stringify(cameraPosition));
  };

  const loadCameraPosition = () => {
    const savedPosition = localStorage.getItem("cameraPosition");
    if (savedPosition) {
      const cameraPosition = JSON.parse(savedPosition);
      const camera = scene.activeCamera;
      camera.alpha = cameraPosition.alpha;
      camera.beta = cameraPosition.beta;
      camera.radius = cameraPosition.radius;
      camera.target = new BABYLON.Vector3(
        cameraPosition.target.x,
        cameraPosition.target.y,
        cameraPosition.target.z
      );
    }
  };

  const restartGame = async () => {
    localStorage.removeItem("gameState");
    await initGame(socket);
  };

  const initialize = async () => {
    scene = createScene(engine, canvas);
    createPieces(scene);
    loadCameraPosition();

    scene.onPointerDown = (evt, pickResult) => {
      if (
        gameState &&
        gameState.current_player === "A" &&
        gameState.dice_roll > 0
      ) {
        handlePieceClick(pickResult, gameState, scene, makeMove);
      }
    };

    engine.runRenderLoop(() => {
      scene.render();
    });

    restartButton.addEventListener("click", restartGame);

    try {
      socket = await setupWebSocket(updateGameState);
      const savedState = loadGameState();
      if (savedState) {
        await socket.send(
          JSON.stringify({ type: "restore_game", state: savedState })
        );
      } else {
        await initGame(socket);
      }
    } catch (error) {
      console.error("Failed to setup WebSocket or initialize game:", error);
    }
  };

  return {
    initialize,
    saveCameraPosition,
    setScene: (s) => {
      scene = s;
    },
  };
};
