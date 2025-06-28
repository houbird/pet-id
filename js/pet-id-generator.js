// Pet ID Generator - Main application class
class PetIdGenerator {
  constructor() {
    this.originalImage = null;
    this.processedImageData = null;
    this.currentAlgorithm = 'corner';
    this.isCustomSelecting = false;
    this.selectionPath = [];
    this.isDrawing = false;
    
    // Advanced selection properties
    this.currentTool = 'rectangle';
    this.currentOperation = 'add';
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
  }

  initializeEventListeners() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const generateIdBtn = document.getElementById('generateIdBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const algorithmSelect = document.getElementById('algorithmSelect');
    const applyRemovalBtn = document.getElementById('applyRemovalBtn');
    const retryRemovalBtn = document.getElementById('retryRemovalBtn');
    const loadDefaultImageBtn = document.getElementById('loadDefaultImageBtn');
    const generateDefaultIdBtn = document.getElementById('generateDefaultIdBtn');

    // Debug: Log missing elements
    const elements = {uploadArea, imageInput, generateIdBtn, downloadBtn, algorithmSelect, applyRemovalBtn, retryRemovalBtn, generateDefaultIdBtn};
    for (const [name, el] of Object.entries(elements)) {
      if (!el) {
        console.error(`Element with id '${name}' is null`);
      }
    }

    // Upload area click and drag events
    uploadArea.addEventListener('click', () => imageInput.click());
    uploadArea.addEventListener('dragover', ImageHandler.handleDragOver);
    uploadArea.addEventListener('drop', (e) => ImageHandler.handleDrop(e, this));

    // File input change
    imageInput.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        ImageHandler.handleImageUpload(e.target.files[0], this);
      }
    });

    // Algorithm selection
    algorithmSelect.addEventListener('change', (e) => {
      this.currentAlgorithm = e.target.value;
      SelectionTools.toggleCustomSelectionTools(this);
    });

    // Background removal
    applyRemovalBtn.addEventListener('click', () => BackgroundRemoval.applyBackgroundRemoval(this));
    retryRemovalBtn.addEventListener('click', () => BackgroundRemoval.retryBackgroundRemoval(this));

    // Selection tool buttons
    SelectionTools.initializeSelectionTools(this);

    // Generate ID card
    generateIdBtn.addEventListener('click', () => IdCardGenerator.generateIdCard(this));

    // Download button
    downloadBtn.addEventListener('click', IdCardGenerator.downloadIdCard);

    // 預設照片按鈕事件
    if (loadDefaultImageBtn) {
      loadDefaultImageBtn.addEventListener('click', () => ImageHandler.loadDefaultImage(this));
    }
    // 直接生成預設身分證按鈕事件
    if (generateDefaultIdBtn) {
      generateDefaultIdBtn.addEventListener('click', () => {
        // 載入預設照片
        ImageHandler.loadDefaultImage(this, () => {
          // 自動填入預設資料
          document.getElementById('petName').value = '大哥';
          document.getElementById('petGender').value = '公';
          document.getElementById('petBirthday').value = '2025-06-01';
          document.getElementById('petBreed').value = '菜市場短毛貓';
          document.getElementById('petAddress').value = '貓咪市罐頭區市場路 100 號';
          // 自動去背
          BackgroundRemoval.applyBackgroundRemoval(this);
          // 等待去背完成再生成身分證
          setTimeout(() => {
            IdCardGenerator.generateIdCard(this);
          }, 100);
        });
      });
    }
  }

  showError(message) {
    UIUtils.showError(message);
  }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new PetIdGenerator();
  UIUtils.init();
});
