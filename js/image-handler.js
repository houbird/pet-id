// Image handling functionality
class ImageHandler {
  static handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  static handleDrop(e, petIdGenerator) {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && ImageHandler.isValidImageFile(files[0])) {
      ImageHandler.handleImageUpload(files[0], petIdGenerator);
    }
  }

  static isValidImageFile(file) {
    return file.type === 'image/jpeg' || file.type === 'image/png';
  }

  static handleImageUpload(file, petIdGenerator) {
    if (!ImageHandler.isValidImageFile(file)) {
      petIdGenerator.showError('請上傳 JPG 或 PNG 格式的圖片');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      petIdGenerator.showError('圖片檔案太大，請選擇小於 10MB 的圖片');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      petIdGenerator.originalImage = new Image();
      petIdGenerator.originalImage.onload = () => {
        ImageHandler.displayOriginalImage(e.target.result);
        ImageHandler.processImage();
      };
      petIdGenerator.originalImage.onerror = () => {
        petIdGenerator.showError('圖片載入失敗，請嘗試其他圖片');
      };
      petIdGenerator.originalImage.src = e.target.result;
    };
    reader.onerror = () => {
      petIdGenerator.showError('檔案讀取失敗，請重新嘗試');
    };
    reader.readAsDataURL(file);
  }

  static displayOriginalImage(src) {
    const originalImageContainer = document.getElementById('originalImageContainer');
    const originalImage = document.getElementById('originalImage');
    
    originalImage.src = src;
    originalImageContainer.classList.remove('hidden');
    
    // Show background removal options
    document.getElementById('backgroundRemovalOptions').classList.remove('hidden');
  }

  static async processImage() {
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
  }

  static drawOriginalImageToCanvas(petIdGenerator) {
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

    if (!petIdGenerator.originalImage || !petIdGenerator.originalImage.complete) {
      petIdGenerator.showError('圖片尚未載入完成，請稍後再試');
      return;
    }

    // Calculate scaling to fit image in canvas while maintaining aspect ratio
    const scale = Math.min(canvas.width / petIdGenerator.originalImage.width, canvas.height / petIdGenerator.originalImage.height);
    const scaledWidth = petIdGenerator.originalImage.width * scale;
    const scaledHeight = petIdGenerator.originalImage.height * scale;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;

    // Clear canvas and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(petIdGenerator.originalImage, x, y, scaledWidth, scaledHeight);
  }

  static getPixelColor(data, x, y, width) {
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
  }

  static colorDistance(r1, g1, b1, r2, g2, b2) {
    return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
  }

  // 載入預設照片
  static async loadDefaultImage(petIdGenerator, callback) {
    try {
      const response = await fetch('images/dago_m.png');
      const blob = await response.blob();
      // 轉成 File 物件（模擬上傳）
      const file = new File([blob], 'dago_m.png', { type: blob.type });
      ImageHandler.handleImageUpload(file, petIdGenerator);
      if (typeof callback === 'function') {
        // 等待圖片載入完成再 callback
        const checkLoaded = () => {
          if (petIdGenerator.originalImage && petIdGenerator.originalImage.complete) {
            callback();
          } else {
            setTimeout(checkLoaded, 50);
          }
        };
        checkLoaded();
      }
    } catch (err) {
      petIdGenerator.showError('預設照片載入失敗');
    }
  }
}
