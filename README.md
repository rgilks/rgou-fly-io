# Royal Game of Ur

## Overview

This project implements the Royal Game of Ur, an ancient board game originating from Mesopotamia. It features both a command-line interface and a WebSocket-based online multiplayer version.

## Features

- Command-line interface for local play
- WebSocket server for online multiplayer
- AI opponent with configurable difficulty
- Simulation mode for AI vs AI games
- Web-based client for easy access

## Getting Started

### Prerequisites

- Zig (version 0.13.0 or later)
- A web browser for the online version

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/rgou.git
   cd rgou
   ```

2. Build the project:
   ```
   zig build
   ```

### Running the Game

- To play the local command-line version:
  ```
  zig build run
  ```

- To start the WebSocket server:
  ```
  zig build run -- server
  ```

- To run a simulation:
  ```
  zig build run -- sim
  ```

## Game Rules

The Royal Game of Ur is played on a board with 20 squares arranged in three rows. Each player has 7 pieces that they must move across the board and off the other side to win. Key rules include:

- Players roll four binary dice to determine their move (0-4 spaces)
- Landing on a rosette grants an extra turn
- Players can capture opponent pieces by landing on them
- The middle rosette is a safe space where pieces cannot be captured
- First player to move all 7 pieces off the board wins

For a complete set of rules, please refer to the `docs/rules.md` file.

## Project Structure

- `src/`: Source code for the game logic, AI, and server
- `public/`: Web client files
- `docs/`: Additional documentation
- `scripts/`: Utility scripts

## Development

### Running Tests

```
zig build test
```

### Simulation Mode

The simulation mode allows you to run multiple games between AI players with different configurations. Use the `sim` command-line argument to access this mode.

### AI Implementation

The AI uses a minimax algorithm with alpha-beta pruning. The search depth can be configured to adjust the difficulty level.

## Deployment

The project includes a `fly.toml` file for easy deployment to Fly.io. Make sure you have the Fly CLI installed, then run:

```
fly deploy
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- The British Museum for their research on the original game
- The Zig community for their excellent programming language and tools
