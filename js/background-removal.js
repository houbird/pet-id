// Background removal algorithms
class BackgroundRemoval {
  static applyBackgroundRemoval(petIdGenerator) {
    switch (petIdGenerator.currentAlgorithm) {
      case 'corner':
        BackgroundRemoval.removeBackgroundCorner(petIdGenerator);
        break;
      case 'edge':
        BackgroundRemoval.removeBackgroundEdge(petIdGenerator);
        break;
      case 'chroma':
        BackgroundRemoval.removeBackgroundChroma(petIdGenerator);
        break;
      case 'smart':
        BackgroundRemoval.removeBackgroundSmart(petIdGenerator);
        break;
      case 'custom':
        BackgroundRemoval.removeBackgroundCustom(petIdGenerator);
        break;
    }
    
    // Show processed image and form
    document.getElementById('processedImageContainer').classList.remove('hidden');
    document.getElementById('petInfoForm').classList.remove('hidden');
  }

  static retryBackgroundRemoval(petIdGenerator) {
    // Clear current processed image
    const canvas = document.getElementById('processedCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Clear selection if in custom mode
    if (petIdGenerator.currentAlgorithm === 'custom') {
      SelectionTools.clearSelection(petIdGenerator);
    }
    
    // Re-draw original image
    ImageHandler.drawOriginalImageToCanvas(petIdGenerator);
  }

  static removeBackgroundCorner(petIdGenerator) {
    ImageHandler.drawOriginalImageToCanvas(petIdGenerator);
    const canvas = document.getElementById('processedCanvas');
    const ctx = canvas.getContext('2d');
    
    // Get image data for processing
    let imageData, data;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      data = imageData.data;
    } catch (error) {
      petIdGenerator.showError('圖片處理失敗，請嘗試其他圖片');
      console.error('getImageData error:', error);
      return;
    }
    
    // Simple background removal algorithm - remove pixels similar to corner colors
    const cornerSamples = [
      ImageHandler.getPixelColor(data, 0, 0, canvas.width),
      ImageHandler.getPixelColor(data, Math.max(0, canvas.width - 1), 0, canvas.width),
      ImageHandler.getPixelColor(data, 0, Math.max(0, canvas.height - 1), canvas.width),
      ImageHandler.getPixelColor(data, Math.max(0, canvas.width - 1), Math.max(0, canvas.height - 1), canvas.width)
    ].filter(sample => sample !== null);
      
    const threshold = 50;
    
    if (cornerSamples.length === 0) {
      console.warn('No valid corner samples found, skipping background removal');
    } else {
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        let isBackground = false;
        for (const corner of cornerSamples) {
          if (ImageHandler.colorDistance(r, g, b, corner.r, corner.g, corner.b) < threshold) {
            isBackground = true;
            break;
          }
        }
        
        if (isBackground) {
          data[i + 3] = 0; // Make transparent
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    petIdGenerator.processedImageData = canvas.toDataURL('image/png');
  }

  static removeBackgroundEdge(petIdGenerator) {
    ImageHandler.drawOriginalImageToCanvas(petIdGenerator);
    const canvas = document.getElementById('processedCanvas');
    const ctx = canvas.getContext('2d');
    
    let imageData, data;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      data = imageData.data;
    } catch (error) {
      petIdGenerator.showError('圖片處理失敗，請嘗試其他圖片');
      return;
    }

    // Edge detection based background removal
    const edges = BackgroundRemoval.detectEdges(data, canvas.width, canvas.height);
    const mask = BackgroundRemoval.floodFillFromEdges(edges, canvas.width, canvas.height);
    
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = Math.floor(i / 4);
      if (mask[pixelIndex]) {
        data[i + 3] = 0; // Make background transparent
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    petIdGenerator.processedImageData = canvas.toDataURL('image/png');
  }

  static removeBackgroundChroma(petIdGenerator) {
    ImageHandler.drawOriginalImageToCanvas(petIdGenerator);
    const canvas = document.getElementById('processedCanvas');
    const ctx = canvas.getContext('2d');
    
    let imageData, data;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      data = imageData.data;
    } catch (error) {
      petIdGenerator.showError('圖片處理失敗，請嘗試其他圖片');
      return;
    }

    // Chroma key style removal - find dominant background color
    const colorHistogram = BackgroundRemoval.getColorHistogram(data);
    const dominantColor = BackgroundRemoval.getDominantColor(colorHistogram);
    const threshold = 80;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (ImageHandler.colorDistance(r, g, b, dominantColor.r, dominantColor.g, dominantColor.b) < threshold) {
        data[i + 3] = 0; // Make transparent
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    petIdGenerator.processedImageData = canvas.toDataURL('image/png');
  }

  static removeBackgroundSmart(petIdGenerator) {
    ImageHandler.drawOriginalImageToCanvas(petIdGenerator);
    const canvas = document.getElementById('processedCanvas');
    const ctx = canvas.getContext('2d');
    
    let imageData, data;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      data = imageData.data;
    } catch (error) {
      petIdGenerator.showError('圖片處理失敗，請嘗試其他圖片');
      return;
    }

    // Smart removal combining multiple techniques
    const edges = BackgroundRemoval.detectEdges(data, canvas.width, canvas.height);
    const colorHistogram = BackgroundRemoval.getColorHistogram(data);
    const dominantColor = BackgroundRemoval.getDominantColor(colorHistogram);
    
    // Use a combination of edge detection and color similarity
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = Math.floor(i / 4);
      const x = pixelIndex % canvas.width;
      const y = Math.floor(pixelIndex / canvas.width);
      
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Check if pixel is on edge or similar to dominant background color
      const isEdge = edges[pixelIndex];
      const colorSimilarity = ImageHandler.colorDistance(r, g, b, dominantColor.r, dominantColor.g, dominantColor.b);
      const isNearBorder = x < 10 || y < 10 || x > canvas.width - 10 || y > canvas.height - 10;
      
      if (!isEdge && (colorSimilarity < 60 || (isNearBorder && colorSimilarity < 100))) {
        data[i + 3] = 0; // Make transparent
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    petIdGenerator.processedImageData = canvas.toDataURL('image/png');
  }

  static removeBackgroundCustom(petIdGenerator) {
    ImageHandler.drawOriginalImageToCanvas(petIdGenerator);
    const canvas = document.getElementById('processedCanvas');
    const selectionCanvas = document.getElementById('selectionCanvas');
    const ctx = canvas.getContext('2d');
    const selectionCtx = selectionCanvas.getContext('2d');
    
    let imageData, data;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      data = imageData.data;
    } catch (error) {
      petIdGenerator.showError('圖片處理失敗，請嘗試其他圖片');
      return;
    }

    // Get selection mask from selection canvas
    const selectionData = selectionCtx.getImageData(0, 0, selectionCanvas.width, selectionCanvas.height);
    const selectionPixels = selectionData.data;
    
    // Check if user has made any selection
    let hasSelection = false;
    for (let i = 3; i < selectionPixels.length; i += 4) {
      if (selectionPixels[i] > 0) {
        hasSelection = true;
        break;
      }
    }
    
    if (!hasSelection) {
      petIdGenerator.showError('請先使用選取工具標記要保留的區域');
      return;
    }

    // Apply custom selection mask
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = Math.floor(i / 4);
      const selectionAlpha = selectionPixels[pixelIndex * 4 + 3];
      
      // If pixel is not in selected area (no green overlay), make it transparent
      if (selectionAlpha === 0) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
      }
    }
    
    // Apply the modified image data back to canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Store the processed image
    petIdGenerator.processedImageData = canvas.toDataURL('image/png');
    
    // Clear selection after processing
    SelectionTools.clearSelection(petIdGenerator);
  }

  // Helper methods for advanced algorithms
  static detectEdges(data, width, height) {
    const edges = new Array(width * height).fill(false);
    const threshold = 50;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const current = { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
        
        // Check surrounding pixels
        const neighbors = [
          { x: x - 1, y: y },
          { x: x + 1, y: y },
          { x: x, y: y - 1 },
          { x: x, y: y + 1 }
        ];
        
        let maxDiff = 0;
        for (const neighbor of neighbors) {
          const nIdx = (neighbor.y * width + neighbor.x) * 4;
          const neighborColor = { r: data[nIdx], g: data[nIdx + 1], b: data[nIdx + 2] };
          const diff = ImageHandler.colorDistance(current.r, current.g, current.b, neighborColor.r, neighborColor.g, neighborColor.b);
          maxDiff = Math.max(maxDiff, diff);
        }
        
        edges[y * width + x] = maxDiff > threshold;
      }
    }
    
    return edges;
  }

  static floodFillFromEdges(edges, width, height) {
    const mask = new Array(width * height).fill(false);
    const visited = new Array(width * height).fill(false);
    
    // Start flood fill from edges of image
    const queue = [];
    
    // Add border pixels to queue
    for (let x = 0; x < width; x++) {
      queue.push({ x, y: 0 });
      queue.push({ x, y: height - 1 });
    }
    for (let y = 0; y < height; y++) {
      queue.push({ x: 0, y });
      queue.push({ x: width - 1, y });
    }
    
    while (queue.length > 0) {
      const { x, y } = queue.shift();
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited[idx] || edges[idx]) {
        continue;
      }
      
      visited[idx] = true;
      mask[idx] = true;
      
      // Add neighbors to queue
      queue.push({ x: x - 1, y });
      queue.push({ x: x + 1, y });
      queue.push({ x, y: y - 1 });
      queue.push({ x, y: y + 1 });
    }
    
    return mask;
  }

  static getColorHistogram(data) {
    const histogram = {};
    
    for (let i = 0; i < data.length; i += 4) {
      const r = Math.floor(data[i] / 16) * 16;
      const g = Math.floor(data[i + 1] / 16) * 16;
      const b = Math.floor(data[i + 2] / 16) * 16;
      
      const key = `${r},${g},${b}`;
      histogram[key] = (histogram[key] || 0) + 1;
    }
    
    return histogram;
  }

  static getDominantColor(histogram) {
    let maxCount = 0;
    let dominantColor = { r: 255, g: 255, b: 255 };
    
    for (const [key, count] of Object.entries(histogram)) {
      if (count > maxCount) {
        maxCount = count;
        const [r, g, b] = key.split(',').map(Number);
        dominantColor = { r, g, b };
      }
    }
    
    return dominantColor;
  }
}
