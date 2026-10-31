/**
 * SECOND SHIFT - Main Game
 * Coordinates simulation, rendering, and input.
 */

// ==================== MODULE IMPORTS ====================
const simulation = require('./simulation.js');
const render = require('./render.js');
const input = require('./input.js');

// ==================== GAME LOOP ====================
let gameLoopId = null;
let lastTickTime = 0;

// ==================== INITIALIZATION ====================
function initGame() {
  // Initialize simulation state
  simulation.reset();
  
  // Set up canvas
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    canvas.width = render.CANVAS_WIDTH;
    canvas.height = render.CANVAS_HEIGHT;
    render.ctx = canvas.getContext('2d');
  }
  
  // Set up input listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  
  // Initialize touch controls
  input.initTouchListeners();
  
  // Initial draw
  render.draw();
  
  // Start game loop
  startGameLoop();
  
  // Update objective text
  updateObjective();
  
  // Set up victory modal
  setupVictoryModal();
  
  // Set up reset button
  setupResetButton();
}

// ==================== KEYBOARD HANDLERS ====================
function handleKeyDown(e) {
  input.handleKeyDown(e);
}

function handleKeyUp(e) {
  input.handleKeyUp(e);
}

// ==================== GAME LOOP ====================
function startGameLoop() {
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
  }
  
  function loop(timestamp) {
    if (!state.paused) {
      processGameLoop(timestamp);
    }
    render.draw();
    gameLoopId = requestAnimationFrame(loop);
  }
  
  lastTickTime = performance.now();
  gameLoopId = requestAnimationFrame(loop);
}

function processGameLoop(timestamp) {
  const elapsed = timestamp - lastTickTime;
  
  if (elapsed >= simulation.TICK_RATE) {
    // Process keyboard input (only when not paused)
    if (!state.paused) {
      input.processKeyboardInput();
    }
    
    // Advance simulation
    simulation.tick();
    
    // Update tick counter for debug
    if (debugInfo) {
      debugInfo.textContent = `Ticks: ${simulation.tickCount}`;
    }
    
    lastTickTime = timestamp - (elapsed % simulation.TICK_RATE);
  }
  
  requestAnimationFrame(loop);
}

// ==================== UI UPDATES ====================
function updateObjective() {
  const objectiveText = document.getElementById('objective-text');
  if (objectiveText) {
    if (simulation.state.victory) {
      objectiveText.textContent = 'VICTORY! Factory powered!';
    } else if (simulation.state.cell.inSocket) {
      objectiveText.textContent = 'Core powered!';
    } else if (simulation.robot.carrying) {
      objectiveText.textContent = 'Insert cell into socket';
    } else if (getDistanceToCell() <= 3) {
      objectiveText.textContent = 'Pick up energy cell';
    } else {
      objectiveText.textContent = 'Pick up energy cell → Insert into socket';
    }
  }
}

function getDistanceToCell() {
  if (!simulation.state.cell.pickedUp) {
    const dx = Math.abs(simulation.robot.x - simulation.state.cell.x);
    const dy = Math.abs(simulation.robot.y - simulation.state.cell.y);
    return Math.max(dx, dy);
  }
  return 0;
}

// ==================== VICTORY MODAL ====================
function setupVictoryModal() {
  const modal = document.getElementById('victory-modal');
  if (!modal) return;
  
  const restartBtn = document.getElementById('victory-restart');
  if (!restartBtn) return;
  
  restartBtn.addEventListener('click', () => {
    resetGame();
  });
  
  // Close modal on escape when victory
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && simulation.state.victory) {
      resetGame();
    }
  });
}

// ==================== RESET BUTTON ====================
function setupResetButton() {
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetGame();
    });
  }
}

// ==================== PAUSE OVERLAY ====================
function updatePauseOverlay() {
  const overlay = document.getElementById('pause-overlay');
  if (overlay) {
    if (state.paused) {
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  }
}

// ==================== DEBUG INFO ====================
let debugInfo = null;
function setupDebugInfo() {
  const debugEl = document.getElementById('debug-info');
  if (debugEl) {
    debugInfo = debugEl.querySelector('#debug-ticks');
    if (debugInfo) {
      debugInfo.textContent = `Ticks: 0`;
    }
  }
}

// ==================== FOCUS HANDLING ====================
function handleFocusLoss() {
  // Unconditionally pause and clear input on focus loss
  state.paused = true;
  input.clearInput();
  updatePauseOverlay();
}

document.addEventListener('blur', handleFocusLoss);

// ==================== WINDOW RESIZE ====================
function handleResize() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  
  // Keep canvas centered
  const container = document.getElementById('game-wrapper');
  if (!container) return;
  
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  const scaleX = containerWidth / render.CANVAS_WIDTH;
  const scaleY = containerHeight / render.CANVAS_HEIGHT;
  const scale = Math.min(scaleX, scaleY);
  
  canvas.style.width = (render.CANVAS_WIDTH * scale) + 'px';
  canvas.style.height = (render.CANVAS_HEIGHT * scale) + 'px';
}

window.addEventListener('resize', handleResize);

// ==================== PUBLIC API FOR NODE TESTING ====================
function getGameState() {
  return simulation.getState();
}

function setGameState(newState) {
  simulation.setState(newState);
}

function tickSimulation() {
  simulation.tick();
}

function resetSimulation() {
  simulation.reset();
}

// ==================== EXPORT ====================
window.SecondShift = {
  initGame,
  getGameState,
  setGameState,
  tickSimulation,
  resetSimulation,
  isPaused: () => state.paused,
  setPaused: (paused) => { state.paused = paused; updatePauseOverlay(); }
};

// Initialize on load
if (typeof document !== 'undefined' && window) {
  window.addEventListener('load', initGame);
}

// ==================== MODULE EXPORT ====================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initGame,
    handleKeyDown,
    handleKeyUp,
    startGameLoop,
    processGameLoop,
    updateObjective,
    setupVictoryModal,
    setupResetButton,
    updatePauseOverlay,
    setupDebugInfo,
    handleFocusLoss,
    handleResize,
    getGameState,
    setGameState,
    tickSimulation,
    resetSimulation
  };
}
