<!--
 * @Description: 
-->
# 单词卡片应用

这是一个使用 React + Vite 构建的单词卡片应用，支持使用 edge-tts 生成英语/法语单词的发音。

## 功能特点

- 支持上传 Excel/CSV 文件导入单词列表
- 支持英语和法语发音
- 支持顺序/随机/重复朗读功能
- 自动缓存音频文件，避免重复生成
- 支持无限次重复播放

## 系统要求

- Node.js
- Python 3
- edge-tts Python 模块

## 快速启动

### Windows 用户

双击 `start.bat` 文件即可一键启动前端和后端服务。

### Linux/macOS 用户

在终端中执行以下命令：

```bash
# 添加执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

## 手动启动

如果一键启动脚本不起作用，可以手动启动：

1. 启动后端服务：
   ```bash
   node server.js
   ```

2. 启动前端服务：
   ```bash
   npm run dev
   ```

3. 在浏览器中访问：http://localhost:5173

## 技术栈

- 前端：React, Vite, Ant Design
- 后端：Express, edge-tts
- 数据处理：XLSX
