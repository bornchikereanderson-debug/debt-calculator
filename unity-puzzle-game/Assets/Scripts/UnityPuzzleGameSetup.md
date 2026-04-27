# Unity Tap Blast Setup

## What is included

- `GameBootstrap.cs`: auto-creates the runtime scene and UI
- `GameManager.cs`: handles score, moves, win/loss state, retry, next level
- `BoardController.cs`: creates the 8x8 board, finds groups with BFS, removes tiles, applies gravity, and refills
- `TileView.cs`: tile rendering, click handling, and simple squash/fade animations
- `TileColorId.cs`: shared color enum

## Quick start

1. Create a new Unity 2D project.
2. Copy the `Assets/Scripts` folder from this package into your Unity project's `Assets` folder.
3. Open any scene, or create a blank scene.
4. Press Play.

The bootstrapper creates the canvas, board, HUD, home screen, win screen, and lose screen automatically.

## Mobile notes

- The UI uses a `CanvasScaler` configured for portrait mobile play.
- Restart is instant because the board resets in memory without reloading the scene.
- Placeholder art uses runtime-generated colored squares, so no art import is required.

## Tunable values

You can tweak these values directly in the scripts or expose them further in the inspector:

- `GameManager`
  - `startingMoves`
  - `baseTargetScore`
  - `targetIncreasePerLevel`
  - `pointsMultiplier`
- `BoardController`
  - `width`
  - `height`
  - `tileSize`
  - `tileGap`
  - `colorCount`

## Expansion ideas

- Special tiles for large groups
- Combo chains and particles
- Objective-based levels
- Obstacles and blockers
- Audio and haptics
