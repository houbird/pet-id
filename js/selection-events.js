// Selection event handling
class SelectionEvents {
  static handleSelectionStart(e, canvas, petIdGenerator) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    petIdGenerator.isSelecting = true;
    petIdGenerator.startPoint = { x, y };
    
    switch (petIdGenerator.currentTool) {
      case 'rectangle':
      case 'ellipse':
        SelectionEvents.startShapeSelection(x, y, petIdGenerator);
        break;
      case 'lasso':
        SelectionEvents.startLassoSelection(x, y, petIdGenerator);
        break;
      case 'magicWand':
        SelectionEvents.performMagicWandSelection(x, y, canvas, petIdGenerator);
        break;
      case 'brush':
      case 'eraser':
        SelectionEvents.startBrushSelection(x, y, canvas, petIdGenerator);
        break;
    }
  }

  static handleSelectionMove(e, canvas, petIdGenerator) {
    if (!petIdGenerator.isSelecting) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    switch (petIdGenerator.currentTool) {
      case 'rectangle':
        SelectionEvents.updateRectangleSelection(x, y, canvas, petIdGenerator);
        break;
      case 'ellipse':
        SelectionEvents.updateEllipseSelection(x, y, canvas, petIdGenerator);
        break;
      case 'lasso':
        SelectionEvents.updateLassoSelection(x, y, canvas, petIdGenerator);
        break;
      case 'brush':
      case 'eraser':
        SelectionEvents.updateBrushSelection(x, y, canvas, petIdGenerator);
        break;
    }
  }

  static handleSelectionEnd(e, canvas, petIdGenerator) {
    if (!petIdGenerator.isSelecting) return;
    
    petIdGenerator.isSelecting = false;
    
    switch (petIdGenerator.currentTool) {
      case 'rectangle':
      case 'ellipse':
        SelectionEvents.finalizeShapeSelection(canvas, petIdGenerator);
        break;
      case 'lasso':
        SelectionEvents.finalizeLassoSelection(canvas, petIdGenerator);
        break;
      case 'brush':
      case 'eraser':
        SelectionEvents.finalizeBrushSelection(canvas, petIdGenerator);
        break;
    }
    
    petIdGenerator.startPoint = null;
    petIdGenerator.currentShape = null;
    SelectionTools.updateSelectionPreview(petIdGenerator);
    SelectionTools.saveSelectionToHistory(petIdGenerator);
  }

  static startShapeSelection(x, y, petIdGenerator) {
    petIdGenerator.currentShape = {
      startX: x,
      startY: y,
      endX: x,
      endY: y
    };
  }

  static updateRectangleSelection(x, y, canvas, petIdGenerator) {
    if (!petIdGenerator.currentShape) return;
    
    petIdGenerator.currentShape.endX = x;
    petIdGenerator.currentShape.endY = y;
    
    // Draw preview
    SelectionEvents.drawSelectionPreview(canvas, petIdGenerator);
  }

  static updateEllipseSelection(x, y, canvas, petIdGenerator) {
    if (!petIdGenerator.currentShape) return;
    
    petIdGenerator.currentShape.endX = x;
    petIdGenerator.currentShape.endY = y;
    
    // Draw preview
    SelectionEvents.drawSelectionPreview(canvas, petIdGenerator);
  }

  static startLassoSelection(x, y, petIdGenerator) {
    petIdGenerator.selectionPath = [{ x, y }];
  }

  static updateLassoSelection(x, y, canvas, petIdGenerator) {
    petIdGenerator.selectionPath.push({ x, y });
    SelectionEvents.drawSelectionPreview(canvas, petIdGenerator);
  }

  static startBrushSelection(x, y, canvas, petIdGenerator) {
    petIdGenerator.selectionPath = [{ x, y }];
    SelectionEvents.drawBrushStroke(x, y, canvas, petIdGenerator);
  }

  static updateBrushSelection(x, y, canvas, petIdGenerator) {
    petIdGenerator.selectionPath.push({ x, y });
    SelectionEvents.drawBrushStroke(x, y, canvas, petIdGenerator);
  }

  static drawSelectionPreview(canvas, petIdGenerator) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw existing selection if any
    if (petIdGenerator.selectionMask) {
      ctx.putImageData(petIdGenerator.selectionMask, 0, 0);
    }
    
    // Draw current tool preview
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    
    if (petIdGenerator.currentTool === 'rectangle' && petIdGenerator.currentShape) {
      const { startX, startY, endX, endY } = petIdGenerator.currentShape;
      const width = endX - startX;
      const height = endY - startY;
      ctx.strokeRect(startX, startY, width, height);
    } else if (petIdGenerator.currentTool === 'ellipse' && petIdGenerator.currentShape) {
      const { startX, startY, endX, endY } = petIdGenerator.currentShape;
      const centerX = (startX + endX) / 2;
      const centerY = (startY + endY) / 2;
      const radiusX = Math.abs(endX - startX) / 2;
      const radiusY = Math.abs(endY - startY) / 2;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (petIdGenerator.currentTool === 'lasso' && petIdGenerator.selectionPath.length > 1) {
      ctx.beginPath();
      ctx.moveTo(petIdGenerator.selectionPath[0].x, petIdGenerator.selectionPath[0].y);
      for (let i = 1; i < petIdGenerator.selectionPath.length; i++) {
        ctx.lineTo(petIdGenerator.selectionPath[i].x, petIdGenerator.selectionPath[i].y);
      }
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  }

  static drawBrushStroke(x, y, canvas, petIdGenerator) {
    const ctx = canvas.getContext('2d');
    
    ctx.globalCompositeOperation = petIdGenerator.currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.fillStyle = petIdGenerator.currentOperation === 'subtract' ? 'rgba(255,0,0,0.5)' : 'rgba(0,123,255,0.5)';
    
    ctx.beginPath();
    ctx.arc(x, y, petIdGenerator.brushSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.globalCompositeOperation = 'source-over';
  }

  static performMagicWandSelection(x, y, canvas, petIdGenerator) {
    const processedCanvas = document.getElementById('processedCanvas');
    const processedCtx = processedCanvas.getContext('2d');
    
    try {
      const imageData = processedCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
      const selectionMask = SelectionEvents.magicWandSelect(imageData, Math.floor(x), Math.floor(y), petIdGenerator.tolerance);
      
      SelectionEvents.applySelectionOperation(selectionMask, petIdGenerator);
      SelectionTools.updateSelectionPreview(petIdGenerator);
    } catch (error) {
      console.error('Magic wand selection failed:', error);
    }
  }

  static magicWandSelect(imageData, startX, startY, tolerance) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const visited = new Array(width * height).fill(false);
    const mask = new ImageData(width, height);
    
    if (startX < 0 || startY < 0 || startX >= width || startY >= height) {
      return mask;
    }
    
    const startIdx = (startY * width + startX) * 4;
    const targetColor = {
      r: data[startIdx],
      g: data[startIdx + 1],
      b: data[startIdx + 2]
    };
    
    const queue = [{ x: startX, y: startY }];
    
    while (queue.length > 0) {
      const { x, y } = queue.shift();
      const idx = y * width + x;
      
      if (x < 0 || y < 0 || x >= width || y >= height || visited[idx]) {
        continue;
      }
      
      const pixelIdx = idx * 4;
      const pixelColor = {
        r: data[pixelIdx],
        g: data[pixelIdx + 1],
        b: data[pixelIdx + 2]
      };
      
      if (ImageHandler.colorDistance(targetColor.r, targetColor.g, targetColor.b, 
                   pixelColor.r, pixelColor.g, pixelColor.b) <= tolerance) {
        visited[idx] = true;
        mask.data[pixelIdx + 3] = 255; // Mark as selected
        
        // Add neighbors to queue
        queue.push({ x: x + 1, y });
        queue.push({ x: x - 1, y });
        queue.push({ x, y: y + 1 });
        queue.push({ x, y: y - 1 });
      }
    }
    
    return mask;
  }

  static finalizeShapeSelection(canvas, petIdGenerator) {
    if (!petIdGenerator.currentShape) return;
    
    const mask = new ImageData(canvas.width, canvas.height);
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = canvas.width;
    ctx.canvas.height = canvas.height;
    
    ctx.fillStyle = 'white';
    
    if (petIdGenerator.currentTool === 'rectangle') {
      const { startX, startY, endX, endY } = petIdGenerator.currentShape;
      const width = endX - startX;
      const height = endY - startY;
      ctx.fillRect(startX, startY, width, height);
    } else if (petIdGenerator.currentTool === 'ellipse') {
      const { startX, startY, endX, endY } = petIdGenerator.currentShape;
      const centerX = (startX + endX) / 2;
      const centerY = (startY + endY) / 2;
      const radiusX = Math.abs(endX - startX) / 2;
      const radiusY = Math.abs(endY - startY) / 2;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    const tempMask = ctx.getImageData(0, 0, canvas.width, canvas.height);
    SelectionEvents.applySelectionOperation(tempMask, petIdGenerator);
  }

  static finalizeLassoSelection(canvas, petIdGenerator) {
    if (petIdGenerator.selectionPath.length < 3) return;
    
    const mask = new ImageData(canvas.width, canvas.height);
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = canvas.width;
    ctx.canvas.height = canvas.height;
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(petIdGenerator.selectionPath[0].x, petIdGenerator.selectionPath[0].y);
    for (let i = 1; i < petIdGenerator.selectionPath.length; i++) {
      ctx.lineTo(petIdGenerator.selectionPath[i].x, petIdGenerator.selectionPath[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    const tempMask = ctx.getImageData(0, 0, canvas.width, canvas.height);
    SelectionEvents.applySelectionOperation(tempMask, petIdGenerator);
  }

  static finalizeBrushSelection(canvas, petIdGenerator) {
    // Brush selection is applied in real-time, so just apply the operation
    const ctx = canvas.getContext('2d');
    const tempMask = ctx.getImageData(0, 0, canvas.width, canvas.height);
    SelectionEvents.applySelectionOperation(tempMask, petIdGenerator);
  }

  static applySelectionOperation(newMask, petIdGenerator) {
    if (!petIdGenerator.selectionMask) {
      petIdGenerator.selectionMask = new ImageData(newMask.width, newMask.height);
    }
    
    const existing = petIdGenerator.selectionMask.data;
    const incoming = newMask.data;
    
    for (let i = 0; i < existing.length; i += 4) {
      const existingAlpha = existing[i + 3];
      const incomingAlpha = incoming[i + 3];
      
      switch (petIdGenerator.currentOperation) {
        case 'add':
          existing[i + 3] = Math.max(existingAlpha, incomingAlpha);
          break;
        case 'subtract':
          existing[i + 3] = existingAlpha > 0 && incomingAlpha > 0 ? 0 : existingAlpha;
          break;
        case 'intersect':
          existing[i + 3] = existingAlpha > 0 && incomingAlpha > 0 ? 255 : 0;
          break;
        case 'replace':
          existing[i + 3] = incomingAlpha;
          break;
      }
      
      // Set RGB channels for visual feedback
      if (existing[i + 3] > 0) {
        existing[i] = 255;
        existing[i + 1] = 255;
        existing[i + 2] = 255;
      }
    }
  }
}
