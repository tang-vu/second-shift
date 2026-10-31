/**
 * SECOND SHIFT - Input Handling
 * Manages keyboard, touch, and pointer inputs.
 * Separated from simulation and rendering.
 */

// ==================== STATE ====================
const inputState = {
  keys: {},           // Currently held keys
  pending: {},        // Key releases pending
  touchPending: {}    // Touch actions pending
};

// ==================== KEYBOARD INPUT ====================

/**
 * Handle keydown event
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeyDown(e) {
  // Map key to action
  const keyMap = {
    'KeyW': 'move', 'KeyS': 'move', 'KeyA': 'move', 'KeyD': 'move',
    'ArrowUp': 'move', 'ArrowDown': 'move', 'ArrowLeft': 'move', 'ArrowRight': 'move',
    'KeyE': 'interact',
    'KeyR': 'reset',
    'Escape': 'togglePause'
  };
  
  const action = keyMap[e.code] || keyMap[e.key];
  
  if (!action) return;
  
  // Prevent default for game keys
  if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE', 'KeyR'].includes(e.code)) {
    e.preventDefault();
  }
  
  // Track key press
  if (!inputState.keys[e.code]) {
    inputState.keys[e.code] = true;
    inputState.pending[e.code] = false;
  }
  
  // Queue action based on key
  if (action === 'move') {
    const dirMap = {
      'KeyW': 'up', 'ArrowUp': 'up',
      'KeyS': 'down', 'ArrowDown': 'down',
      'KeyA': 'left', 'ArrowLeft': 'left',
      'KeyD': 'right', 'ArrowRight': 'right'
    };
    queueAction({ type: 'move', dir: dirMap[e.code] });
  } else if (action === 'interact') {
    queueAction({ type: 'interact' });
  } else if (action === 'togglePause') {
    togglePause();
  } else if (action === 'reset') {
    resetGame();
  }
}

/**
 * Handle keyup event
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleKeyUp(e) {
  if (inputState.keys[e.code]) {
    inputState.keys[e.code] = false;
    inputState.pending[e.code] = true;
  }
}

/**
 * Process keyboard input for the next tick
 */
function processKeyboardInput() {
  const pendingReleases = [];
  
  for (const key in inputState.keys) {
    if (inputState.pending[key]) {
      pendingReleases.push(key);
      delete inputState.keys[key];
    }
  }
  
  // Clear pending after processing
  if (pendingReleases.length > 0) {
    pendingReleases.forEach(key => {
      delete inputState.pending[key];
    });
  }
}

/**
 * Queue an action for the next tick
 * @param {Object} action - Action to queue
 */
function queueAction(action) {
  if (!state.inputQueue) {
    state.inputQueue = [];
  }
  
  if (state.inputQueue.length < 10) {
    state.inputQueue.push(action);
  }
}

// ==================== TOUCH INPUT ====================

/**
 * Initialize touch listeners
 */
function initTouchListeners() {
  const dirButtons = document.querySelectorAll('.dir-btn');
  const touchInteract = document.getElementById('touch-interact');
  const touchReset = document.getElementById('touch-reset');
  
  // Direction buttons with pointer events
  dirButtons.forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const dir = btn.dataset.dir;
      queueAction({ type: 'move', dir });
      faceAction(dir);
    });
  });
  
  // Interact button
  if (touchInteract) {
    touchInteract.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      queueAction({ type: 'interact' });
    });
  }
  
  // Reset button
  if (touchReset) {
    touchReset.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      resetGame();
    });
  }
}

/**
 * Face action for touch controls
 * @param {string} dir - Direction
 */
function faceAction(dir) {
  queueAction({ type: 'face', dir });
}

/**
 * Queue face action
 * @param {string} dir - Direction
 */
function queueFaceAction(dir) {
  queueAction({ type: 'face', dir });
}

// ==================== PAUSE ====================

/**
 * Toggle pause state
 */
function togglePause() {
  state.paused = !state.paused;
  updatePauseOverlay();
}

/**
 * Update pause overlay visibility
 */
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

// ==================== RESET ====================

/**
 * Reset game state
 */
function resetGame() {
  reset(state);
  state.inputQueue = [];
  state.paused = false;
  updatePauseOverlay();
}

// ==================== INPUT CLEAR ====================

/**
 * Clear all input state
 */
function clearInput() {
  inputState.keys = {};
  inputState.pending = {};
  inputState.touchPending = {};
  
  if (state.inputQueue) {
    state.inputQueue = [];
  }
}

// ==================== PUBLIC API ====================

function getInputState() {
  return {
    keys: inputState.keys,
    pending: inputState.pending,
    queueLength: state.inputQueue ? state.inputQueue.length : 0
  };
}

function setPaused(paused) {
  state.paused = paused;
  updatePauseOverlay();
}

function isPaused() {
  return state.paused;
}

// Export for Node testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleKeyDown,
    handleKeyUp,
    processKeyboardInput,
    queueAction,
    initTouchListeners,
    togglePause,
    updatePauseOverlay,
    resetGame,
    clearInput,
    getInputState,
    setPaused,
    isPaused
  };
}
