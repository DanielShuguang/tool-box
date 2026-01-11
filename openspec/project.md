# 项目 上下文

## 目的

开发一个基于 Tauri 的 Windows 桌面工具箱应用，集成了多种常用实用工具（文件搜索、护眼模式、待办事项、翻译器、文件阅读器、音乐播放器等），为用户提供便捷的桌面端辅助功能。

## 技术栈

- **前端框架**: Vue 3 + TypeScript + Vite
- **UI 组件库**: Naive UI
- **原子化 CSS**: UnoCSS
- **动画库**: motion-v
- **桌面框架**: Tauri 2.x (Rust)
- **包管理器**: pnpm
- **路由**: Vue Router
- **工具库**: VueUse, date-fns, lodash-es, ts-pattern
- **构建工具**: Vite

## 项目约定

### 代码风格

- 使用 oxfmt 进行代码格式化，配置见 `.oxfmtrc.json`
- 分号禁用 (`semi: false`)
- 使用单引号 (`singleQuote: true`)
- Tab 宽度 2 个字符，不使用尾随逗号
- TypeScript 严格模式 (`strict: true`)
- 禁用未使用的局部变量和参数 (`noUnusedLocals: true`, `noUnusedParameters: true`)
- 行宽限制 100 字符
- 单个文件行数不超过 300 行
- 函数形参不超过 3 个，超过时考虑使用对象参数
- 箭头函数参数不使用括号 (当只有一个参数时)
- 函数形参不超过 3 个，超过时考虑使用对象参数
- 注释: 必要时添加注释，保持代码可读性，语言为中文
- 项目使用了 vite 的 unplugin 插件，导入语句要注意 `src/types/auto-imports.d.ts` 和 `src/types/components.d.ts` 这两个文件，里面定义了自动导入的组件和函数，使用时不需要在文件中手动导入
- 组件拆分: 每个功能模块拆分为独立的组件，避免单个组件过于复杂
- rust 编写给前端使用的结构体，需要反序列化为小驼峰

### 架构模式

#### 前端架构

- 前端采用 Vue 3 组合式 API (Composition API) + `<script setup>` 语法
- 前端与 Tauri 后端通过 `src/backend-channel/` 目录进行通信
- 视图组件位于 `src/views/` 目录，业务逻辑分离到同目录 `logic.ts` 文件
- 通用工具函数位于 `src/utils/` 目录
- 公共 hooks 位于 `src/hooks/` 目录
- 页面特定 hooks 位于 `src/views/[PageName]/` 目录下

#### Hook 架构模式

- 复杂页面的业务逻辑应拆分为多个独立的 hooks
- 每个 hook 应专注于单一职责
- 使用组合 hook (如 `use[FeatureName]`) 统一导出所有子 hooks
- Hook 命名遵循 `use[功能名]` 格式

#### 后端通信模式

- 所有 Tauri 后端调用必须封装在 `src/backend-channel/` 目录中
- 组件不得直接使用 `invoke` 函数调用后端
- 类型定义位于 `src/backend-channel/models/` 目录
- 后端命令使用 `#[tauri::command]` 宏定义
- 返回类型统一使用 `Result<T, String>`

#### 组件开发模式

- 组件文件包含三个部分: `.vue` (模板), `logic.ts` (逻辑), `index.ts` (导出)
- 使用 Composition API 和 TypeScript 进行类型定义
- 使用 Naive UI 组件库
- 避免在组件中直接调用 `invoke`，使用封装后的 backend-channel 函数

### 项目结构

```
tool-box/
├── src/                          # Vue 前端代码
│   ├── components/              # 可复用组件
│   │   ├── AppSettings/         # 应用设置组件
│   │   └── Layout/              # 布局组件
│   ├── views/                   # 页面视图
│   │   ├── [FeatureName]/       # 功能页面目录
│   │   │   ├── [FeatureName].vue  # 页面组件
│   │   │   ├── logic.ts         # 业务逻辑（或拆分为多个 hooks）
│   │   │   ├── use[FeatureName].ts  # 组合 hook
│   │   │   └── use*.ts          # 子 hooks
│   ├── backend-channel/         # Tauri 后端通信
│   │   ├── models/              # 数据模型
│   │   │   └── [feature].ts     # 功能相关类型定义
│   │   └── [feature].ts         # 后端调用封装
│   ├── hooks/                   # 公共 Vue 组合式函数
│   ├── router/                  # 路由配置
│   ├── types/                   # TypeScript 类型定义
│   ├── utils/                   # 工具函数
│   ├── App.vue                  # 根组件
│   └── main.ts                  # 入口文件
├── src-tauri/                   # Rust 后端代码
│   ├── src/
│   │   ├── lib.rs               # 库入口
│   │   ├── main.rs              # 主入口
│   │   └── [feature].rs         # 功能模块
│   └── Cargo.toml               # Rust 依赖配置
├── public/                      # 静态资源
├── openspec/                    # 项目规范文档
│   ├── project.md               # 项目上下文（本文件）
│   ├── changes/                 # 变更提案目录
│   │   └── [change-id]/         # 变更提案
│   │       ├── proposal.md      # 提案描述
│   │       ├── tasks.md         # 任务清单
│   │       └── specs/           # 规格说明
│   │           └── [feature]/   # 功能规格
│   │               └── spec.md  # 详细规格
│   └── templates/               # 提案模板（可选）
└── package.json                 # Node.js 依赖配置
```

### 命名约定

#### TypeScript/JavaScript

- **组件**: PascalCase (如 `AppSettings.vue`, `MusicPlayer.vue`)
- **文件**: kebab-case (如 `file-search.ts`, `music-player.ts`)
- **变量/函数**: camelCase (如 `searchDiskFile`, `loadAudioFile`)
- **常量**: UPPER_SNAKE_CASE (如 `MAX_FILE_SIZE`, `SUPPORTED_FORMATS`)
- **类型/接口**: PascalCase (如 `SearchResult`, `AudioMetadata`)
- **枚举**: PascalCase (如 `FileStatus`, `PlayMode`)
- **Hook**: camelCase with `use` prefix (如 `useAudioCore`, `usePlaylist`)

#### Rust

- **模块**: snake_case (如 `file_search`, `music_player`)
- **函数/变量**: snake_case (如 `search_disk_file`, `load_audio_file`)
- **结构体**: PascalCase (如 `SearchResult`, `AudioMetadata`)
- **枚举**: PascalCase (如 `FileStatus`, `PlayMode`)
- **常量**: UPPER_SNAKE_CASE (如 `MAX_FILE_SIZE`, `SUPPORTED_FORMATS`)

### 测试策略

#### 测试框架

- **单元测试框架**: Vitest
- **测试环境**: jsdom (浏览器模拟环境)
- **Vue 测试工具**: @vue/test-utils
- **断言库**: @testing-library/jest-dom
- **测试覆盖率**: V8 引擎

#### 测试文件结构

- **工具函数测试**: 位于对应工具模块的 `__tests__` 目录中，命名为 `[filename].test.ts`
- **组件测试**: 位于组件目录下的 `__tests__` 目录中，命名为 `[ComponentName].test.ts`
- **Hook 测试**: 位于 Hook 文件所在模块的 `__tests__` 目录中，命名为 `[hookname].test.ts`
- **测试配置**: `vitest.config.ts` (根目录)
- **测试环境配置**: `src/test/setup.ts`
- **测试工具**: 使用 `@tauri-apps/api/mocks` 提供的工具来模拟后端行为

#### 命名约定

- **测试文件**: `[被测试文件].test.ts`
- **测试套件**: 使用 `describe('[模块名]', () => { ... })`
- **测试用例**: 使用 `it('[测试场景]', () => { ... })` 或 `test('[测试场景]', () => { ... })`
- **测试函数**: 使用 `test[功能名]` 格式 (如 `testFormatTime`)

#### 测试编写指南

1. **单元测试原则**:

   - 每个测试只验证一个功能点
   - 测试应该是独立的，不依赖其他测试的执行顺序
   - 测试应该是可重复的，结果一致
   - 测试应该是快速的，避免长时间运行

2. **测试内容**:

   - **工具函数**: 测试所有公共函数的正常、边界和异常情况
   - **组件**: 测试组件的渲染、props 传递、事件触发和状态变化
   - **Hook**: 测试 Hook 的返回值、副作用和状态更新
   - **业务逻辑**: 测试核心业务流程的正确性

3. **Mock 策略**:

   - Tauri 后端调用必须使用 mock
   - 外部 API 调用必须使用 mock
   - 复杂依赖关系必须使用 mock

4. **断言规范**:
   - 使用明确的断言信息
   - 优先使用 @testing-library/jest-dom 提供的 DOM 断言
   - 避免使用过于宽松的断言

#### 测试命令

```bash
# 运行所有测试
pnpm test

# 运行测试并显示可视化界面
pnpm test:ui

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行特定测试文件
pnpm test src/utils/time.test.ts

# 监视模式运行测试
pnpm test --watch
```

#### 覆盖率要求

- **工具函数**: 覆盖率 ≥ 80%
- **核心业务逻辑**: 覆盖率 ≥ 70%
- **组件**: 覆盖率 ≥ 60%
- 新增代码必须包含对应的测试用例

#### 质量保证流程

- 使用 husky 进行 Git pre-commit 检查
- 构建前执行 TypeScript 类型检查 (`vue-tsc --noEmit`)
- 使用 oxlint 进行代码规范检查
- 完成代码修改后必须运行: `pnpm lint`, `pnpm fmt`, `pnpm check`, `pnpm test`

### Git 工作流

- 使用 husky 管理 Git hooks
- commit 前自动运行 lint 和 fmt
- 提交前确保所有代码质量检查通过

## OpenSpec 文档规范

### 提案结构

每个功能变更应遵循以下结构：

```
openspec/changes/[change-id]/
├── proposal.md      # 提案描述（概述、技术栈、变更内容、技术方案）
├── tasks.md         # 任务清单（实施、测试、文档）
└── specs/
    └── [feature]/
        └── spec.md  # 详细规格（新增需求、非功能需求）
```

### proposal.md 编写规范

提案描述应包含以下章节：

1. **概述**: 功能的简要描述和目标
2. **技术栈**: 使用的技术和库
3. **变更内容**: 详细的功能列表
4. **技术方案**: 实现方案和架构设计
5. **风险评估**: 可能的风险和应对措施（可选）

### tasks.md 编写规范

任务清单应包含以下章节：

1. **实施**: 开发任务列表，使用 checkbox 标记状态
2. **测试**: 测试任务列表
3. **文档**: 文档更新任务列表

任务格式示例：

```markdown
- [ ] 1.1 创建页面组件结构
- [x] 1.2 添加路由配置
```

### spec.md 编写规范

详细规格应包含以下章节：

1. **新增需求**: 功能性需求，使用 Gherkin 语法（Given-When-Then）
2. **非功能需求**: 性能、安全、可用性等需求

需求场景格式示例：

```markdown
#### 场景：播放和暂停

- **当** 用户点击播放按钮且当前有选中的音频文件
- **那么** 系统必须开始播放该音频文件
- **并且** 播放按钮状态必须切换为暂停图标
```

### 提案生成指南

生成新提案时，应遵循以下步骤：

1. **创建变更目录**: 在 `openspec/changes/` 下创建新的变更目录
2. **编写提案**: 按照上述规范编写 `proposal.md`
3. **列出任务**: 在 `tasks.md` 中列出所有实施、测试、文档任务
4. **定义规格**: 在 `spec.md` 中详细定义需求场景
5. **保持同步**: 实施过程中及时更新任务状态
6. **补充变更**: 如有新增功能或修改，及时补充到提案中

## 领域上下文

- Windows 桌面应用程序开发
- Tauri 2.x 桌面应用框架
- 系统级功能集成（文件操作、系统信息、自启动等）
- 跨端 UI 组件开发
- 音频播放和处理
- 文件搜索和索引
- 文档处理和预览

## 重要约束

- 仅支持 Windows 平台
- 必须通过 Tauri 权限系统访问系统资源
- 前端代码需遵循无障碍访问和响应式设计原则
- 单个文件行数不超过 300 行
- 函数形参不超过 3 个
- 避免使用 `any` 类型，使用 `unknown` 或具体类型替代

## 外部依赖

### Tauri 官方插件

- fs (文件系统)
- dialog (对话框)
- shell (Shell 操作)
- notification (通知)
- os (操作系统信息)
- http (HTTP 客户端)
- store (持久化存储)
- autostart (自启动)
- cli (命令行)

### 第三方库

- **图标库**: @vicons/fluent, @vicons/ionicons5, @vicons/material
- **文档处理**: mammoth (.docx 读取), xlsx (Excel 文件处理)
- **动画**: motion-v (动画库)
- **工具**: VueUse, date-fns, lodash-es, ts-pattern

## 开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm tauri dev

# 构建
pnpm build

# Lint 检查和自动修复
pnpm lint

# 代码格式化
pnpm fmt

# 类型检查
pnpm check
```

## 环境要求

- Node.js >= 22.18.0 (使用 Volta 管理)
- Rust >= 1.88
- pnpm >= 10.4.1
