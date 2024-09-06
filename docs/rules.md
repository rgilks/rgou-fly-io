# Game Rules: The Royal Game of Ur

## Introduction

The Royal Game of Ur is an ancient board game that originated in Mesopotamia over 4,500 years ago. This document outlines the rules as implemented in this software.

## The Board

The game is played on a board with 20 squares arranged in three rows:

```
      1 2 3 4 5 6 7 8
  ┌──────────────────┐
  │A  ✧ · · ·     ✧ ·│
  │B  · · · ✧ · · · ·│
  │C  ✧ · · ·     ✧ ·│
  └──────────────────┘
```

- The ✧ symbols represent "rosette" squares, which grant special privileges.
- Each player has their own path through the board, sharing the middle row.
- The path for each player is:
  - Player A: A4 → A1 → B1 → B8 → A8 → A7
  - Player B: C4 → C1 → B1 → B8 → C8 → C7

## Setup

- Each player starts with 7 pieces off the board.
- Players decide randomly who goes first.

## Gameplay

1. **Rolling the Dice**: 
   - Players roll four special dice to determine their move. 
   - In our digital version, this is simulated to give a result of 0-4.
   - The dice are binary: each die has a 50% chance of counting as 1, and 50% chance of counting as 0.

2. **Moving Pieces**: 
   - Players can either bring a new piece onto the board or move an existing piece.
   - Pieces always move in the direction specified by the player's path.
   - A player must move if they have a legal move available.
   - If no move is possible, the turn passes to the other player.

3. **Special Rules**:
   - If a player lands on a rosette, they get an extra turn.
   - If a player lands on a square occupied by an opponent's piece, the opponent's piece is captured and must start over.
   - Players cannot land on squares occupied by their own pieces.
   - The middle rosette (B4) is safe - players cannot capture pieces on this square.

4. **Leaving the Board**: 
   - Pieces must leave the board on an exact roll.
   - When a piece leaves the board, it's out of play for the rest of the game.

## Winning the Game

The first player to move all seven of their pieces off the board wins the game.

## Strategy Tips

1. **Rosette Control**: Try to land on rosettes whenever possible. They provide an extra turn, which can be crucial.

2. **Blocking**: Use your pieces to block your opponent's pieces, especially near the end of their path.

3. **Safe Zones**: The middle rosette (B4) is a safe spot. Use it strategically to protect your pieces.

4. **Timing**: Sometimes it's better not to move a piece if it would put it in danger of being captured.

5. **End Game Management**: Towards the end of the game, carefully manage your dice rolls to move pieces off the board efficiently.

6. **Balance**: Try to maintain a balance between moving pieces onto the board and advancing pieces already on the board.

7. **Capture Opportunities**: Look for opportunities to capture your opponent's pieces, especially if they're far along the path.

8. **Path Awareness**: Always be aware of where your opponent's pieces are in relation to their path off the board.

## Differences from Historical Version

While our implementation aims to be faithful to the ancient game, there may be some differences due to uncertainties in historical records:

1. The exact rules for dice rolling in the original game are not known with certainty.
2. Some variations of the historical game may have had different rules for safe squares or capturing.
3. The scoring system and win conditions might have varied in different regions or time periods.

This version aims to provide a balanced and enjoyable game experience while staying as close as possible to what is known about the historical game.
