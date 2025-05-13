@echo off
echo 正在启动单词卡片应用...

:: 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未找到 Node.js，请安装 Node.js 后再试。
    pause
    exit /b 1
)

:: 检查 Python 是否安装
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未找到 Python，请安装 Python 后再试。
    pause
    exit /b 1
)

:: 检查 edge-tts 是否安装
python -c "import edge_tts" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 警告: 未找到 edge-tts 模块，正在尝试安装...
    pip install edge-tts
    if %ERRORLEVEL% neq 0 (
        echo 错误: 安装 edge-tts 失败，请手动安装后再试。
        echo 可以使用命令: pip install edge-tts
        pause
        exit /b 1
    )
    echo edge-tts 安装成功！
)

:: 检查必要的目录是否存在
if not exist "output" mkdir output
if not exist "uploads" mkdir uploads

:: 启动后端服务器
echo 正在启动后端服务器...
start cmd /k "title 单词卡片后端服务器 && node server.js"

:: 等待后端启动
echo 等待后端服务启动...
timeout /t 3 /nobreak >nul

:: 启动前端开发服务器
echo 正在启动前端服务器...
start cmd /k "title 单词卡片前端服务器 && npm run dev"

:: 等待前端启动
echo 等待前端服务启动...
timeout /t 5 /nobreak >nul

:: 打开浏览器
echo 正在打开浏览器...
start http://localhost:5173

echo.
echo 单词卡片应用已启动！
echo 后端服务运行在: http://localhost:3001
echo 前端服务运行在: http://localhost:5173
echo.
echo 提示: 关闭命令行窗口可以停止服务
echo.
pause
