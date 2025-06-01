// Selection tools functionality
class SelectionTools {
  static initializeSelectionTools(petIdGenerator) {
    // Tool selection buttons
    const toolButtons = {
      'rectangleSelectBtn': 'rectangle',
      'ellipseSelectBtn': 'ellipse', 
      'lassoSelectBtn': 'lasso',
      'magicWandBtn': 'magicWand',
      'brushSelectBtn': 'brush',
      'eraserSelectBtn': 'eraser'
    };

    Object.entries(toolButtons).forEach(([buttonId, tool]) => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener('click', () => SelectionTools.setSelectionTool(tool, petIdGenerator));
      }
    });

    // Operation buttons
    const operationButtons = {
      'addToSelectionBtn': 'add',
      'subtractFromSelectionBtn': 'subtract',
      'intersectSelectionBtn': 'intersect',
      'replaceSelectionBtn': 'replace'
    };

    Object.entries(operationButtons).forEach(([buttonId, operation]) => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener('click', () => SelectionTools.setSelectionOperation(operation, petIdGenerator));
      }
    });

    // Command buttons
    const commands = {
      'selectAllBtn': () => SelectionTools.selectAll(petIdGenerator),
      'deselectAllBtn': () => SelectionTools.deselectAll(petIdGenerator),
      'invertSelectionBtn': () => SelectionTools.invertSelection(petIdGenerator),
      'expandSelectionBtn': () => SelectionTools.modifySelection('expand', petIdGenerator),
      'contractSelectionBtn': () => SelectionTools.modifySelection('contract', petIdGenerator),
      'smoothSelectionBtn': () => SelectionTools.modifySelection('smooth', petIdGenerator)
    };

    Object.entries(commands).forEach(([buttonId, handler]) => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener('click', handler);
      }
    });

    // Slider controls
    SelectionTools.initializeSliders(petIdGenerator);
  }

  static initializeSliders(petIdGenerator) {
    // Brush size slider
    const brushSizeSlider = document.getElementById('brushSizeSlider');
    const brushSizeValue = document.getElementById('brushSizeValue');
    if (brushSizeSlider && brushSizeValue) {
      brushSizeSlider.addEventListener('input', (e) => {
        petIdGenerator.brushSize = parseInt(e.target.value);
        brushSizeValue.textContent = petIdGenerator.brushSize;
        SelectionTools.updateCursorSize(petIdGenerator);
      });
    }

    // Tolerance slider for magic wand
    const toleranceSlider = document.getElementById('toleranceSlider');
    const toleranceValue = document.getElementById('toleranceValue');
    if (toleranceSlider && toleranceValue) {
      toleranceSlider.addEventListener('input', (e) => {
        petIdGenerator.tolerance = parseInt(e.target.value);
        toleranceValue.textContent = petIdGenerator.tolerance;
      });
    }

    // Feather slider
    const featherSlider = document.getElementById('featherSlider');
    const featherValue = document.getElementById('featherValue');
    if (featherSlider && featherValue) {
      featherSlider.addEventListener('input', (e) => {
        petIdGenerator.featherAmount = parseInt(e.target.value);
        featherValue.textContent = petIdGenerator.featherAmount;
        SelectionTools.updateSelectionPreview(petIdGenerator);
      });
    }
  }

  static toggleCustomSelectionTools(petIdGenerator) {
    const customTools = document.getElementById('customSelectionTools');
    const selectionCanvas = document.getElementById('selectionCanvas');
    
    if (petIdGenerator.currentAlgorithm === 'custom') {
      customTools.classList.remove('hidden');
      SelectionTools.setupCustomSelection(petIdGenerator);
    } else {
      customTools.classList.add('hidden');
      selectionCanvas.classList.add('hidden');
      petIdGenerator.isCustomSelecting = false;
    }
  }

  static setupCustomSelection(petIdGenerator) {
    const processedCanvas = document.getElementById('processedCanvas');
    const selectionCanvas = document.getElementById('selectionCanvas');
    
    // Make sure selection canvas matches processed canvas size
    selectionCanvas.width = processedCanvas.width;
    selectionCanvas.height = processedCanvas.height;
    selectionCanvas.classList.remove('hidden');
    
    // Initialize selection mask if not exists
    if (!petIdGenerator.selectionMask) {
      petIdGenerator.selectionMask = new ImageData(selectionCanvas.width, selectionCanvas.height);
    }
    
    // Add event listeners for advanced selection
    SelectionTools.addAdvancedSelectionListeners(selectionCanvas, petIdGenerator);
    
    // Set initial tool and update UI
    SelectionTools.setSelectionTool('rectangle', petIdGenerator);
    SelectionTools.setSelectionOperation('add', petIdGenerator);
  }

  static setSelectionTool(tool, petIdGenerator) {
    petIdGenerator.currentTool = tool;
    SelectionTools.updateToolButtons(petIdGenerator);
    SelectionTools.updateToolOptions(petIdGenerator);
    SelectionTools.updateCanvasCursor(petIdGenerator);
    
    // Save current selection to history when switching tools
    if (petIdGenerator.selectionMask) {
      SelectionTools.saveSelectionToHistory(petIdGenerator);
    }
  }

  static setSelectionOperation(operation, petIdGenerator) {
    petIdGenerator.currentOperation = operation;
    SelectionTools.updateOperationButtons(petIdGenerator);
  }

  static updateToolButtons(petIdGenerator) {
    const toolButtons = ['rectangleSelectBtn', 'ellipseSelectBtn', 'lassoSelectBtn', 'magicWandBtn', 'brushSelectBtn', 'eraserSelectBtn'];
    
    toolButtons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.classList.remove('active');
      }
    });

    const toolMap = {
      'rectangle': 'rectangleSelectBtn',
      'ellipse': 'ellipseSelectBtn',
      'lasso': 'lassoSelectBtn',
      'magicWand': 'magicWandBtn',
      'brush': 'brushSelectBtn',
      'eraser': 'eraserSelectBtn'
    };

    const activeButton = document.getElementById(toolMap[petIdGenerator.currentTool]);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  static updateOperationButtons(petIdGenerator) {
    const operationButtons = ['addToSelectionBtn', 'subtractFromSelectionBtn', 'intersectSelectionBtn', 'replaceSelectionBtn'];
    
    operationButtons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.classList.remove('active');
      }
    });

    const operationMap = {
      'add': 'addToSelectionBtn',
      'subtract': 'subtractFromSelectionBtn',
      'intersect': 'intersectSelectionBtn',
      'replace': 'replaceSelectionBtn'
    };

    const activeButton = document.getElementById(operationMap[petIdGenerator.currentOperation]);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  static updateToolOptions(petIdGenerator) {
    const options = ['brushOptions', 'magicWandOptions'];
    
    // Hide all options first
    options.forEach(optionId => {
      const option = document.getElementById(optionId);
      if (option) {
        option.classList.add('hidden');
      }
    });

    // Show relevant options
    if (petIdGenerator.currentTool === 'brush' || petIdGenerator.currentTool === 'eraser') {
      const brushOptions = document.getElementById('brushOptions');
      if (brushOptions) {
        brushOptions.classList.remove('hidden');
      }
    }

    if (petIdGenerator.currentTool === 'magicWand') {
      const magicWandOptions = document.getElementById('magicWandOptions');
      if (magicWandOptions) {
        magicWandOptions.classList.remove('hidden');
      }
    }
  }

  static updateCanvasCursor(petIdGenerator) {
    const selectionCanvas = document.getElementById('selectionCanvas');
    if (!selectionCanvas) return;

    // Remove all cursor classes
    const cursorClasses = ['rectangle-mode', 'ellipse-mode', 'lasso-mode', 'magic-wand-mode', 'brush-mode', 'eraser-mode'];
    cursorClasses.forEach(cls => selectionCanvas.classList.remove(cls));

    // Add appropriate cursor class
    const cursorMap = {
      'rectangle': 'rectangle-mode',
      'ellipse': 'ellipse-mode',
      'lasso': 'lasso-mode',
      'magicWand': 'magic-wand-mode',
      'brush': 'brush-mode',
      'eraser': 'eraser-mode'
    };

    const cursorClass = cursorMap[petIdGenerator.currentTool];
    if (cursorClass) {
      selectionCanvas.classList.add(cursorClass);
    }
  }

  static updateCursorSize(petIdGenerator) {
    if (petIdGenerator.currentTool === 'brush' || petIdGenerator.currentTool === 'eraser') {
      // Update cursor size indicator if needed
      const indicator = document.querySelector('.brush-size-indicator');
      if (indicator) {
        indicator.style.width = `${petIdGenerator.brushSize}px`;
        indicator.style.height = `${petIdGenerator.brushSize}px`;
      }
    }
  }

  static selectAll(petIdGenerator) {
    const canvas = document.getElementById('processedCanvas');
    if (!canvas) return;

    petIdGenerator.selectionMask = new ImageData(canvas.width, canvas.height);
    const data = petIdGenerator.selectionMask.data;
    
    // Fill with white (selected)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;     // R
      data[i + 1] = 255; // G  
      data[i + 2] = 255; // B
      data[i + 3] = 255; // A
    }

    SelectionTools.updateSelectionPreview(petIdGenerator);
    SelectionTools.saveSelectionToHistory(petIdGenerator);
  }

  static deselectAll(petIdGenerator) {
    petIdGenerator.selectionMask = null;
    SelectionTools.updateSelectionPreview(petIdGenerator);
    SelectionTools.saveSelectionToHistory(petIdGenerator);
  }

  static invertSelection(petIdGenerator) {
    const canvas = document.getElementById('processedCanvas');
    if (!canvas) return;

    if (!petIdGenerator.selectionMask) {
      SelectionTools.selectAll(petIdGenerator);
      return;
    }

    const data = petIdGenerator.selectionMask.data;
    for (let i = 3; i < data.length; i += 4) { // Only modify alpha channel
      data[i] = 255 - data[i];
    }

    SelectionTools.updateSelectionPreview(petIdGenerator);
    SelectionTools.saveSelectionToHistory(petIdGenerator);
  }

  static modifySelection(type, petIdGenerator) {
    if (!petIdGenerator.selectionMask) return;

    const canvas = document.getElementById('processedCanvas');
    const ctx = canvas.getContext('2d');
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.putImageData(petIdGenerator.selectionMask, 0, 0);

    let kernelSize = 3;
    switch (type) {
      case 'expand':
        SelectionTools.dilateSelection(tempCtx, kernelSize);
        break;
      case 'contract':
        SelectionTools.erodeSelection(tempCtx, kernelSize);
        break;
      case 'smooth':
        SelectionTools.smoothSelection(tempCtx);
        break;
    }

    petIdGenerator.selectionMask = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    SelectionTools.updateSelectionPreview(petIdGenerator);
    SelectionTools.saveSelectionToHistory(petIdGenerator);
  }

  static dilateSelection(ctx, kernelSize) {
    // Morphological dilation
    const canvas = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const newData = new Uint8ClampedArray(data);

    const radius = Math.floor(kernelSize / 2);

    for (let y = radius; y < canvas.height - radius; y++) {
      for (let x = radius; x < canvas.width - radius; x++) {
        let maxAlpha = 0;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y + ky) * canvas.width + (x + kx)) * 4;
            maxAlpha = Math.max(maxAlpha, data[idx + 3]);
          }
        }
        
        const idx = (y * canvas.width + x) * 4;
        newData[idx + 3] = maxAlpha;
      }
    }

    const newImageData = new ImageData(newData, canvas.width, canvas.height);
    ctx.putImageData(newImageData, 0, 0);
  }

  static erodeSelection(ctx, kernelSize) {
    // Morphological erosion
    const canvas = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const newData = new Uint8ClampedArray(data);

    const radius = Math.floor(kernelSize / 2);

    for (let y = radius; y < canvas.height - radius; y++) {
      for (let x = radius; x < canvas.width - radius; x++) {
        let minAlpha = 255;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const idx = ((y + ky) * canvas.width + (x + kx)) * 4;
            minAlpha = Math.min(minAlpha, data[idx + 3]);
          }
        }
        
        const idx = (y * canvas.width + x) * 4;
        newData[idx + 3] = minAlpha;
      }
    }

    const newImageData = new ImageData(newData, canvas.width, canvas.height);
    ctx.putImageData(newImageData, 0, 0);
  }

  static smoothSelection(ctx) {
    // Gaussian blur for smoothing
    const canvas = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const newData = new Uint8ClampedArray(data);

    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    const kernelSum = 16;

    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        let sum = 0;
        let ki = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * canvas.width + (x + kx)) * 4;
            sum += data[idx + 3] * kernel[ki];
            ki++;
          }
        }
        
        const idx = (y * canvas.width + x) * 4;
        newData[idx + 3] = Math.min(255, sum / kernelSum);
      }
    }

    const newImageData = new ImageData(newData, canvas.width, canvas.height);
    ctx.putImageData(newImageData, 0, 0);
  }

  static updateSelectionPreview(petIdGenerator) {
    const selectionCanvas = document.getElementById('selectionCanvas');
    if (!selectionCanvas || !petIdGenerator.selectionMask) return;

    const ctx = selectionCanvas.getContext('2d');
    ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);

    // Draw selection mask with marching ants effect
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = selectionCanvas.width;
    tempCanvas.height = selectionCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.putImageData(petIdGenerator.selectionMask, 0, 0);

    // Apply feathering if set
    if (petIdGenerator.featherAmount > 0) {
      SelectionTools.applyFeathering(tempCtx, petIdGenerator.featherAmount);
    }

    // Draw with marching ants
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = Date.now() / 100 % 8; // Animated offset

    ctx.drawImage(tempCanvas, 0, 0);
    
    // Request animation frame for marching ants
    requestAnimationFrame(() => SelectionTools.updateSelectionPreview(petIdGenerator));
  }

  static applyFeathering(ctx, amount) {
    // Simple feathering by applying blur
    const canvas = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply multiple passes of light blur for feathering effect
    for (let pass = 0; pass < amount; pass++) {
      SelectionTools.blurImageData(imageData, 1);
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  static blurImageData(imageData, radius) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const newData = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let count = 0;
        
        for (let ky = -radius; ky <= radius; ky++) {
          for (let kx = -radius; kx <= radius; kx++) {
            const nx = x + kx;
            const ny = y + ky;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const idx = (ny * width + nx) * 4;
              sum += data[idx + 3];
              count++;
            }
          }
        }
        
        const idx = (y * width + x) * 4;
        newData[idx + 3] = sum / count;
      }
    }

    for (let i = 0; i < data.length; i++) {
      data[i] = newData[i];
    }
  }

  static saveSelectionToHistory(petIdGenerator) {
    if (petIdGenerator.selectionHistory.length > 10) {
      petIdGenerator.selectionHistory.shift(); // Remove oldest
    }
    
    if (petIdGenerator.selectionMask) {
      const historyEntry = new ImageData(
        new Uint8ClampedArray(petIdGenerator.selectionMask.data),
        petIdGenerator.selectionMask.width,
        petIdGenerator.selectionMask.height
      );
      petIdGenerator.selectionHistory.push(historyEntry);
    } else {
      petIdGenerator.selectionHistory.push(null);
    }
  }

  static clearSelection(petIdGenerator) {
    const selectionCanvas = document.getElementById('selectionCanvas');
    if (selectionCanvas) {
      const ctx = selectionCanvas.getContext('2d');
      ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    }
    
    petIdGenerator.selectionMask = null;
    petIdGenerator.selectionPath = [];
    petIdGenerator.previewSelection = null;
    
    // Clear visual feedback
    SelectionTools.updateSelectionPreview(petIdGenerator);
  }

  static addAdvancedSelectionListeners(canvas, petIdGenerator) {
    // Mouse events
    canvas.addEventListener('mousedown', (e) => SelectionEvents.handleSelectionStart(e, canvas, petIdGenerator));
    canvas.addEventListener('mousemove', (e) => SelectionEvents.handleSelectionMove(e, canvas, petIdGenerator));
    canvas.addEventListener('mouseup', (e) => SelectionEvents.handleSelectionEnd(e, canvas, petIdGenerator));
    canvas.addEventListener('mouseleave', (e) => SelectionEvents.handleSelectionEnd(e, canvas, petIdGenerator));
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      SelectionEvents.handleSelectionStart(mouseEvent, canvas, petIdGenerator);
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      SelectionEvents.handleSelectionMove(mouseEvent, canvas, petIdGenerator);
    });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      SelectionEvents.handleSelectionEnd(mouseEvent, canvas, petIdGenerator);
    });
  }
}
