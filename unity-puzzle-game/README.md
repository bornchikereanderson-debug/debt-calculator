# Unity Mobile Puzzle Game

This folder contains a self-contained Unity-ready prototype for a tap-blast style mobile puzzle game.

## Included gameplay

- 8x8 board
- 5 tile colors
- BFS-based connected-group detection
- Tap to clear groups of 2 or more
- Gravity and refill
- Score that scales with group size
- 20-move limit
- Target-score win condition
- Home, win, and game-over screens
- Fast in-memory retry without scene reload

## Files

- `Assets/Scripts/GameBootstrap.cs`
- `Assets/Scripts/GameManager.cs`
- `Assets/Scripts/BoardController.cs`
- `Assets/Scripts/TileView.cs`
- `Assets/Scripts/TileColorId.cs`
- `Assets/Scripts/UnityPuzzleGameSetup.md`

## How to use

1. Create a new Unity 2D project.
2. Copy this folder's `Assets/Scripts` contents into your Unity project's `Assets/Scripts`.
3. Open any scene.
4. Press Play.

`GameBootstrap` builds the scene, UI, event system, placeholder tiles, and board at runtime.
