class PetIdGenerator {
    constructor() {
        this.originalImage = null;
        this.processedImageData = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const imageInput = document.getElementById('imageInput');
        const generateIdBtn = document.getElementById('generateIdBtn');
        const downloadBtn = document.getElementById('downloadBtn');

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

        // Generate ID card
        generateIdBtn.addEventListener('click', this.generateIdCard.bind(this));

        // Download button
        downloadBtn.addEventListener('click', this.downloadIdCard.bind(this));
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
    }    handleImageUpload(file) {
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
    }

    displayOriginalImage(src) {
        const originalImageContainer = document.getElementById('originalImageContainer');
        const originalImage = document.getElementById('originalImage');
        
        originalImage.src = src;
        originalImageContainer.classList.remove('hidden');
    }

    async processImage() {
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

        // Perform actual background removal
        this.removeBackground();
        
        // Hide progress and show form
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            document.getElementById('petInfoForm').classList.remove('hidden');
        }, 500);
    }    removeBackground() {
        const canvas = document.getElementById('processedCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match container with fallback
        const containerWidth = canvas.parentElement.clientWidth || 400; // Fallback to 400px
        const canvasWidth = Math.max(containerWidth, 300); // Minimum 300px
        canvas.width = canvasWidth;
        canvas.height = 256;
          // Ensure canvas has valid dimensions
        if (canvas.width === 0 || canvas.height === 0) {
            canvas.width = 400;
            canvas.height = 256;
        }
        
        // Validate that we have an image to process
        if (!this.originalImage || !this.originalImage.complete) {
            this.showError('圖片尚未載入完成，請稍後再試');
            return;
        }
        
        if (this.originalImage.width === 0 || this.originalImage.height === 0) {
            this.showError('圖片尺寸無效，請選擇其他圖片');
            return;
        }
        
        // Calculate scaling to fit image in canvas while maintaining aspect ratio
        const scale = Math.min(canvas.width / this.originalImage.width, canvas.height / this.originalImage.height);
        const scaledWidth = this.originalImage.width * scale;
        const scaledHeight = this.originalImage.height * scale;
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;
          // Draw image
        ctx.drawImage(this.originalImage, x, y, scaledWidth, scaledHeight);
        
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
        
        // Simple background removal algorithm
        // This is a basic implementation - remove pixels similar to corner colors
        const cornerSamples = [
            this.getPixelColor(data, 0, 0, canvas.width),
            this.getPixelColor(data, Math.max(0, canvas.width - 1), 0, canvas.width),
            this.getPixelColor(data, 0, Math.max(0, canvas.height - 1), canvas.width),
            this.getPixelColor(data, Math.max(0, canvas.width - 1), Math.max(0, canvas.height - 1), canvas.width)
        ].filter(sample => sample !== null); // Filter out invalid samples
          const threshold = 50; // Color similarity threshold
        
        // Only process if we have valid corner samples
        if (cornerSamples.length === 0) {
            console.warn('No valid corner samples found, skipping background removal');
        } else {
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                // Check if pixel is similar to any corner color
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
        
        // Apply processed image data
        ctx.putImageData(imageData, 0, 0);
        
        // Store processed image data
        this.processedImageData = canvas.toDataURL('image/png');
        
        // Show processed image container
        document.getElementById('processedImageContainer').classList.remove('hidden');
    }    getPixelColor(data, x, y, width) {
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
    }colorDistance(r1, g1, b1, r2, g2, b2) {
        return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
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
        ctx.fillText('中華民國動物身分證', canvas.width / 2, 50);
        
        // Subtitle
        ctx.font = '14px Arial, "Microsoft JhengHei"';
        ctx.fillText('REPUBLIC OF CHINA (TAIWAN) PET IDENTITY CARD', canvas.width / 2, 65);
        
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
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PetIdGenerator();
});
