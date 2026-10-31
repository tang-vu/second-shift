/**
 * SECOND SHIFT - Simulation Core
 * Pure deterministic game logic, separate from rendering.
 */

// ==================== CONFIGURATION ====================
const TILE_SIZE = 60;
const GRID_COLS = 13;
const GRID_ROWS = 10;
const TICK_RATE = 100; // ms per tick

// Tile types
const TILE = {
  EMPTY: 0,
  WALL: 1,
  FLOOR: 2,
  CELL: 3,
  SOCKET: 4,
  CORE: 5
};

// ==================== MAP ====================
// 10 rows, 13 columns - one cell, one socket, one core
const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Row 0: top wall
  [1, 2, 2, 2, 2, 2, 2, 2, 4, 5, 1, 1, 1], // Row 1: socket (4) and core (5) at col 8-9
  [1, 2, 2, 2, 2, 2, 2, 2, 4, 5, 1, 1, 1], // Row 2: socket and core continue
  [1, 2, 2, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1],
  [1, 2, 2, 1, 2, 2, 1, 2, 2, 2, 1, 1, 1],
  [1, 2, 2, 1, 2, 2, 1, 2, 2, 2, 1, 1, 1],
  [1, 2, 2, 1, 2, 2, 1, 2, 2, 2, 1, 1, 1],
  [1, 2, 2, 1, 1, 1, 1, 2, 2, 2, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1],
  [1, 2, 3, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1]  // Row 9: cell (3) at col 2
];

// ==================== GAME STATE ====================
let state = null;

/**
 * Initialize simulation state
 * @returns {Object} Complete initial state
 */
function initState() {
  return {
    robot: {
      x: 1,
      y: 1,
      facing: 'down',  // up, down, left, right
      carrying: null   // {x, y} or null
    },
    cell: {
      x: 2,
      y: 9,
      pickedUp: false,
      inSocket: false
    },
    socket: {
      x: 8,
      y: 1
    },
    core: {
      x: 9,
      y: 1,
      powered: false
    },
    victory: false
  };
}

/**
 * Deep clone state for reset
 * @param {Object} state - State to clone
 * @returns {Object} Cloned state
 */
function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Reset to initial state
 * @param {Object} currentState - Current state (optional, for partial reset)
 */
function reset(currentState) {
  state = cloneState(currentState || initState());
}

/**
 * Get tile value at position
 * @param {number} x - Grid column
 * @param {number} y - Grid row
 * @returns {number} Tile type
 */
function getTile(x, y) {
  if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) {
    return TILE.WALL;
  }
  return MAP[y][x];
}

/**
 * Check if position is walkable
 * @param {number} x - Grid column
 * @param {number} y - Grid row
 * @returns {boolean}
 */
function isWalkable(x, y) {
  const tile = getTile(x, y);
  return tile === TILE.EMPTY || tile === TILE.FLOOR;
}

/**
 * Check if position has a wall
 * @param {number} x - Grid column
 * @param {number} y - Grid row
 * @returns {boolean}
 */
function hasWall(x, y) {
  return getTile(x, y) === TILE.WALL;
}

/**
 * Move robot one tile in direction
 * @param {string} direction - up, down, left, right
 * @returns {boolean} Whether move succeeded
 */
function moveRobot(direction) {
  const dr = { up: -1, down: 1, left: 0, right: 0 };
  const dc = { up: 0, down: 0, left: -1, right: 1 };
  
  const dx = dc[direction];
  const dy = dr[direction];
  const newX = state.robot.x + dx;
  const newY = state.robot.y + dy;
  
  if (!isWalkable(newX, newY)) {
    return false;
  }
  
  state.robot.x = newX;
  state.robot.y = newY;
  state.robot.facing = direction;
  
  return true;
}

/**
 * Face robot in direction
 * @param {string} direction - up, down, left, right
 */
function faceRobot(direction) {
  state.robot.facing = direction;
}

/**
 * Try to interact with tile in front of robot
 * @returns {Object} Result with success and action type
 */
function interact() {
  const dx = { up: 0, down: 0, left: -1, right: 1 };
  const dy = { up: -1, down: 1, left: 0, right: 0 };
  
  const targetX = state.robot.x + dx[state.robot.facing];
  const targetY = state.robot.y + dy[state.robot.facing];
  const tile = getTile(targetX, targetY);
  
  if (state.robot.carrying) {
    // Carrying a cell - can only insert into socket
    if (tile === TILE.SOCKET && !state.cell.inSocket) {
      // Insert cell into socket
      state.robot.carrying = null;
      state.cell.pickedUp = false;
      state.cell.inSocket = true;
      state.core.powered = true;
      state.victory = true;
      return { success: true, action: 'insert' };
    }
    return { success: false, action: 'none' };
  }
  
  if (!state.cell.pickedUp) {
    // Not carrying - can only pick up cell
    if (tile === TILE.CELL && !state.cell.pickedUp) {
      state.robot.carrying = { x: targetX, y: targetY };
      state.cell.pickedUp = true;
      return { success: true, action: 'pick' };
    }
    return { success: false, action: 'none' };
  }
  
  // Carrying cell but socket interaction failed
  return { success: false, action: 'none' };
}

/**
 * Advance simulation by one tick
 * Processes queued inputs and advances game state
 */
function tick() {
  // Process input queue
  while (state.inputQueue.length > 0) {
    const input = state.inputQueue.shift();
    
    if (input.type === 'move') {
      moveRobot(input.dir);
    } else if (input.type === 'interact') {
      interact();
    } else if (input.type === 'face') {
      faceRobot(input.dir);
    }
  }
  
  // Check if victory condition met
  if (state.core.powered && !state.victory) {
    state.victory = true;
  }
}

/**
 * Queue an action for the next tick
 * @param {Object} action - { type: 'move'|'interact'|'face', dir? }
 */
function queueAction(action) {
  if (state.inputQueue.length < 10) {
    state.inputQueue.push(action);
  }
}

/**
 * Get current state as JSON-serializable object
 * @returns {Object}
 */
function getState() {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Set state from JSON-serializable object
 * @param {Object} newState
 */
function setState(newState) {
  state = JSON.parse(JSON.stringify(newState));
}

// Export for Node testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TILE,
    GRID_COLS,
    GRID_ROWS,
    MAP,
    initState,
    cloneState,
    reset,
    getTile,
    isWalkable,
    hasWall,
    moveRobot,
    faceRobot,
    interact,
    tick,
    queueAction,
    getState,
    setState,
    cloneState
  };
}
