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
    if (petIdGenerator.processedImageData) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        
        // Create rounded rectangle for photo
        const photoX = 30;
        const photoY = 90;
        const photoWidth = 120;
        const photoHeight = 150;
        
        IdCardGenerator.roundRect(ctx, photoX, photoY, photoWidth, photoHeight, 8);
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
        IdCardGenerator.roundRect(ctx, photoX, photoY, photoWidth, photoHeight, 8);
        ctx.stroke();
      };
      img.src = petIdGenerator.processedImageData;
    }
    
    // Information section
    ctx.fillStyle = '#374151';
    ctx.font = '16px Arial, "Microsoft JhengHei"';
    ctx.textAlign = 'left';
    
    const infoStartX = 170;
    const infoStartY = 120;
    const lineHeight = 30;
    
    // Generate ID number
    const idNumber = IdCardGenerator.generateIdNumber();
    
    const info = [
      `身分證字號: ${idNumber}`,
      `姓名: ${name}`,
      `性別: ${gender}`,
      `出生日期: ${IdCardGenerator.formatDate(birthday)}`,
      `品種: ${breed || '混種'}`,
      `地址: ${address || '未填寫'}`
    ];
    
    info.forEach((text, index) => {
      ctx.fillText(text, infoStartX, infoStartY + (index * lineHeight));
    });
    
    // Issue date
    ctx.font = '12px Arial, "Microsoft JhengHei"';
    ctx.fillText(`發證日期: ${IdCardGenerator.formatDate(new Date().toISOString().split('T')[0])}`, infoStartX, infoStartY + (info.length * lineHeight) + 20);
    
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
    // Generate a fake ID number for pets
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];
    const randomNumbers = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `P${randomLetter}${randomNumbers}`;
  }

  static formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear() - 1911; // Convert to ROC year
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
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
