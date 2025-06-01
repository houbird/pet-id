class PetIdGenerator {
  constructor() {
    this.originalImage = null;
    this.processedImageData = null;
    this.currentAlgorithm = 'corner';
    this.isCustomSelecting = false;
    this.selectionPath = [];
    this.isDrawing = false;
    
    // Advanced selection properties
    this.currentTool = 'rectangle'; // 'rectangle', 'ellipse', 'lasso', 'magicWand', 'brush', 'eraser'
    this.currentOperation = 'add'; // 'add', 'subtract', 'intersect', 'replace'
    this.brushSize = 10;
    this.tolerance = 20;
    this.featherAmount = 0;
    this.selectionMask = null;
    this.previewSelection = null;
    this.selectionHistory = [];
    this.isSelecting = false;
    this.startPoint = null;
    this.currentShape = null;
    
    this.initializeEventListeners();
  }  initializeEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const generateIdBtn = document.getElementById('generateIdBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const algorithmSelect = document.getElementById('algorithmSelect');
    const applyRemovalBtn = document.getElementById('applyRemovalBtn');
    const retryRemovalBtn = document.getElementById('retryRemovalBtn');
    const loadDefaultImageBtn = document.getElementById('loadDefaultImageBtn');

    // Debug: Log missing elements
    const elements = {uploadArea, imageInput, generateIdBtn, downloadBtn, algorithmSelect, applyRemovalBtn, retryRemovalBtn};
    for (const [name, el] of Object.entries(elements)) {
      if (!el) {
        console.error(`Element with id '${name}' is null`);
      }
    }

    // Upload area click and drag events
    uploadArea.addEventListener('click', () => imageInput.click());
    uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
    uploadArea.addEventListener('drop', this.handleDrop.bind(this));

    // File input change
    imageInput.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        this.handleImageUpload(e.target.files[0]);
      }
    });

    // Algorithm selection
    algorithmSelect.addEventListener('change', (e) => {
      this.currentAlgorithm = e.target.value;
      this.toggleCustomSelectionTools();
    });

    // Background removal
    applyRemovalBtn.addEventListener('click', this.applyBackgroundRemoval.bind(this));
    retryRemovalBtn.addEventListener('click', this.retryBackgroundRemoval.bind(this));

    // Selection tool buttons
    this.initializeSelectionTools();

    // Generate ID card
    generateIdBtn.addEventListener('click', this.generateIdCard.bind(this));

    // Download button
    downloadBtn.addEventListener('click', this.downloadIdCard.bind(this));

    // 預設照片按鈕事件
    if (loadDefaultImageBtn) {
      loadDefaultImageBtn.addEventListener('click', () => this.loadDefaultImage());
    }
  }

  initializeSelectionTools() {
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
        button.addEventListener('click', () => this.setSelectionTool(tool));
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
        button.addEventListener('click', () => this.setSelectionOperation(operation));
      }
    });

    // Command buttons
    const commands = {
      'selectAllBtn': this.selectAll.bind(this),
      'deselectAllBtn': this.deselectAll.bind(this),
      'invertSelectionBtn': this.invertSelection.bind(this),
      'expandSelectionBtn': () => this.modifySelection('expand'),
      'contractSelectionBtn': () => this.modifySelection('contract'),
      'smoothSelectionBtn': () => this.modifySelection('smooth')
    };

    Object.entries(commands).forEach(([buttonId, handler]) => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener('click', handler);
      }
    });

    // Slider controls
    this.initializeSliders();
  }

  initializeSliders() {
    // Brush size slider
    const brushSizeSlider = document.getElementById('brushSizeSlider');
    const brushSizeValue = document.getElementById('brushSizeValue');
    if (brushSizeSlider && brushSizeValue) {
      brushSizeSlider.addEventListener('input', (e) => {
        this.brushSize = parseInt(e.target.value);
        brushSizeValue.textContent = this.brushSize;
        this.updateCursorSize();
      });
    }

    // Tolerance slider for magic wand
    const toleranceSlider = document.getElementById('toleranceSlider');
    const toleranceValue = document.getElementById('toleranceValue');
    if (toleranceSlider && toleranceValue) {
      toleranceSlider.addEventListener('input', (e) => {
        this.tolerance = parseInt(e.target.value);
        toleranceValue.textContent = this.tolerance;
      });
    }

    // Feather slider
    const featherSlider = document.getElementById('featherSlider');
    const featherValue = document.getElementById('featherValue');
    if (featherSlider && featherValue) {
      featherSlider.addEventListener('input', (e) => {
        this.featherAmount = parseInt(e.target.value);
        featherValue.textContent = this.featherAmount;
        this.updateSelectionPreview();
      });
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && this.isValidImageFile(files[0])) {
      this.handleImageUpload(files[0]);
    }
  }

  isValidImageFile(file) {
    return file.type === 'image/jpeg' || file.type === 'image/png';
  }  handleImageUpload(file) {
    if (!this.isValidImageFile(file)) {
      this.showError('請上傳 JPG 或 PNG 格式的圖片');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showError('圖片檔案太大，請選擇小於 10MB 的圖片');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.originalImage = new Image();
      this.originalImage.onload = () => {
        this.displayOriginalImage(e.target.result);
        this.processImage();
      };
      this.originalImage.onerror = () => {
        this.showError('圖片載入失敗，請嘗試其他圖片');
      };
      this.originalImage.src = e.target.result;
    };
    reader.onerror = () => {
      this.showError('檔案讀取失敗，請重新嘗試');
    };
    reader.readAsDataURL(file);
  }  displayOriginalImage(src) {
    const originalImageContainer = document.getElementById('originalImageContainer');
    const originalImage = document.getElementById('originalImage');
    
    originalImage.src = src;
    originalImageContainer.classList.remove('hidden');
    
    // Show background removal options
    document.getElementById('backgroundRemovalOptions').classList.remove('hidden');
  }  async processImage() {
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    // Show progress
    progressContainer.classList.remove('hidden');
    
    // Simulate processing with progress updates
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      progressBar.style.width = `${i}%`;
      progressText.textContent = `${i}%`;
    }

    // Hide progress
    setTimeout(() => {
      progressContainer.classList.add('hidden');
    }, 500);
  }  toggleCustomSelectionTools() {
    // Validate coordinates
    if (x < 0 || y < 0 || !data || width <= 0) {
      return null;
    }
    
    const index = (y * width + x) * 4;
    
    // Check if index is within data bounds
    if (index + 3 >= data.length || index < 0) {
      return null;
    }
    
    return {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2]
    };
  }  colorDistance(r1, g1, b1, r2, g2, b2) {
    return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
  }

  toggleCustomSelectionTools() {
    const customTools = document.getElementById('customSelectionTools');
    const selectionCanvas = document.getElementById('selectionCanvas');
    
    if (this.currentAlgorithm === 'custom') {
      customTools.classList.remove('hidden');
      this.setupCustomSelection();
    } else {
      customTools.classList.add('hidden');
      selectionCanvas.classList.add('hidden');
      this.isCustomSelecting = false;
    }
  }  setupCustomSelection() {
    const processedCanvas = document.getElementById('processedCanvas');
    const selectionCanvas = document.getElementById('selectionCanvas');
    
    // Make sure selection canvas matches processed canvas size
    selectionCanvas.width = processedCanvas.width;
    selectionCanvas.height = processedCanvas.height;
    selectionCanvas.classList.remove('hidden');
    
    // Initialize selection mask if not exists
    if (!this.selectionMask) {
      this.selectionMask = new ImageData(selectionCanvas.width, selectionCanvas.height);
    }
    
    // Add event listeners for advanced selection
    this.addAdvancedSelectionListeners(selectionCanvas);
    
    // Set initial tool and update UI
    this.setSelectionTool('rectangle');
    this.setSelectionOperation('add');
  }

  addAdvancedSelectionListeners(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Mouse events
    canvas.addEventListener('mousedown', (e) => this.handleSelectionStart(e, canvas));
    canvas.addEventListener('mousemove', (e) => this.handleSelectionMove(e, canvas));
    canvas.addEventListener('mouseup', (e) => this.handleSelectionEnd(e, canvas));
    canvas.addEventListener('mouseleave', (e) => this.handleSelectionEnd(e, canvas));
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.handleSelectionStart(mouseEvent, canvas);
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.handleSelectionMove(mouseEvent, canvas);
    });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      this.handleSelectionEnd(mouseEvent, canvas);
    });
  }

  handleSelectionStart(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    this.isSelecting = true;
    this.startPoint = { x, y };
    
    switch (this.currentTool) {
      case 'rectangle':
      case 'ellipse':
        this.startShapeSelection(x, y);
        break;
      case 'lasso':
        this.startLassoSelection(x, y);
        break;
      case 'magicWand':
        this.performMagicWandSelection(x, y, canvas);
        break;
      case 'brush':
      case 'eraser':
        this.startBrushSelection(x, y, canvas);
        break;
    }
  }

  handleSelectionMove(e, canvas) {
    if (!this.isSelecting) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    switch (this.currentTool) {
      case 'rectangle':
        this.updateRectangleSelection(x, y, canvas);
        break;
      case 'ellipse':
        this.updateEllipseSelection(x, y, canvas);
        break;
      case 'lasso':
        this.updateLassoSelection(x, y, canvas);
        break;
      case 'brush':
      case 'eraser':
        this.updateBrushSelection(x, y, canvas);
        break;
    }
  }

  handleSelectionEnd(e, canvas) {
    if (!this.isSelecting) return;
    
    this.isSelecting = false;
    
    switch (this.currentTool) {
      case 'rectangle':
      case 'ellipse':
        this.finalizeShapeSelection(canvas);
        break;
      case 'lasso':
        this.finalizeLassoSelection(canvas);
        break;
      case 'brush':
      case 'eraser':
        this.finalizeBrushSelection(canvas);
        break;
    }
    
    this.startPoint = null;
    this.currentShape = null;
    this.updateSelectionPreview();
    this.saveSelectionToHistory();
  }

  startShapeSelection(x, y) {
    this.currentShape = {
      startX: x,
      startY: y,
      endX: x,
      endY: y
    };
  }

  updateRectangleSelection(x, y, canvas) {
    if (!this.currentShape) return;
    
    this.currentShape.endX = x;
    this.currentShape.endY = y;
    
    // Draw preview
    this.drawSelectionPreview(canvas);
  }

  updateEllipseSelection(x, y, canvas) {
    if (!this.currentShape) return;
    
    this.currentShape.endX = x;
    this.currentShape.endY = y;
    
    // Draw preview
    this.drawSelectionPreview(canvas);
  }

  startLassoSelection(x, y) {
    this.selectionPath = [{ x, y }];
  }

  updateLassoSelection(x, y, canvas) {
    this.selectionPath.push({ x, y });
    this.drawSelectionPreview(canvas);
  }

  startBrushSelection(x, y, canvas) {
    this.selectionPath = [{ x, y }];
    this.drawBrushStroke(x, y, canvas);
  }

  updateBrushSelection(x, y, canvas) {
    this.selectionPath.push({ x, y });
    this.drawBrushStroke(x, y, canvas);
  }

  drawSelectionPreview(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw existing selection if any
    if (this.selectionMask) {
      ctx.putImageData(this.selectionMask, 0, 0);
    }
    
    // Draw current tool preview
    ctx.strokeStyle = '#007bff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    
    if (this.currentTool === 'rectangle' && this.currentShape) {
      const { startX, startY, endX, endY } = this.currentShape;
      const width = endX - startX;
      const height = endY - startY;
      ctx.strokeRect(startX, startY, width, height);
    } else if (this.currentTool === 'ellipse' && this.currentShape) {
      const { startX, startY, endX, endY } = this.currentShape;
      const centerX = (startX + endX) / 2;
      const centerY = (startY + endY) / 2;
      const radiusX = Math.abs(endX - startX) / 2;
      const radiusY = Math.abs(endY - startY) / 2;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (this.currentTool === 'lasso' && this.selectionPath.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.selectionPath[0].x, this.selectionPath[0].y);
      for (let i = 1; i < this.selectionPath.length; i++) {
        ctx.lineTo(this.selectionPath[i].x, this.selectionPath[i].y);
      }
      ctx.stroke();
    }
    
    ctx.setLineDash([]);
  }

  drawBrushStroke(x, y, canvas) {
    const ctx = canvas.getContext('2d');
    
    ctx.globalCompositeOperation = this.currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.fillStyle = this.currentOperation === 'subtract' ? 'rgba(255,0,0,0.5)' : 'rgba(0,123,255,0.5)';
    
    ctx.beginPath();
    ctx.arc(x, y, this.brushSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.globalCompositeOperation = 'source-over';
  }

  performMagicWandSelection(x, y, canvas) {
    const processedCanvas = document.getElementById('processedCanvas');
    const processedCtx = processedCanvas.getContext('2d');
    
    try {
      const imageData = processedCtx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
      const selectionMask = this.magicWandSelect(imageData, Math.floor(x), Math.floor(y), this.tolerance);
      
      this.applySelectionOperation(selectionMask);
      this.updateSelectionPreview();
    } catch (error) {
      console.error('Magic wand selection failed:', error);
    }
  }

  magicWandSelect(imageData, startX, startY, tolerance) {
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
      
      if (this.colorDistance(targetColor.r, targetColor.g, targetColor.b, 
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

  finalizeShapeSelection(canvas) {
    if (!this.currentShape) return;
    
    const mask = new ImageData(canvas.width, canvas.height);
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = canvas.width;
    ctx.canvas.height = canvas.height;
    
    ctx.fillStyle = 'white';
    
    if (this.currentTool === 'rectangle') {
      const { startX, startY, endX, endY } = this.currentShape;
      const width = endX - startX;
      const height = endY - startY;
      ctx.fillRect(startX, startY, width, height);
    } else if (this.currentTool === 'ellipse') {
      const { startX, startY, endX, endY } = this.currentShape;
      const centerX = (startX + endX) / 2;
      const centerY = (startY + endY) / 2;
      const radiusX = Math.abs(endX - startX) / 2;
      const radiusY = Math.abs(endY - startY) / 2;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
    
    const tempMask = ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.applySelectionOperation(tempMask);
  }

  finalizeLassoSelection(canvas) {
    if (this.selectionPath.length < 3) return;
    
    const mask = new ImageData(canvas.width, canvas.height);
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.canvas.width = canvas.width;
    ctx.canvas.height = canvas.height;
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(this.selectionPath[0].x, this.selectionPath[0].y);
    for (let i = 1; i < this.selectionPath.length; i++) {
      ctx.lineTo(this.selectionPath[i].x, this.selectionPath[i].y);
    }
    ctx.closePath();
    ctx.fill();
    
    const tempMask = ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.applySelectionOperation(tempMask);
  }

  finalizeBrushSelection(canvas) {
    // Brush selection is applied in real-time, so just apply the operation
    const ctx = canvas.getContext('2d');
    const tempMask = ctx.getImageData(0, 0, canvas.width, canvas.height);
    this.applySelectionOperation(tempMask);
  }

  applySelectionOperation(newMask) {
    if (!this.selectionMask) {
      this.selectionMask = new ImageData(newMask.width, newMask.height);
    }
    
    const existing = this.selectionMask.data;
    const incoming = newMask.data;
    
    for (let i = 0; i < existing.length; i += 4) {
      const existingAlpha = existing[i + 3];
      const incomingAlpha = incoming[i + 3];
      
      switch (this.currentOperation) {
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
        existing[i] = 255;        existing[i + 1] = 255;
        existing[i + 2] = 255;
      }
    }
  }

  applyBackgroundRemoval() {
    switch (this.currentAlgorithm) {
      case 'corner':
        this.removeBackgroundCorner();
        break;
      case 'edge':
        this.removeBackgroundEdge();
        break;
      case 'chroma':
        this.removeBackgroundChroma();
        break;
      case 'smart':
        this.removeBackgroundSmart();
        break;
      case 'custom':
        this.removeBackgroundCustom();
        break;
    }
    
    // Show processed image and form
    document.getElementById('processedImageContainer').classList.remove('hidden');
    document.getElementById('petInfoForm').classList.remove('hidden');
  }

  retryBackgroundRemoval() {
    // Clear current processed image
    const canvas = document.getElementById('processedCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Clear selection if in custom mode
    if (this.currentAlgorithm === 'custom') {
      this.clearCustomSelection();
    }
    
    // Re-draw original image
    this.drawOriginalImageToCanvas();
  }

  drawOriginalImageToCanvas() {
    const canvas = document.getElementById('processedCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match container with fallback
    const containerWidth = canvas.parentElement.clientWidth || 400;
    const canvasWidth = Math.max(containerWidth, 300);
    canvas.width = canvasWidth;
    canvas.height = 256;

    if (canvas.width === 0 || canvas.height === 0) {
      canvas.width = 400;
      canvas.height = 256;
    }

    if (!this.originalImage || !this.originalImage.complete) {
      this.showError('圖片尚未載入完成，請稍後再試');
      return;
    }

    // Calculate scaling to fit image in canvas while maintaining aspect ratio
    const scale = Math.min(canvas.width / this.originalImage.width, canvas.height / this.originalImage.height);
    const scaledWidth = this.originalImage.width * scale;
    const scaledHeight = this.originalImage.height * scale;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;

    // Clear canvas and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.originalImage, x, y, scaledWidth, scaledHeight);
  }

  removeBackgroundCorner() {
    this.drawOriginalImageToCanvas();
    const canvas = document.getElementById('processedCanvas');
    const ctx = canvas.getContext('2d');
    
    // Get image data for processing
    let imageData, data;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      data = imageData.data;
    } catch (error) {
      this.showError('圖片處理失敗，請嘗試其他圖片');
      console.error('getImageData error:', error);
      return;
    }
    
    // Simple background removal algorithm - remove pixels similar to corner colors
    const cornerSamples = [
      this.getPixelColor(data, 0, 0, canvas.width),
      this.getPixelColor(data, Math.max(0, canvas.width - 1), 0, canvas.width),
      this.getPixelColor(data, 0, Math.max(0, canvas.height - 1), canvas.width),
      this.getPixelColor(data, Math.max(0, canvas.width - 1), Math.max(0, canvas.height - 1), canvas.width)
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
          if (this.colorDistance(r, g, b, corner.r, corner.g, corner.b) < threshold) {
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
    this.processedImageData = canvas.toDataURL('image/png');
  }

  removeBackgroundEdge() {
    this.drawOriginalImageToCanvas();
    const canvas = document.getElementById('processedCanvas');
    const ctx = canvas.getContext('2d');
    
    let imageData, data;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      data = imageData.data;
    } catch (error) {
      this.showError('圖片處理失敗，請嘗試其他圖片');
      return;
    }

    // Edge detection based background removal
    const edges = this.detectEdges(data, canvas.width, canvas.height);
    const mask = this.floodFillFromEdges(edges, canvas.width, canvas.height);
    
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = Math.floor(i / 4);
      if (mask[pixelIndex]) {
        data[i + 3] = 0; // Make background transparent
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    this.processedImageData = canvas.toDataURL('image/png');
  }

  removeBackgroundChroma() {
    this.drawOriginalImageToCanvas();
    const canvas = document.getElementById('processedCanvas');
    const ctx = canvas.getContext('2d');
    
    let imageData, data;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      data = imageData.data;
    } catch (error) {
      this.showError('圖片處理失敗，請嘗試其他圖片');
      return;
    }

    // Chroma key style removal - find dominant background color
    const colorHistogram = this.getColorHistogram(data);
    const dominantColor = this.getDominantColor(colorHistogram);
    const threshold = 80;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (this.colorDistance(r, g, b, dominantColor.r, dominantColor.g, dominantColor.b) < threshold) {
        data[i + 3] = 0; // Make transparent
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    this.processedImageData = canvas.toDataURL('image/png');
  }

  removeBackgroundSmart() {
    this.drawOriginalImageToCanvas();
    const canvas = document.getElementById('processedCanvas');
    const ctx = canvas.getContext('2d');
    
    let imageData, data;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      data = imageData.data;
    } catch (error) {
      this.showError('圖片處理失敗，請嘗試其他圖片');
      return;
    }

    // Smart removal combining multiple techniques
    const edges = this.detectEdges(data, canvas.width, canvas.height);
    const colorHistogram = this.getColorHistogram(data);
    const dominantColor = this.getDominantColor(colorHistogram);
    
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
      const colorSimilarity = this.colorDistance(r, g, b, dominantColor.r, dominantColor.g, dominantColor.b);
      const isNearBorder = x < 10 || y < 10 || x > canvas.width - 10 || y > canvas.height - 10;
      
      if (!isEdge && (colorSimilarity < 60 || (isNearBorder && colorSimilarity < 100))) {
        data[i + 3] = 0; // Make transparent
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    this.processedImageData = canvas.toDataURL('image/png');
  }  removeBackgroundCustom() {
    this.drawOriginalImageToCanvas();
    const canvas = document.getElementById('processedCanvas');
    const selectionCanvas = document.getElementById('selectionCanvas');
    const ctx = canvas.getContext('2d');
    const selectionCtx = selectionCanvas.getContext('2d');
    
    let imageData, data;
    try {
      imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      data = imageData.data;
    } catch (error) {
      this.showError('圖片處理失敗，請嘗試其他圖片');
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
      this.showError('請先使用選取工具標記要保留的區域');
      return;
    }    // Apply custom selection mask
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
    this.processedImageData = canvas.toDataURL('image/png');
    
    // Clear selection after processing
    this.clearSelection();
  }

  // Helper methods for advanced algorithms
  detectEdges(data, width, height) {
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
          const diff = this.colorDistance(current.r, current.g, current.b, neighborColor.r, neighborColor.g, neighborColor.b);
          maxDiff = Math.max(maxDiff, diff);
        }
        
        edges[y * width + x] = maxDiff > threshold;
      }
    }
    
    return edges;
  }

  floodFillFromEdges(edges, width, height) {
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

  getColorHistogram(data) {
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

  getDominantColor(histogram) {
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
  }generateIdCard() {
    const petName = document.getElementById('petName').value.trim();
    const petGender = document.getElementById('petGender').value;
    const petBirthday = document.getElementById('petBirthday').value;
    const petBreed = document.getElementById('petBreed').value.trim();
    const petAddress = document.getElementById('petAddress').value.trim();

    if (!petName) {
      this.showError('請填寫寵物姓名');
      return;
    }

    if (!petBirthday) {
      this.showError('請選擇寵物生日');
      return;
    }

    if (!this.processedImageData) {
      this.showError('請先上傳並處理寵物照片');
      return;
    }

    this.createIdCard(petName, petGender, petBirthday, petBreed, petAddress);
  }

  showError(message) {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-circle mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(full)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }

  createIdCard(name, gender, birthday, breed, address) {
    const canvas = document.getElementById('idCardCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size (Taiwan ID card proportions)
    canvas.width = 600;
    canvas.height = 380;
    
    // Background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    
    // Header
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(15, 15, canvas.width - 30, 60);
    
    // Title
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial, "Microsoft JhengHei"';
    ctx.textAlign = 'center';
    ctx.fillText('可愛動物身分證', canvas.width / 2, 50);
    
    // Subtitle
    ctx.font = '14px Arial, "Microsoft JhengHei"';
    ctx.fillText('ADORIABLE PET IDENTITY CARD', canvas.width / 2, 65);
    
    // Photo area
    if (this.processedImageData) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        
        // Create rounded rectangle for photo
        const photoX = 30;
        const photoY = 90;
        const photoWidth = 120;
        const photoHeight = 150;
        
        this.roundRect(ctx, photoX, photoY, photoWidth, photoHeight, 8);
        ctx.clip();
        
        // Calculate scaling to fit photo
        const scale = Math.min(photoWidth / img.width, photoHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = photoX + (photoWidth - scaledWidth) / 2;
        const y = photoY + (photoHeight - scaledHeight) / 2;
        
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        ctx.restore();
        
        // Photo border
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        this.roundRect(ctx, photoX, photoY, photoWidth, photoHeight, 8);
        ctx.stroke();
      };
      img.src = this.processedImageData;
    }
    
    // Information section
    ctx.fillStyle = '#374151';
    ctx.font = '16px Arial, "Microsoft JhengHei"';
    ctx.textAlign = 'left';
    
    const infoStartX = 170;
    const infoStartY = 120;
    const lineHeight = 30;
    
    // Generate ID number
    const idNumber = this.generateIdNumber();
    
    const info = [
      `身分證字號: ${idNumber}`,
      `姓名: ${name}`,
      `性別: ${gender}`,
      `出生日期: ${this.formatDate(birthday)}`,
      `品種: ${breed || '混種'}`,
      `地址: ${address || '未填寫'}`
    ];
    
    info.forEach((text, index) => {
      ctx.fillText(text, infoStartX, infoStartY + (index * lineHeight));
    });
    
    // Issue date
    ctx.font = '12px Arial, "Microsoft JhengHei"';
    ctx.fillText(`發證日期: ${this.formatDate(new Date().toISOString().split('T')[0])}`, infoStartX, infoStartY + (info.length * lineHeight) + 20);
    
    // Official stamp (decorative)
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(480, 320, 40, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.fillStyle = '#dc2626';
    ctx.font = '12px Arial, "Microsoft JhengHei"';
    ctx.textAlign = 'center';
    ctx.fillText('動物', 480, 315);
    ctx.fillText('管理處', 480, 330);
    
    // Show the ID card
    document.getElementById('idCardContainer').classList.remove('hidden');
    document.getElementById('idCardPlaceholder').classList.add('hidden');
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  generateIdNumber() {
    // Generate a fake ID number for pets
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const randomNumbers = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `P${randomLetter}${randomNumbers}`;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear() - 1911; // Convert to ROC year
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  downloadIdCard() {
    const canvas = document.getElementById('idCardCanvas');
    const link = document.createElement('a');
    
    const petName = document.getElementById('petName').value || 'Pet';
    link.download = `${petName}_身分證.png`;
    link.href = canvas.toDataURL('image/png');
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  setSelectionTool(tool) {
    this.currentTool = tool;
    this.updateToolButtons();
    this.updateToolOptions();
    this.updateCanvasCursor();
    
    // Save current selection to history when switching tools
    if (this.selectionMask) {
      this.saveSelectionToHistory();
    }
  }

  setSelectionOperation(operation) {
    this.currentOperation = operation;
    this.updateOperationButtons();
  }

  updateToolButtons() {
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

    const activeButton = document.getElementById(toolMap[this.currentTool]);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  updateOperationButtons() {
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

    const activeButton = document.getElementById(operationMap[this.currentOperation]);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  updateToolOptions() {
    const options = ['brushOptions', 'magicWandOptions'];
    
    // Hide all options first
    options.forEach(optionId => {
      const option = document.getElementById(optionId);
      if (option) {
        option.classList.add('hidden');
      }
    });

    // Show relevant options
    if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
      const brushOptions = document.getElementById('brushOptions');
      if (brushOptions) {
        brushOptions.classList.remove('hidden');
      }
    }

    if (this.currentTool === 'magicWand') {
      const magicWandOptions = document.getElementById('magicWandOptions');
      if (magicWandOptions) {
        magicWandOptions.classList.remove('hidden');
      }
    }
  }

  updateCanvasCursor() {
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

    const cursorClass = cursorMap[this.currentTool];
    if (cursorClass) {
      selectionCanvas.classList.add(cursorClass);
    }
  }

  updateCursorSize() {
    if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
      // Update cursor size indicator if needed
      const indicator = document.querySelector('.brush-size-indicator');
      if (indicator) {
        indicator.style.width = `${this.brushSize}px`;
        indicator.style.height = `${this.brushSize}px`;
      }
    }
  }

  selectAll() {
    const canvas = document.getElementById('processedCanvas');
    if (!canvas) return;

    this.selectionMask = new ImageData(canvas.width, canvas.height);
    const data = this.selectionMask.data;
    
    // Fill with white (selected)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255;   // R
      data[i + 1] = 255; // G  
      data[i + 2] = 255; // B
      data[i + 3] = 255; // A
    }

    this.updateSelectionPreview();
    this.saveSelectionToHistory();
  }

  deselectAll() {
    this.selectionMask = null;
    this.updateSelectionPreview();
    this.saveSelectionToHistory();
  }

  invertSelection() {
    const canvas = document.getElementById('processedCanvas');
    if (!canvas) return;

    if (!this.selectionMask) {
      this.selectAll();
      return;
    }

    const data = this.selectionMask.data;
    for (let i = 3; i < data.length; i += 4) { // Only modify alpha channel
      data[i] = 255 - data[i];
    }

    this.updateSelectionPreview();
    this.saveSelectionToHistory();
  }

  modifySelection(type) {
    if (!this.selectionMask) return;

    const canvas = document.getElementById('processedCanvas');
    const ctx = canvas.getContext('2d');
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.putImageData(this.selectionMask, 0, 0);

    let kernelSize = 3;
    switch (type) {
      case 'expand':
        this.dilateSelection(tempCtx, kernelSize);
        break;
      case 'contract':
        this.erodeSelection(tempCtx, kernelSize);
        break;
      case 'smooth':
        this.smoothSelection(tempCtx);
        break;
    }

    this.selectionMask = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    this.updateSelectionPreview();
    this.saveSelectionToHistory();
  }

  dilateSelection(ctx, kernelSize) {
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

  erodeSelection(ctx, kernelSize) {
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

  smoothSelection(ctx) {
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

  updateSelectionPreview() {
    const selectionCanvas = document.getElementById('selectionCanvas');
    if (!selectionCanvas || !this.selectionMask) return;

    const ctx = selectionCanvas.getContext('2d');
    ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);

    // Draw selection mask with marching ants effect
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = selectionCanvas.width;
    tempCanvas.height = selectionCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.putImageData(this.selectionMask, 0, 0);

    // Apply feathering if set
    if (this.featherAmount > 0) {
      this.applyFeathering(tempCtx, this.featherAmount);
    }

    // Draw with marching ants
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = Date.now() / 100 % 8; // Animated offset

    ctx.drawImage(tempCanvas, 0, 0);
    
    // Request animation frame for marching ants
    requestAnimationFrame(() => this.updateSelectionPreview());
  }

  applyFeathering(ctx, amount) {
    // Simple feathering by applying blur
    const canvas = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply multiple passes of light blur for feathering effect
    for (let pass = 0; pass < amount; pass++) {
      this.blurImageData(imageData, 1);
    }
    
    ctx.putImageData(imageData, 0, 0);
  }

  blurImageData(imageData, radius) {
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

  saveSelectionToHistory() {
    if (this.selectionHistory.length > 10) {
      this.selectionHistory.shift(); // Remove oldest
    }
    
    if (this.selectionMask) {
      const historyEntry = new ImageData(
        new Uint8ClampedArray(this.selectionMask.data),
        this.selectionMask.width,
        this.selectionMask.height
      );
      this.selectionHistory.push(historyEntry);
    } else {
      this.selectionHistory.push(null);
    }
  }

  clearSelection() {
    const selectionCanvas = document.getElementById('selectionCanvas');
    if (selectionCanvas) {
      const ctx = selectionCanvas.getContext('2d');
      ctx.clearRect(0, 0, selectionCanvas.width, selectionCanvas.height);
    }
    
    this.selectionMask = null;
    this.selectionPath = [];
    this.previewSelection = null;
    
    // Clear visual feedback
    this.updateSelectionPreview();
  }

  // 載入預設照片
  async loadDefaultImage() {
    try {
      const response = await fetch('images/dago_m.png');
      const blob = await response.blob();
      // 轉成 File 物件（模擬上傳）
      const file = new File([blob], 'dago_m.png', { type: blob.type });
      this.handleImageUpload(file);
    } catch (err) {
      this.showError('預設照片載入失敗');
    }
  }
}

function init() {
  // 自動將 petBirthday 設為今天日期
  petBirthday.value = new Date().toISOString().split('T')[0];
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new PetIdGenerator();
  init();
});
