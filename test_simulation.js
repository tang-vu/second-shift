/**
 * SECOND SHIFT - Simulation Tests
 * Run with: node test_simulation.js
 */

const simulation = require('./simulation.js');

console.log('=== SECOND SHIFT Simulation Tests ===\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(`${message}: expected ${expectedStr}, got ${actualStr}`);
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    throw new Error(`${message}: expected function to throw`);
  } catch (e) {
    if (!e.message.includes(message)) {
      throw e;
    }
  }
}

// ==================== CONFIGURATION TESTS ====================

test('Constants are defined', () => {
  assertEqual(simulation.TILE_SIZE, 60);
  assertEqual(simulation.GRID_COLS, 13);
  assertEqual(simulation.GRID_ROWS, 10);
  assertEqual(simulation.TICK_RATE, 100);
});

test('TILE constants are correct', () => {
  assertEqual(simulation.TILE.EMPTY, 0);
  assertEqual(simulation.TILE.WALL, 1);
  assertEqual(simulation.TILE.FLOOR, 2);
  assertEqual(simulation.TILE.CELL, 3);
  assertEqual(simulation.TILE.SOCKET, 4);
  assertEqual(simulation.TILE.CORE, 5);
});

test('MAP has correct dimensions', () => {
  assertEqual(simulation.MAP.length, 10);
  simulation.MAP.forEach((row, i) => {
    assertEqual(row.length, 13, `Row ${i} has wrong length`);
  });
});

// ==================== INITIAL STATE TESTS ====================

test('initState returns correct structure', () => {
  const state = simulation.initState();
  assertDeepEqual(state, {
    robot: { x: 1, y: 1, facing: 'down', carrying: null },
    cell: { x: 2, y: 9, pickedUp: false, inSocket: false },
    socket: { x: 8, y: 1 },
    core: { x: 9, y: 1, powered: false },
    victory: false
  });
});

test('initState robot is at (1, 1)', () => {
  const state = simulation.initState();
  assertEqual(state.robot.x, 1);
  assertEqual(state.robot.y, 1);
});

test('initState cell is at (2, 9)', () => {
  const state = simulation.initState();
  assertEqual(state.cell.x, 2);
  assertEqual(state.cell.y, 9);
});

test('initState socket is at (8, 1)', () => {
  const state = simulation.initState();
  assertEqual(state.socket.x, 8);
  assertEqual(state.socket.y, 1);
});

test('initState core is at (9, 1)', () => {
  const state = simulation.initState();
  assertEqual(state.core.x, 9);
  assertEqual(state.core.y, 1);
});

// ==================== MAP ACCESS TESTS ====================

test('getTile returns WALL at boundaries', () => {
  assertEqual(simulation.getTile(0, 0), 1);
  assertEqual(simulation.getTile(12, 0), 1);
  assertEqual(simulation.getTile(0, 9), 1);
  assertEqual(simulation.getTile(12, 9), 1);
});

test('getTile returns CELL at (2, 9)', () => {
  assertEqual(simulation.getTile(2, 9), 3);
});

test('getTile returns SOCKET at (8, 1)', () => {
  assertEqual(simulation.getTile(8, 1), 4);
});

test('getTile returns CORE at (9, 1)', () => {
  assertEqual(simulation.getTile(9, 1), 5);
});

test('getTile returns FLOOR at walkable position', () => {
  assertEqual(simulation.getTile(1, 1), 2);
});

test('isWalkable returns true for floor', () => {
  assertEqual(simulation.isWalkable(1, 1), true);
});

test('isWalkable returns false for walls', () => {
  assertEqual(simulation.isWalkable(0, 0), false);
  assertEqual(simulation.isWalkable(13, 5), false);
});

test('hasWall returns true at walls', () => {
  assertEqual(simulation.hasWall(0, 0), true);
  assertEqual(simulation.hasWall(1, 0), true);
});

test('hasWall returns false on floor', () => {
  assertEqual(simulation.hasWall(1, 1), false);
});

// ==================== MOVEMENT TESTS ====================

// Initialize state before movement tests
simulation.reset(simulation.initState());

test('moveRobot moves robot forward', () => {
  const result = simulation.moveRobot('down');
  assertEqual(result, true);
  assertEqual(simulation.state.robot.x, 1);
  assertEqual(simulation.state.robot.y, 2);
  assertEqual(simulation.state.robot.facing, 'down');
});

test('moveRobot cannot move into walls', () => {
  simulation.reset(simulation.initState());
  const result = simulation.moveRobot('left');
  assertEqual(result, false);
  assertEqual(simulation.state.robot.x, 1);
  assertEqual(simulation.state.robot.y, 1);
});

test('moveRobot cannot move out of bounds', () => {
  simulation.reset(simulation.initState());
  // Move to edge
  simulation.moveRobot('down');
  simulation.moveRobot('down');
  simulation.moveRobot('down');
  simulation.moveRobot('down');
  simulation.moveRobot('down');
  simulation.moveRobot('down');
  // Now at row 7, try to move down to row 8 which is wall
  const result = simulation.moveRobot('down');
  assertEqual(result, false);
});

test('moveRobot updates facing direction', () => {
  simulation.reset(simulation.initState());
  simulation.moveRobot('right');
  assertEqual(simulation.state.robot.facing, 'right');
});

// ==================== INTERACTION TESTS ====================

test('interact does nothing when not carrying', () => {
  simulation.reset(simulation.initState());
  const result = simulation.interact();
  assertEqual(result.success, false);
  assertEqual(result.action, 'none');
});

test('interact picks up cell when facing it', () => {
  simulation.reset(simulation.initState());
  // Move robot to cell position (3, 9) then face down
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  // Now at (8, 9), move left 6 times
  for (let i = 0; i < 6; i++) {
    simulation.moveRobot('left');
  }
  // Now at (2, 9), face down to be adjacent
  simulation.faceRobot('down');
  const result = simulation.interact();
  assertEqual(result.success, true);
  assertEqual(result.action, 'pick');
  assertEqual(simulation.state.robot.carrying, { x: 2, y: 9 });
  assertEqual(simulation.state.cell.pickedUp, true);
});

test('interact does nothing when not facing cell', () => {
  simulation.reset(simulation.initState());
  // Move robot away from cell
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  // Now at (8, 1), not near cell at (2, 9)
  const result = simulation.interact();
  assertEqual(result.success, false);
  assertEqual(result.action, 'none');
});

// ==================== INSERTION TESTS ====================

test('interact inserts cell into socket when carrying', () => {
  simulation.reset(simulation.initState());
  // Pick up cell
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  for (let i = 0; i < 6; i++) {
    simulation.moveRobot('left');
  }
  simulation.faceRobot('down');
  simulation.interact(); // Pick up
  
  // Move to socket at (8, 1)
  simulation.moveRobot('up');
  simulation.moveRobot('up');
  simulation.moveRobot('up');
  simulation.moveRobot('up');
  simulation.moveRobot('up');
  simulation.moveRobot('up');
  // Now at (2, 1), move right
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  // Now at (8, 1), face down
  simulation.faceRobot('down');
  
  const result = simulation.interact();
  assertEqual(result.success, true);
  assertEqual(result.action, 'insert');
  assertEqual(simulation.state.robot.carrying, null);
  assertEqual(simulation.state.cell.pickedUp, false);
  assertEqual(simulation.state.cell.inSocket, true);
  assertEqual(simulation.state.core.powered, true);
  assertEqual(simulation.state.victory, true);
});

test('victory state is set after insertion', () => {
  simulation.reset(simulation.initState());
  // Pick up and insert (simplified)
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  simulation.moveRobot('right');
  for (let i = 0; i < 6; i++) {
    simulation.moveRobot('left');
  }
  simulation.faceRobot('down');
  simulation.interact();
  
  simulation.moveRobot('up');
  simulation.moveRobot('up');
  simulation.moveRobot('up');
  simulation.moveRobot('up');
  simulation.moveRobot('up');
  simulation.moveRobot('up');
  for (let i = 0; i < 6; i++) {
    simulation.moveRobot('right');
  }
  simulation.faceRobot('down');
  simulation.interact();
  
  assertEqual(simulation.state.victory, true);
});

// ==================== RESET TESTS ====================

test('reset restores initial state', () => {
  simulation.reset(simulation.initState());
  simulation.moveRobot('down');
  simulation.moveRobot('right');
  simulation.state.robot.carrying = { x: 1, y: 1 };
  simulation.state.core.powered = true;
  simulation.state.victory = true;
  
  simulation.reset();
  
  assertEqual(simulation.state.robot.x, 1);
  assertEqual(simulation.state.robot.y, 1);
  assertEqual(simulation.state.robot.facing, 'down');
  assertEqual(simulation.state.robot.carrying, null);
  assertEqual(simulation.state.cell.x, 2);
  assertEqual(simulation.state.cell.y, 9);
  assertEqual(simulation.state.cell.pickedUp, false);
  assertEqual(simulation.state.cell.inSocket, false);
  assertEqual(simulation.state.core.powered, false);
  assertEqual(simulation.state.victory, false);
});

test('reset is idempotent', () => {
  const state1 = simulation.reset(simulation.initState());
  const state2 = simulation.reset(state1);
  assertDeepEqual(state1, state2);
});

// ==================== TICK TESTS ====================

test('tick processes queued actions', () => {
  simulation.reset(simulation.initState());
  // Queue a move action
  simulation.queueAction({ type: 'move', dir: 'down' });
  
  // Tick should process it
  simulation.tick();
  assertEqual(simulation.state.robot.y, 2);
});

test('tick advances simulation', () => {
  simulation.reset(simulation.initState());
  simulation.tickCount = 0;
  
  simulation.tick();
  assertEqual(simulation.tickCount, 1);
});

// ==================== STATE MANAGEMENT TESTS ====================

test('getState returns serializable state', () => {
  simulation.reset(simulation.initState());
  const state = simulation.getState();
  assertEqual(typeof JSON.stringify(state), 'string');
});

test('setState restores state', () => {
  simulation.reset(simulation.initState());
  simulation.moveRobot('down');
  simulation.moveRobot('right');
  
  const savedState = simulation.getState();
  simulation.reset(simulation.initState());
  
  simulation.setState(savedState);
  
  assertEqual(simulation.state.robot.x, savedState.robot.x);
  assertEqual(simulation.state.robot.y, savedState.robot.y);
});

// ==================== SUMMARY ====================

console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
