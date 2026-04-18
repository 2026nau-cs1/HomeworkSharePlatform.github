@echo off
chcp 65001 >nul
echo 正在创建数据库 studyshare...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p1234 -e "CREATE DATABASE IF NOT EXISTS studyshare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if %errorlevel% equ 0 (
    echo 数据库创建成功!
    echo 正在导入数据表结构...
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p1234 studyshare < backend\db\migrations\mysql_init_studyshare.sql
    if %errorlevel% equ 0 (
        echo 数据表导入成功!
        echo 数据库初始化完成!
    ) else (
        echo 数据表导入失败!
    )
) else (
    echo 数据库创建失败!
)
pause
