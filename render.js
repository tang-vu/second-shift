/**
 * SECOND SHIFT - Rendering
 * Handles canvas drawing and presentation, separate from simulation.
 */

const TILE_SIZE = 60;
const GRID_COLS = 13;
const GRID_ROWS = 10;
const CANVAS_WIDTH = GRID_COLS * TILE_SIZE;
const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE;

/**
 * Linear interpolation with clamping
 * @param {number} start - Starting value
 * @param {number} end - Target value  
 * @param {number} progress - 0 to 1
 * @returns {number}
 */
function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

/**
 * Draw a single tile
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Grid column
 * @param {number} y - Grid row
 * @param {number} tile - Tile type constant
 * @param {boolean} highlighted - Whether this tile is highlighted
 */
function drawTile(ctx, x, y, tile, highlighted) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  
  // Base floor color
  ctx.fillStyle = '#fff8e7'; // Cream
  ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
  
  // Grid lines
  ctx.strokeStyle = '#d4c4a8';
  ctx.lineWidth = 1;
  ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
  
  // Wall
  if (tile === 1) {
    const grad = ctx.createLinearGradient(px, py, px, py + TILE_SIZE);
    grad.addColorStop(0, '#8b5a2b');
    grad.addColorStop(0.5, '#a0683d');
    grad.addColorStop(1, '#6b4226');
    ctx.fillStyle = grad;
    ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    
    // Brick pattern
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        ctx.fillRect(px + 15 + i * 20, py + 10 + j * 25, 15, 20);
      }
    }
    
    // Highlight
    if (highlighted) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    }
  }
  // Floor pattern
  else if (tile === 2) {
    ctx.fillStyle = '#b8c9d8'; // Muted blue
    ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
  }
  
  // Energy cell
  else if (tile === 3) {
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;
    
    // Outer glow
    const glowGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 25);
    glowGrad.addColorStop(0, 'rgba(100, 200, 255, 0.9)');
    glowGrad.addColorStop(0.5, 'rgba(50, 150, 255, 0.4)');
    glowGrad.addColorStop(1, 'rgba(50, 150, 255, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Core
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 4, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Socket
  else if (tile === 4) {
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;
    
    // Socket base
    ctx.fillStyle = '#546e7a';
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    
    // Socket insert point
    ctx.fillStyle = '#78909c';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    if (highlighted) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  
  // Core
  else if (tile === 5) {
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;
    
    // Core base
    ctx.fillStyle = '#424242';
    ctx.beginPath();
    ctx.arc(cx, cy, 16, 0, Math.PI * 2);
    ctx.fill();
    
    // Core label
    ctx.fillStyle = state.core.powered ? '#ffd700' : '#888888';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.core.powered ? '⚡' : 'OFF', cx, cy);
    
    // Power glow when active
    if (state.core.powered) {
      const glowGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 30);
      glowGrad.addColorStop(0, 'rgba(255, 215, 0, 0.9)');
      glowGrad.addColorStop(0.4, 'rgba(255, 215, 0, 0.4)');
      glowGrad.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Draw the robot
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Grid column
 * @param {number} y - Grid row
 * @param {Object} robot - Robot state
 */
function drawRobot(ctx, x, y, robot) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  const cx = px + TILE_SIZE / 2;
  const cy = py + TILE_SIZE / 2;
  
  // Save context for rotation
  ctx.save();
  ctx.translate(cx, cy);
  
  // Rotate based on facing direction
  let rotation = 0;
  switch (robot.facing) {
    case 'up': rotation = Math.PI / 2; break;
    case 'down': rotation = -Math.PI / 2; break;
    case 'left': rotation = Math.PI; break;
    case 'right': rotation = 0; break;
  }
  ctx.rotate(rotation);
  
  // Draw robot (amber body)
  const robotRadius = 22;
  const robotGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, robotRadius);
  robotGrad.addColorStop(0, '#ffcc80');
  robotGrad.addColorStop(0.5, '#ffb74d');
  robotGrad.addColorStop(1, '#f57c00');
  
  ctx.fillStyle = robotGrad;
  ctx.beginPath();
  ctx.arc(0, 0, robotRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Body outline
  ctx.strokeStyle = '#e65100';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, robotRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Face - eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(-8, -5, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(8, -5, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Pupils
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(-8, -5, 2, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(8, -5, 2, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Face - mouth
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 5, 10, 0.2, Math.PI - 0.2);
  ctx.stroke();
  
  // Antenna
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -robotRadius + 5);
  ctx.lineTo(0, -robotRadius - 5);
  ctx.stroke();
  
  // Antenna ball
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.arc(0, -robotRadius - 5, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Carrying indicator - arm extending
  if (robot.carrying) {
    const carryPx = robot.carrying.x * TILE_SIZE;
    const carryPy = robot.carrying.y * TILE_SIZE;
    const carryCx = carryPx + TILE_SIZE / 2;
    const carryCy = carryPy + TILE_SIZE / 2;
    
    ctx.strokeStyle = '#ffb74d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(15, 5);
    ctx.lineTo(carryCx - px, carryCy - py);
    ctx.stroke();
    
    // Draw cell being carried
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.arc(carryCx, carryCy, 10, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Draw wire connecting socket to core
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
function drawWire(ctx) {
  const socketX = state.socket.x * TILE_SIZE + TILE_SIZE / 2;
  const socketY = state.socket.y * TILE_SIZE + TILE_SIZE / 2;
  const coreX = state.core.x * TILE_SIZE + TILE_SIZE / 2;
  const coreY = state.core.y * TILE_SIZE + TILE_SIZE / 2;
  
  // Only draw wire if socket is occupied
  if (state.cell.inSocket) {
    ctx.strokeStyle = state.core.powered ? '#ffd700' : '#888888';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(socketX, socketY);
    ctx.lineTo(coreX, coreY);
    ctx.stroke();
  }
}

/**
 * Main draw function
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 */
function draw() {
  // Clear canvas
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw all tiles
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      const tile = MAP[y][x];
      const highlighted = (state.robot.x === x && state.robot.y === y);
      drawTile(ctx, x, y, tile, highlighted);
    }
  }
  
  // Draw socket highlight if cell is in socket
  if (state.cell.inSocket) {
    drawTile(ctx, state.socket.x, state.socket.y, TILE.SOCKET, true);
    drawTile(ctx, state.core.x, state.core.y, TILE.CORE, true);
  }
  
  // Draw robot at integer grid position
  drawRobot(ctx, state.robot.x, state.robot.y, state.robot);
  
  // Draw wire
  drawWire(ctx);
}

/**
 * Update presentation state (smooth interpolation)
 * Uses separate presentation values, doesn't modify simulation state
 * @param {number} progress - Interpolation progress 0-1
 */
function updatePresentation(progress) {
  // Presentation state is separate from simulation state
  // No interpolation needed for Phase 1 - robot moves one tile per tick
  // This is a placeholder for future smooth movement
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    draw,
    updatePresentation,
    TILE_SIZE,
    GRID_COLS,
    GRID_ROWS,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    lerp
  };
}
