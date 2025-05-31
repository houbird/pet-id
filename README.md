# 動物身分證生成器 (Pet ID Generator)

一個基於 Web 的動物身分證生成器，讓使用者上傳寵物照片並生成仿臺灣國民身分證格式的動物身分證。

## 功能特色

### 🖼️ 圖片處理
- 支援 JPG、PNG 格式圖片上傳
- 拖拽上傳功能
- 簡單的背景去除處理
- 即時圖片預覽

### 📋 寵物資料管理
- 寵物姓名
- 性別選擇
- 生日設定
- 品種資訊
- 地址資料

### 🆔 身分證生成
- 仿臺灣國民身分證設計
- 自動生成寵物身分證字號
- 民國年份轉換
- 官方印章設計
- 高品質 Canvas 渲染

### 💾 下載功能
- 一鍵下載生成的身分證
- PNG 格式輸出
- 高解析度圖片

## 技術架構

### 前端技術
- **HTML5**: 網頁結構和語義化標記
- **CSS3**: 使用 Tailwind CSS 框架進行響應式設計
- **JavaScript ES6+**: 
  - 圖片處理和 Canvas 操作
  - 檔案上傳和拖拽處理
  - 簡單背景去除算法
  - 身分證模板生成

### 核心功能實作
- **File API**: 處理圖片上傳
- **Canvas API**: 圖片處理和身分證生成
- **拖拽 API**: 支援拖拽上傳
- **下載功能**: 使用 Canvas.toDataURL() 生成可下載圖片

## 安裝與使用

### 本地開發
1. 複製專案
```bash
git clone [repository-url]
cd pet-id
```

2. 使用本地伺服器開啟 (建議)
```bash
# 使用 Python
python -m http.server 8000

# 使用 Node.js
npx serve .

# 使用 PHP
php -S localhost:8000
```

3. 開啟瀏覽器造訪 `http://localhost:8000`

### GitHub Pages 部署
1. 將專案推送到 GitHub 儲存庫
2. 在儲存庫設定中啟用 GitHub Pages
3. 選擇 main 分支作為來源
4. 專案將自動部署到 `https://[username].github.io/[repository-name]`

## 使用指南

1. **上傳照片**: 點擊上傳區域或拖拽圖片到指定區域
2. **檢視處理**: 系統會自動處理圖片並顯示去背結果
3. **填寫資料**: 輸入寵物的基本資訊
4. **生成身分證**: 點擊生成按鈕創建身分證
5. **下載保存**: 點擊下載按鈕保存身分證圖片

## 專案結構

```
pet-id/
├── index.html          # 主要 HTML 檔案
├── script.js           # JavaScript 功能實作
├── README.md           # 專案說明文件
└── .github/
    └── prompts/
        └── pet-id.prompt.md  # 專案需求規格
```

## 技術細節

### 背景去除算法
使用簡單的顏色相似度算法：
- 採樣圖片四個角落的顏色作為背景色參考
- 計算每個像素與背景色的色彩距離
- 將相似度超過閾值的像素設為透明

### 身分證模板
- 模仿臺灣國民身分證的設計元素
- 使用 Canvas API 動態生成
- 支援中文字體渲染
- 包含官方印章和格式化日期

### 響應式設計
- 使用 Tailwind CSS 實現響應式佈局
- 支援桌面和行動裝置
- 網格系統自動調整

## 瀏覽器相容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 未來功能

- [ ] 進階 AI 去背功能
- [ ] 多種身分證模板選擇
- [ ] 寵物資料庫整合
- [ ] 批量處理功能
- [ ] 社群分享功能

## 授權

本專案採用 MIT 授權條款。

## 貢獻指南

歡迎提交 Issue 和 Pull Request 來改進這個專案！

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 聯絡資訊

如有任何問題或建議，請建立 Issue 或聯絡專案維護者。
