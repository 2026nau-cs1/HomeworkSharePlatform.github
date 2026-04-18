# StudyShare — 大学生学习资料共享平台

## 项目结构

```
.
├── backend/
│   ├── config/
│   │   └── constants.ts          # 服务器配置
│   ├── db/
│   │   ├── index.ts              # 数据库连接 (drizzle + postgres.js)
│   │   ├── schema.ts             # 所有表定义 + Zod 校验模式
│   │   └── migrations/
│   │       └── 1773458885757_init_studyshare.sql
│   ├── middleware/
│   │   ├── auth.ts               # JWT 认证中间件 + requireAdmin
│   │   └── errorHandler.ts       # 全局错误处理
│   ├── repositories/
│   │   ├── users.ts              # 用户数据访问层
│   │   └── materials.ts          # 资料/评价/收藏/下载/举报 数据访问层
│   ├── routes/
│   │   ├── auth.ts               # 登录/注册/个人信息/修改档案
│   │   ├── materials.ts          # 资料 CRUD + 下载/收藏/评价/举报
│   │   └── admin.ts              # 管理员审核看板路由
│   └── server.ts             # Express 入口
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── custom/
│   │   │   │   ├── Login.tsx         # 登录页面
│   │   │   │   └── Signup.tsx        # 注册页面
│   │   │   └── ui/               # shadcn/ui 组件（勿修改）
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx   # JWT 认证状态管理
│   │   ├── lib/
│   │   │   └── api.ts            # 所有 API 调用方法
│   │   ├── pages/
│   │   │   └── Index.tsx         # 主应用（所有视图内联）
│   │   ├── types/
│   │   │   └── index.ts          # 全局 TypeScript 类型定义
│   │   ├── App.tsx           # HashRouter + AuthProvider + 路由
│   │   └── index.css         # Tailwind v4 主题（Campus Blue 风格）
│   └── package.json
├── package.json
└── drizzle.config.ts
```

## 功能模块

### 用户认证
- 邮箱/密码注册（bcrypt 加密）
- JWT 登录，7天有效期
- 个人档案编辑（专业、院系、毕业年份）

### 资料管理
- 上传资料（PDF/DOCX/PPTX）带元数据
- 搜索（课程代码、标题、院系）
- 多维筛选（类型、院系、评分、排序）
- 分页浏览
- 热门资料榜单

### 下载与访问
- 免费用户每日 10 次下载限制
- 付费会员无限下载
- 下载历史记录

### 社区与评价
- 1-5 星评分 + 文字评价
- 举报不当内容
- 收藏夹功能

### 管理员看板
- 审核被标记资料
- 审核待审核资料
- 处理用户举报

## 技术栈

### 后端
- **框架**: Express.js + TypeScript
- **数据库 ORM**: Drizzle ORM + postgres.js
- **认证**: JWT (jsonwebtoken) + bcryptjs
- **校验**: Zod

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS v4 (Campus Blue 主题)
- **UI 组件**: shadcn/ui
- **路由**: React Router DOM (HashRouter)

## 数据库表

| 表名 | 用途 |
|--------|------|
| Users | 用户账户、认证、会员类型 |
| Materials | 学习资料元数据 |
| Reviews | 资料评分与评价 |
| Bookmarks | 用户收藏夹 |
| Downloads | 下载历史记录 |
| Reports | 内容举报记录 |

## API 路由

### 认证
- `POST /api/auth/signup` — 注册
- `POST /api/auth/login` — 登录
- `GET /api/auth/me` — 获取当前用户
- `PUT /api/auth/profile` — 更新个人档案

### 资料
- `GET /api/materials` — 列表（支持搜索/筛选/分页）
- `GET /api/materials/trending` — 热门资料
- `GET /api/materials/:id` — 资料详情
- `POST /api/materials` — 上传资料（需登录）
- `DELETE /api/materials/:id` — 删除资料
- `POST /api/materials/:id/download` — 下载（限流）
- `GET/POST /api/materials/:id/reviews` — 评价
- `POST /api/materials/:id/bookmark` — 收藏切换
- `POST /api/materials/:id/report` — 举报
- `GET /api/materials/user/bookmarks` — 我的收藏
- `GET /api/materials/user/downloads` — 下载历史
- `GET /api/materials/user/uploads` — 我的上传

### 管理员（需 admin 角色）
- `GET /api/admin/flagged` — 被标记资料
- `GET /api/admin/pending` — 待审核资料
- `GET /api/admin/reports` — 举报列表
- `PUT /api/admin/materials/:id/status` — 更新资料状态
- `PUT /api/admin/reports/:id/status` — 处理举报

## 代码生成指南

- 所有新实体表定义在 `backend/db/schema.ts`，遵循 Drizzle + Zod 模式
- Repository 方法接受 `z.infer<typeof insertXSchema>` 类型，在 `.values()` 中使用 `as InsertX` 断言
- 前端所有 API 调用通过 `frontend/src/lib/api.ts` 的 `apiService` 对象
- 主应用内联在 `frontend/src/pages/Index.tsx`，包含所有视图组件
- 主题色彩：Campus Blue (#1E3A5F) + Amber Accent (#F59E0B)
