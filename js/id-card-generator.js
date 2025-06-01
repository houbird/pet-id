// ID Card generation functionality
class IdCardGenerator {
  static generateIdCard(petIdGenerator) {
    const petName = document.getElementById('petName').value.trim();
    const petGender = document.getElementById('petGender').value;
    const petBirthday = document.getElementById('petBirthday').value;
    const petBreed = document.getElementById('petBreed').value.trim();
    const petAddress = document.getElementById('petAddress').value.trim();

    if (!petName) {
      petIdGenerator.showError('請填寫寵物姓名');
      return;
    }

    if (!petBirthday) {
      petIdGenerator.showError('請選擇寵物生日');
      return;
    }

    if (!petIdGenerator.processedImageData) {
      petIdGenerator.showError('請先上傳並處理寵物照片');
      return;
    }

    IdCardGenerator.createIdCard(petName, petGender, petBirthday, petBreed, petAddress, petIdGenerator);
  }
  static createIdCard(name, gender, birthday, breed, address, petIdGenerator) {
    const canvas = document.getElementById('idCardCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size (Taiwan ID card proportions: 85.6mm x 54mm)
    canvas.width = 640;
    canvas.height = 404;
    
    // Background with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f5f5dc');
    gradient.addColorStop(1, '#f0e68c');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Taiwan flag in top-left corner
    IdCardGenerator.drawTaiwanFlag(ctx, 20, 20, 60, 40);
    
    // Title
    ctx.fillStyle = '#000080';
    ctx.font = 'bold 18px "Microsoft JhengHei", Arial';
    ctx.textAlign = 'left';
    ctx.fillText('可愛動物身分證', 95, 35);
    
    // English subtitle
    ctx.font = '12px "Microsoft JhengHei", Arial';
    ctx.fillText('ADORABLE PET IDENTITY CARD', 95, 52);
    
    // Decorative pattern background
    IdCardGenerator.drawDecorativePattern(ctx);
    
    // Generate ID number
    const idNumber = IdCardGenerator.generateIdNumber();
    
    // ID Number (top right area)
    ctx.fillStyle = '#8B0000';
    ctx.font = 'bold 16px "Microsoft JhengHei", Arial';
    ctx.textAlign = 'right';
    ctx.fillText('統一編號 ' + idNumber, canvas.width - 20, 35);
    
    // Photo area (right side)
    if (petIdGenerator.processedImageData) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        
        // Photo position and size
        const photoX = canvas.width - 150;
        const photoY = 80;
        const photoWidth = 120;
        const photoHeight = 150;
        
        // Draw photo background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(photoX - 5, photoY - 5, photoWidth + 10, photoHeight + 10);
        
        // Calculate scaling to fit photo
        const scale = Math.min(photoWidth / img.width, photoHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = photoX + (photoWidth - scaledWidth) / 2;
        const y = photoY + (photoHeight - scaledHeight) / 2;
        
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        // Photo border
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(photoX, photoY, photoWidth, photoHeight);
        ctx.restore();
      };
      img.src = petIdGenerator.processedImageData;
    }
    
    // Information section (left side)
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    
    // Name section
    ctx.font = 'bold 16px "Microsoft JhengHei", Arial';
    ctx.fillText('姓名', 30, 100);
    ctx.font = 'bold 20px "Microsoft JhengHei", Arial';
    ctx.fillText(name, 30, 130);
    
    // Birth date
    ctx.font = '14px "Microsoft JhengHei", Arial';
    ctx.fillText('出生日期', 30, 160);
    ctx.fillText('民國 ' + IdCardGenerator.formatDateROC(birthday), 30, 180);
    
    // Gender
    ctx.fillText('性別', 180, 160);
    ctx.fillText(gender, 180, 180);
    
    // ID issue info
    ctx.font = '12px "Microsoft JhengHei", Arial';
    const issueDate = new Date();
    const rocYear = issueDate.getFullYear() - 1911;
    const issueMonth = (issueDate.getMonth() + 1).toString().padStart(2, '0');
    const issueDay = issueDate.getDate().toString().padStart(2, '0');
    
    ctx.fillText('發證日期', 30, 210);
    ctx.fillText(`民國${rocYear}年${issueMonth}月${issueDay}日(北市)換發`, 30, 225);
    
    // Breed
    ctx.fillText('品種', 30, 250);
    ctx.fillText(breed || '混種', 30, 265);
    
    // Address
    ctx.fillText('地址', 30, 285);
    const addressLines = IdCardGenerator.wrapText(ctx, address || '未填寫', 300);
    addressLines.forEach((line, index) => {
      ctx.fillText(line, 30, 300 + (index * 15));
    });
    
    // Bottom decorative elements
    ctx.strokeStyle = '#8B0000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, 350);
    ctx.lineTo(canvas.width - 30, 350);
    ctx.stroke();
    
    // Show the ID card
    document.getElementById('idCardContainer').classList.remove('hidden');
    document.getElementById('idCardPlaceholder').classList.add('hidden');
  }

  static roundRect(ctx, x, y, width, height, radius) {
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
  static generateIdNumber() {
    // Generate a fake ID number for pets (Taiwan format)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const randomNumbers = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `${randomLetter}${randomNumbers.substring(0,9)}`;
  }

  static formatDateROC(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear() - 1911; // Convert to ROC year
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}年${month}月${day}日`;
  }

  static formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear() - 1911; // Convert to ROC year
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  static drawTaiwanFlag(ctx, x, y, width, height) {
    // Flag background (red)
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x, y, width, height);
    
    // Blue canton
    const cantonWidth = width * 0.5;
    const cantonHeight = height * 0.5;
    ctx.fillStyle = '#000080';
    ctx.fillRect(x, y, cantonWidth, cantonHeight);
    
    // White sun (simplified)
    ctx.fillStyle = '#FFFFFF';
    const centerX = x + cantonWidth / 2;
    const centerY = y + cantonHeight / 2;
    const sunRadius = Math.min(cantonWidth, cantonHeight) * 0.3;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, sunRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Sun rays (simplified)
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * Math.PI / 180;
      const x1 = centerX + Math.cos(angle) * sunRadius * 0.7;
      const y1 = centerY + Math.sin(angle) * sunRadius * 0.7;
      const x2 = centerX + Math.cos(angle) * sunRadius * 1.3;
      const y2 = centerY + Math.sin(angle) * sunRadius * 1.3;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }

  static drawDecorativePattern(ctx) {
    // Subtle background pattern
    ctx.strokeStyle = 'rgba(139, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    
    // Draw diagonal lines pattern
    for (let i = 0; i < ctx.canvas.width + ctx.canvas.height; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - ctx.canvas.height, ctx.canvas.height);
      ctx.stroke();
    }
  }

  static wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  static downloadIdCard() {
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
