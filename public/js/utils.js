export const getPositionIndex = (position) => {
  const row = Math.round(position.z + 1);
  const col = Math.round(position.x + 3.5);
  return row * 8 + col;
};

export const getPositionFromIndex = (index) => {
  const row = Math.floor(index / 8);
  const col = index % 8;
  return new BABYLON.Vector3(col - 3.5, 0.2, row - 1);
};

export const animateDiceRoll = (roll, diceRollDiv) => {
  let frames = 20;
  let interval = setInterval(() => {
    if (frames > 0) {
      diceRollDiv.textContent = `Dice roll: ${Math.floor(Math.random() * 5)}`;
      frames--;
    } else {
      clearInterval(interval);
      diceRollDiv.textContent = `Dice roll: ${roll}`;
    }
  }, 50);
};

export const printStateBinary = (state) => {
  // Convert state to binary string, pad with leading zeros
  let binString = state.toString(2).padStart(64, "0");

  // Split the binary string into parts
  let parts = [
    binString.slice(0, 48), // Board state
    binString.slice(48, 51), // ROL (Dice roll)
    binString.slice(51, 52), // C (Current player)
    binString.slice(52, 55), // BC (Player B completed pieces)
    binString.slice(55, 58), // AC (Player A completed pieces)
    binString.slice(58, 61), // BOB (Player B off-board pieces)
    binString.slice(61, 64), // AOB (Player A off-board pieces)
  ];

  let boardState = parts[0];
  let formattedBoardState = [];
  
  for (let i = 0; i < 24; i++) {
    formattedBoardState.push(boardState.slice(i * 2, i * 2 + 2));
  }
  
  formattedBoardState = formattedBoardState.join(' ');

  // Combine all parts
  let result = `${formattedBoardState.trim()} ${parts[1]} ${parts[2]} ${
    parts[3]
  } ${parts[4]} ${parts[5]} ${parts[6]}`;

  // Add labels
  let labels =
    "23 22 xx xx 19 18 17 16 15 14 13 12 11 10  9  8  7  6 xx ET  3  2  1  0 ROL C BC  AC  BOB AOB";

  console.log(labels);
  console.log(result);
};
