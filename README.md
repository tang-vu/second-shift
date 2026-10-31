# SECOND SHIFT - Phase 1

A browser puzzle game about cooperating with recordings of your past actions inside a miniature robot factory.

## Phase 1: Single Robot Factory

### Objective
Walk the robot to the energy cell, pick it up, carry it to the power socket, and insert it to power the factory core.

### Controls

| Key | Action |
|-----|--------|
| **W / ↑** | Move forward (robot faces up) |
| **S / ↓** | Move backward (robot faces down) |
| **A / ←** | Move left (robot faces left) |
| **D / →** | Move right (robot faces right) |
| **E** | Interact with tile in front (pick up cell or insert into socket) |
| **R** | Reset game to initial state |
| **ESC** | Pause / Resume game |

### Touch Controls
- **D-Pad**: Move robot in direction
- **E button**: Interact
- **R button**: Reset

### Game Mechanics

1. **Movement**: Use WASD or arrow keys to move the robot. The robot faces the direction it moves.

2. **Pick Up**: When facing the energy cell (blue glowing orb), press **E** to pick it up. The robot's arm extends to carry it.

3. **Carry**: The robot carries the cell in its "hands" while moving to the socket.

4. **Insert**: When facing the power socket (gray circle) while carrying the cell, press **E** to insert it. This powers the factory core.

5. **Victory**: Once the cell is inserted into the socket, the core powers up with a golden glow, and a victory message appears.

### Technical Details

- **Grid-based simulation**: The game uses a deterministic tick-driven simulation (100ms per tick)
- **Separation of concerns**: Simulation logic, rendering, and input handling are in separate modules
- **No external dependencies**: Pure vanilla JavaScript with HTML5 Canvas
- **Serializable state**: Game state is plain JSON-serializable objects
- **Pause functionality**: Press ESC to pause; game state is preserved

### Map Layout

The factory room is a 13x10 grid:
- **Walls** (brown): Boundaries of the factory room
- **Floor** (cream/muted blue): Walkable areas
- **Energy cell** (blue orb): Located at position (2, 9) - bottom area
- **Power socket** (gray): Located at position (8, 1) - top area, near core
- **Factory core** (gray → gold): Located at position (9, 1) - powers up when cell is inserted

### Files

- `simulation.js` - Pure game logic (movement, interactions, state)
- `render.js` - Canvas drawing and visual presentation
- `input.js` - Keyboard, touch, and pointer input handling
- `game.js` - Main game coordinator and loop
- `index.html` - HTML structure
- `styles.css` - Warm factory theme styling
- `README.md` - This file

### Development Notes

The code is structured for incremental development:
- **Phase 1**: Single robot, one room, basic pick-up and insert
- **Phase 2+**: Multiple workers, recording/replay system, additional rooms, etc.

### Browser Compatibility

- Modern browsers with HTML5 Canvas support
- Touch devices for on-screen controls
- Keyboard input (WASD or arrow keys)

---

**Status**: Phase 1 Complete - Single robot factory room playable
