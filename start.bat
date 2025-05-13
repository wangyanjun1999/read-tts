@echo off
echo �����������ʿ�ƬӦ��...

:: ��� Node.js �Ƿ�װ
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ����: δ�ҵ� Node.js���밲װ Node.js �����ԡ�
    pause
    exit /b 1
)

:: ��� Python �Ƿ�װ
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ����: δ�ҵ� Python���밲װ Python �����ԡ�
    pause
    exit /b 1
)

:: ��� edge-tts �Ƿ�װ
python -c "import edge_tts" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ����: δ�ҵ� edge-tts ģ�飬���ڳ��԰�װ...
    pip install edge-tts
    if %ERRORLEVEL% neq 0 (
        echo ����: ��װ edge-tts ʧ�ܣ����ֶ���װ�����ԡ�
        echo ����ʹ������: pip install edge-tts
        pause
        exit /b 1
    )
    echo edge-tts ��װ�ɹ���
)

:: ����Ҫ��Ŀ¼�Ƿ����
if not exist "output" mkdir output
if not exist "uploads" mkdir uploads

:: ������˷�����
echo ����������˷�����...
start cmd /k "title ���ʿ�Ƭ��˷����� && node server.js"

:: �ȴ��������
echo �ȴ���˷�������...
timeout /t 3 /nobreak >nul

:: ����ǰ�˿���������
echo ��������ǰ�˷�����...
start cmd /k "title ���ʿ�Ƭǰ�˷����� && npm run dev"

:: �ȴ�ǰ������
echo �ȴ�ǰ�˷�������...
timeout /t 5 /nobreak >nul

:: �������
echo ���ڴ������...
start http://localhost:5173

echo.
echo ���ʿ�ƬӦ����������
echo ��˷���������: http://localhost:3001
echo ǰ�˷���������: http://localhost:5173
echo.
echo ��ʾ: �ر������д��ڿ���ֹͣ����
echo.
pause
