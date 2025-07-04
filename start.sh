#!/bin/bash

echo "正在启动单词卡片应用..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请安装 Node.js 后再试。"
    exit 1
fi

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到 Python，请安装 Python 后再试。"
    exit 1
fi

# 检查 edge-tts 是否安装
python3 -c "import edge_tts" &> /dev/null
if [ $? -ne 0 ]; then
    echo "警告: 未找到 edge-tts 模块，正在尝试安装..."
    pip3 install edge-tts
    if [ $? -ne 0 ]; then
        echo "错误: 安装 edge-tts 失败，请手动安装后再试。"
        echo "可以使用命令: pip3 install edge-tts"
        exit 1
    fi
    echo "edge-tts 安装成功！"
fi

# 检查必要的目录是否存在
[ ! -d "output" ] && mkdir -p output
[ ! -d "uploads" ] && mkdir -p uploads

# 启动后端服务器
echo "正在启动后端服务器..."
node server.js &
BACKEND_PID=$!

# 等待后端启动
echo "等待后端服务启动..."
sleep 3

# 启动前端开发服务器
echo "正在启动前端服务器..."
npm run dev &
FRONTEND_PID=$!

# 等待前端启动
echo "等待前端服务启动..."
sleep 5

# 打开浏览器（根据操作系统选择合适的命令）
echo "正在打开浏览器..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:5173
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:5173 &> /dev/null || sensible-browser http://localhost:5173 &> /dev/null || echo "请手动打开浏览器访问 http://localhost:5173"
else
    echo "请手动打开浏览器访问 http://localhost:5173"
fi

echo ""
echo "单词卡片应用已启动！"
echo "后端服务运行在: http://localhost:3001"
echo "前端服务运行在: http://localhost:5173"
echo ""
echo "提示: 按 Ctrl+C 可以停止服务"
echo ""

# 捕获 SIGINT 信号（Ctrl+C）
trap cleanup INT

# 清理函数
cleanup() {
    echo "正在停止服务..."
    kill $FRONTEND_PID $BACKEND_PID 2>/dev/null
    exit 0
}

# 等待用户按 Ctrl+C
wait
