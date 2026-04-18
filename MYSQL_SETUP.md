# MySQL 8.0 数据库配置指南

## 1. 安装 MySQL 8.0

确保你已经安装了 MySQL 8.0。如果没有，请前往 [MySQL 官网](https://dev.mysql.com/downloads/mysql/) 下载安装。

## 2. 创建数据库

登录 MySQL 后执行以下命令:

```sql
CREATE DATABASE studyshare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 3. 运行迁移脚本

在 MySQL 客户端中运行 `backend/db/migrations/mysql_init_studyshare.sql` 文件:

```bash
mysql -u root -p studyshare < backend/db/migrations/mysql_init_studyshare.sql
```

或者在 MySQL 客户端中:

```sql
USE studyshare;
SOURCE backend/db/migrations/mysql_init_studyshare.sql;
```

## 4. 配置数据库连接

编辑 `.env` 文件，设置正确的数据库连接字符串:

```env
DATABASE_URL=mysql://root:你的密码@localhost:3306/studyshare
```

默认配置为:
- 主机：localhost
- 端口：3306
- 数据库名：studyshare
- 用户：root
- 密码：password (请修改为你的实际密码)

## 5. 启动应用

```bash
npm run dev
```

## 注意事项

- 确保 MySQL 服务正在运行
- 确保数据库字符集为 utf8mb4 以支持中文
- 如果遇到连接问题，请检查防火墙设置和 MySQL 用户权限
