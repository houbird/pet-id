// UI utilities and helper functions
class UIUtils {
  static showError(message) {
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

  static init() {
    // 自動將 petBirthday 設為今天日期
    const petBirthday = document.getElementById('petBirthday');
    if (petBirthday) {
      petBirthday.value = new Date().toISOString().split('T')[0];
    }
  }

  static showLoadingState(element, text = '處理中...') {
    if (element) {
      element.disabled = true;
      element.textContent = text;
    }
  }

  static hideLoadingState(element, originalText) {
    if (element) {
      element.disabled = false;
      element.textContent = originalText;
    }
  }

  static fadeIn(element, duration = 300) {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    
    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      
      element.style.opacity = Math.min(progress, 1);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }
    
    requestAnimationFrame(animate);
  }

  static fadeOut(element, duration = 300) {
    if (!element) return;
    
    let start = null;
    const initialOpacity = parseFloat(window.getComputedStyle(element).opacity) || 1;
    
    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      
      element.style.opacity = initialOpacity * (1 - Math.min(progress, 1));
      
      if (progress >= 1) {
        element.style.display = 'none';
      } else {
        requestAnimationFrame(animate);
      }
    }
    
    requestAnimationFrame(animate);
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  static copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      UIUtils.showSuccess('已複製到剪貼簿');
    }).catch(() => {
      UIUtils.showError('複製失敗');
    });
  }

  static showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-check-circle mr-2"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(full)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  static createProgressBar(container, label = '處理進度') {
    const progressWrapper = document.createElement('div');
    progressWrapper.className = 'progress-wrapper mb-4';
    progressWrapper.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-gray-700">${label}</span>
        <span class="text-sm text-gray-500 progress-percentage">0%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-blue-600 h-2 rounded-full progress-bar" style="width: 0%"></div>
      </div>
    `;
    
    container.appendChild(progressWrapper);
    
    return {
      update: (percentage) => {
        const bar = progressWrapper.querySelector('.progress-bar');
        const text = progressWrapper.querySelector('.progress-percentage');
        bar.style.width = `${percentage}%`;
        text.textContent = `${percentage}%`;
      },
      remove: () => {
        if (progressWrapper.parentNode) {
          progressWrapper.parentNode.removeChild(progressWrapper);
        }
      }
    };
  }
}
