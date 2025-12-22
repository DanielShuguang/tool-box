# 项目上下文

## 目的

tool-box 是一个基于 Tauri 构建的跨平台桌面工具集，旨在提供一系列实用工具来提高用户的工作效率。项目目标是创建一个轻量、高效、功能丰富的桌面应用，包含文件搜索、翻译、待办事项、护眼模式、Windows 激活等多种工具。

## 技术栈

### 前端

- Vue 3 (^3.5.24) - 渐进式 JavaScript 框架
- TypeScript (^5.9.3) - 类型安全的 JavaScript 超集
- Naive UI (^2.43.2) - Vue 3 组件库
- Vite (^7.2.4) - 下一代前端构建工具
- SCSS (^1.94.2) - CSS 预处理器
- @vueuse/core (^14.0.0) - Vue 组合式 API 工具集
- lodash-es (^4.17.21) - 实用工具库
- date-fns (^4.1.0) - 日期处理库
- mitt (^3.0.1) - 事件总线
- @vicons (fluent/ionicons5/material) - 图标库
- UnoCSS (^66.5.9) - 原子化 CSS 框架（优先使用）
- big.js (^7.0.1) - 高精度数字处理库
- motion-v (^1.7.4) - 动画库
- ts-pattern (^5.9.0) - 模式匹配库
- mammoth (^1.11.0) - Word 文档处理库
- normalize.css (^8.0.1) - CSS 重置库

### 后端

- Rust - 系统编程语言
- Tauri (^2.9.0) - 跨平台桌面应用框架
- Tokio - Rust 异步运行时
- Reqwest - Rust HTTP 客户端
- Serde - Rust 序列化/反序列化库
- sysinfo - 系统信息库
- anyhow - Rust 错误处理库

### Tauri 插件

- @tauri-apps/plugin-autostart (^2.5.1) - 应用自启动
- @tauri-apps/plugin-cli (^2.4.1) - 命令行参数处理
- @tauri-apps/plugin-dialog (^2.4.2) - 文件/目录选择对话框
- @tauri-apps/plugin-fs (^2.4.4) - 文件系统操作
- @tauri-apps/plugin-http (^2.5.4) - HTTP 请求
- @tauri-apps/plugin-notification (^2.3.3) - 系统通知
- @tauri-apps/plugin-os (^2.3.2) - 操作系统信息
- @tauri-apps/plugin-shell (^2.3.3) - 系统命令执行
- @tauri-apps/plugin-store (^2.4.1) - 数据持久化存储

### 开发工具

- pnpm (^10.4.1) - 包管理器
- oxlint (^1.30.0) - 代码检查工具
- oxfmt (^0.19.0) - 代码格式化工具
- husky (^9.1.7) - Git 钩子工具
- VS Code - 集成开发环境
- Node.js (v22.18.0) - JavaScript 运行时

## 项目约定

### 代码风格

- 前端使用 TypeScript，遵循严格的类型检查
- 代码格式化使用 oxfmt，配置文件：`.oxfmtrc.json`
- 代码检查使用 oxlint，配置文件：`.oxlintrc.json`
- 命名约定：
  - 变量和函数：camelCase
  - 组件和类：PascalCase
  - 文件和目录：kebab-case
  - 自定义钩子：use+功能名（如 useSystemTheme）
  - 事件处理函数：handle+事件名（如 handleSearch）
- 缩进使用 2 个空格
- 每行最大长度：100 个字符

### 组件开发规范

1. **组件命名约定**

   - **组件名称**：使用 PascalCase 命名（如 `LayoutComponent`），清晰描述组件功能
   - **文件名称**：与组件名称一致，使用 `.vue` 后缀（如 `LayoutComponent.vue`）
   - **逻辑文件**：与组件文件同目录，命名为 `logic.ts`
   - **样式类名**：使用 BEM 命名规范或基于组件功能的描述性名称（如 `.component-wrapper`）

2. **组件结构**

   - **文件组织**：组件 `.vue` 文件和对应的 `logic.ts` 文件放在同一目录下
   - **语法要求**：使用 `<script lang="ts" setup>` 语法，启用 TypeScript 严格模式
   - **模板结构**：清晰的嵌套结构，合理使用组件拆分，避免过深的嵌套层次
   - **样式隔离**：使用 `scoped` 属性隔离组件样式，优先使用 UnoCSS 原子化 CSS

3. **导入顺序**

   严格遵循以下导入顺序，使用空行分隔不同类别的导入：

   ```typescript
   // 1. Vue 核心和组合式 API
   import { ref, computed, onMounted, onUnmounted } from 'vue'
   import { useRouter } from 'vue-router'

   // 2. UI 组件库
   import { useMessage, NButton, NSelect } from 'naive-ui'
   import { SelectMixedOption } from 'naive-ui/es/select/src/interface'

   // 3. 逻辑钩子（本地）
   import { useAppWindowOperation, useSystemTheme } from './logic'

   // 4. 工具函数和自定义钩子
   import { usePersistentStorage } from '@/hooks/usePersistentStorage'
   import { someUtil } from '@/utils/someUtil'

   // 5. 图标
   import { Sunny, Moon, SettingsOutline } from '@vicons/ionicons5'
   import { MinimizeRound } from '@vicons/material'
   import { Maximize20Regular } from '@vicons/fluent'

   // 6. 组件
   import ChildComponent from './ChildComponent.vue'

   // 7. 本地存储
   import { ConfigFile } from '@/utils/storage'

   // 8. 事件总线
   import { emitter } from '@/utils/event'

   // 9. Tauri API
   import { getName } from '@tauri-apps/api/app'
   import { getCurrentWindow } from '@tauri-apps/api/window'
   ```

4. **响应式数据**

   - 使用 `ref` 或 `reactive` 包装响应式数据，优先使用 `ref` 以获得更好的类型推断
   - 计算属性使用 `computed` 包装，保持计算逻辑简洁，避免副作用
   - 避免直接修改 props，通过 `emit` 触发父组件更新，遵循单向数据流原则
   - 对于复杂数据结构，使用 `shallowRef` 或 `readonly` 优化性能

5. **组件通信**

   - **父组件向子组件传递数据**：使用 `defineProps` 定义 props，明确类型和默认值
   - **子组件向父组件传递事件**：使用 `defineEmits` 定义事件，明确事件名和参数类型
   - **跨组件通信**：优先使用 Vue 的 `provide/inject` API，其次使用事件总线
   - **全局状态**：使用 `@tauri-apps/plugin-store` 进行持久化存储，通过自定义钩子封装操作

6. **Props 和 Emits 规范**

   ```typescript
   // Props 定义：明确类型、默认值和必选性
   const props = withDefaults(
     defineProps<{
       // 基础类型
       title: string
       disabled?: boolean
       count?: number

       // 复杂类型
       items: Array<{
         id: string
         name: string
       }>

       // 可选对象类型
       options?: Record<string, any>
     }>(),
     {
       // 设置默认值
       disabled: false,
       count: 0,
       options: () => ({})
     }
   )

   // Emits 定义：明确事件名和参数类型
   const emit = defineEmits<{
     // 更新props值的事件（双向绑定）
     'update:title': [value: string]

     // 普通事件
     click: []
     'item-selected': [itemId: string]

     // 带多个参数的事件
     'range-change': [min: number, max: number]
   }>()
   ```

7. **生命周期管理**

   - 合理使用 `onMounted`, `onUnmounted`, `onBeforeUnmount` 等生命周期钩子
   - 确保在组件卸载时清理事件监听器、定时器、WebSocket 连接等资源
   - 异步操作应在组件卸载时取消，避免内存泄漏
   - 使用 `onBeforeRouteLeave` 处理路由跳转前的清理工作

8. **组件样式最佳实践**

   - 优先使用 UnoCSS 原子化 CSS，减少自定义样式
   - 使用 `scoped` 属性隔离组件样式，避免样式冲突
   - 利用 CSS 变量和主题系统保持样式一致性
   - 避免使用 `!important` 强制样式覆盖
   - 合理使用 `:deep()` 选择器修改子组件样式

9. **组件示例**

   ```vue
   <script lang="ts" setup>
   import { ref, computed, onMounted } from 'vue'
   import { useRouter } from 'vue-router'
   import { useMessage, NButton, NSelect } from 'naive-ui'
   import { SelectMixedOption } from 'naive-ui/es/select/src/interface'
   import { useSomeHook } from './logic'
   import { SomeIcon } from '@vicons/ionicons5'

   // 定义属性
   const props = withDefaults(
     defineProps<{
       title: string
       disabled?: boolean
       maxCount?: number
     }>(),
     {
       disabled: false,
       maxCount: 10
     }
   )

   // 定义事件
   const emit = defineEmits<{
     (e: 'update:title', value: string): void
     (e: 'click', count: number): void
     (e: 'max-reached', count: number): void
   }>()

   // 响应式数据
   const count = ref(0)
   const isActive = computed(() => count.value > 0)
   const isMaxReached = computed(() => count.value >= props.maxCount)

   // 使用自定义钩子
   const { someState, someAction } = useSomeHook()

   // 事件处理
   function handleClick() {
     if (props.disabled || isMaxReached.value) return

     count.value++
     emit('click', count.value)

     if (count.value === props.maxCount) {
       emit('max-reached', count.value)
     }
   }

   // 生命周期
   onMounted(() => {
     // 初始化逻辑
   })
   </script>

   <template>
     <div class="component-wrapper">
       <h2 class="text-xl font-bold mb-4">{{ title }}</h2>
       <div class="flex items-center gap-2">
         <NButton :disabled="disabled || isMaxReached" @click="handleClick" type="primary">
           <SomeIcon class="mr-1" />
           Count: {{ count }} / {{ maxCount }}
         </NButton>
         <span v-if="isMaxReached" class="text-warning">已达到最大值</span>
       </div>
     </div>
   </template>

   <style lang="scss" scoped>
   .component-wrapper {
     padding: 16px;
     background-color: var(--background-color);
     border-radius: 8px;
     box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
   }
   </style>
   ```

10. **组件测试建议**

    - 为公共组件编写单元测试，使用 Vitest 和 Vue Test Utils
    - 测试组件的各种状态和行为，包括正常情况和边界情况
    - 测试组件的 props 和 emits 是否按预期工作
    - 测试组件的生命周期钩子是否正确执行

### 逻辑分离规范

1. **自定义钩子**

   - **命名约定**：使用 `use` 前缀命名，后跟功能描述（如 `useSystemTheme`, `useSearchFile`）
   - **职责单一**：每个钩子只关注一个功能领域，避免创建大而全的钩子
   - **返回格式**：返回对象形式的状态和方法，便于组件按需解构
   - **资源管理**：在钩子内部管理资源的创建和清理（如事件监听器、定时器）
   - **依赖注入**：通过参数接收外部依赖，提高钩子的复用性
   - **结构规范**：按以下顺序组织钩子内容：
     - 状态定义（使用 ref/reactive 定义响应式状态）
     - 计算属性（使用 computed 定义派生状态）
     - 辅助函数（内部使用的工具函数）
     - 主要方法（暴露给组件的核心功能）
     - 生命周期钩子（如 onMounted, onUnmounted）
     - 返回值（统一返回包含状态和方法的对象）

   **系统主题钩子示例**：

   ```typescript
   export function useSystemTheme() {
     const isDark = useDark({ selector: 'html' })
     const isAuto = useLocalStorage('theme-state', false)

     function handleChangeTheme() {
       isDark.value = !isDark.value
     }

     function handleChangeThemeState() {
       isAuto.value = !isAuto.value
       if (isAuto.value) {
         getThemeBySystem()
         window
           .matchMedia('(prefers-color-scheme: dark)')
           .addEventListener('change', getThemeBySystem)
       } else {
         window
           .matchMedia('(prefers-color-scheme: dark)')
           .removeEventListener('change', getThemeBySystem)
       }
     }

     function getThemeBySystem() {
       isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
     }

     onMounted(() => {
       if (isAuto.value) {
         isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
       }
       emitter.emit('theme-change', isDark.value)
     })

     watch(isDark, val => emitter.emit('theme-change', val))

     return { isDark, isAuto, handleChangeTheme, handleChangeThemeState }
   }
   ```

   **文件搜索钩子示例**：

   ```typescript
   export function useSearchFile(selectedPoint: Ref<string[]>) {
     // 状态定义
     const searchText = ref('')
     const searchResult = ref<ResultFileModel[]>([])
     const taskStatus = ref(SearchStatus.Default)
     const supportFolder = ref(false)

     // 依赖注入
     const { concurrentCount } = useDownloadConcurrent()

     // 主要方法
     function handleSearch() {
       searchResult.value = []
       taskStatus.value = SearchStatus.Processing

       searchHarddiskFile({
         name: searchText.value,
         disks: selectedPoint.value,
         concurrent: concurrentCount.value
       })
     }

     // 事件监听
     useRuntimeEvent<Nullable<ResultFileModel[]>>(
       'search-disk-file-output',
       async ({ payload }) => {
         if (!payload) {
           taskStatus.value = SearchStatus.Shutdown
           setTimeout(() => {
             taskStatus.value = SearchStatus.Default
           }, 500)
           return
         }
         if (taskStatus.value === SearchStatus.Shutdown) {
           return
         }

         const list = supportFolder.value ? payload : payload.filter(item => !item.is_dir)
         // 兼容 windows 路径中盘符的双斜杠
         const formatData = list.map(el => ({ ...el, path: el.path.replaceAll('\\\\', '\\') }))
         searchResult.value.push(...formatData)
         searchResult.value = uniqBy(searchResult.value, el => el.path)
       }
     )

     // 计算属性
     const renderItems = useThrottle(searchResult, 500, true)

     // 主要方法
     function handleStopSearchTask() {
       taskStatus.value = SearchStatus.Shutdown
       cancelSearchTask()
     }

     function clearResult() {
       searchResult.value.length = 0
     }

     // 返回值
     return {
       searchText,
       concurrentCount,
       searchResult,
       renderItems,
       supportFolder,
       taskStatus,
       clearResult,
       handleSearch,
       handleStopSearchTask
     }
   }
   ```

   **钩子组合与复用示例**：

   ```typescript
   // 组合多个钩子的示例
   export function useAppLayout(selectedPoint: Ref<string[]>) {
     // 组合多个功能单一的钩子
     const themeLogic = useSystemTheme()
     const windowLogic = useAppWindowOperation()
     const searchLogic = useSearchFile(selectedPoint)

     // 可以添加组合后的额外逻辑
     function handleLayoutChange() {
       // 处理布局变更逻辑
     }

     return {
       // 暴露组合后的状态和方法
       ...themeLogic,
       ...windowLogic,
       ...searchLogic,
       handleLayoutChange
     }
   }
   ```

2. **事件处理**

   - **命名约定**：使用 `handle` 前缀命名，后跟事件描述（如 `handleSearch`, `handleChangeTheme`）
   - **逻辑简洁**：事件处理函数应保持简洁，避免在模板中编写复杂的表达式
   - **参数验证**：在事件处理函数中验证参数的有效性
   - **错误处理**：使用 `try/catch` 包装异步操作，提供友好的错误提示
   - **状态管理**：在事件处理函数中更新组件状态或调用钩子方法
   - **异步操作**：对于耗时的异步操作，提供加载状态和取消机制
   - **事件类型**：明确事件参数的类型定义，避免使用 `any` 类型

   **事件处理示例**：

   ```typescript
   async function handleCopy(path: string) {
     try {
       await copy(path)
       message.success('复制成功')
     } catch (error) {
       message.error('复制失败')
       console.error(error)
     }
   }
   ```

3. **工具函数**

   - **命名约定**：使用 camelCase 命名，清晰描述函数功能（如 `getCorrectSize`, `removeTrailingZero`）
   - **职责单一**：每个工具函数只完成一个具体功能
   - **参数类型**：明确函数参数和返回值的类型，避免使用 `any` 类型
   - **错误处理**：函数内部处理可能的错误，提供友好的错误信息
   - **复用性**：确保函数具有通用性，便于在不同组件中复用
   - **跨平台兼容**：处理不同操作系统的差异（如路径分隔符、文件系统限制）
   - **文档注释**：为复杂函数添加 JSDoc 注释，说明参数、返回值和使用场景
   - **类型安全**：使用 TypeScript 泛型支持复杂数据结构，确保类型安全

   **文件大小格式化工具**：

   ```typescript
   export function getCorrectSize(size: string) {
     const sizeObj = Big(size)
     const gbOffset = Big(1024).pow(3)
     const mbOffset = Big(1024).pow(2)
     const kbOffset = 1024

     if (sizeObj.gt(gbOffset)) {
       return `${removeTrailingZero(sizeObj.div(gbOffset).toFixed(2))} GB`
     } else if (sizeObj.gt(mbOffset)) {
       return `${removeTrailingZero(sizeObj.div(mbOffset).toFixed(2))} MB`
     } else if (sizeObj.gt(kbOffset)) {
       return `${removeTrailingZero(sizeObj.div(kbOffset).toFixed(2))} KB`
     }
     return `${removeTrailingZero(sizeObj.toFixed(2))} B`
   }
   ```

### 样式规范

1. **样式使用**

   - 优先使用 UnoCSS 原子化 CSS
   - 组件样式使用 `scoped` 属性
   - 全局样式定义在 `src/assets/styles/base.scss` 中
   - 使用 SCSS 作为 CSS 预处理器

2. **主题变量**
   - 使用 Naive UI 的主题变量系统
   - 通过 `useThemeVars` 钩子获取主题变量
   - 将主题变量注入到 CSS 变量中，方便在组件中使用

### 状态管理规范

1. **本地存储**

   - 使用 `@tauri-apps/plugin-store` 进行持久化存储
   - 通过自定义钩子 `usePersistentStorage` 封装本地存储操作

2. **事件总线**
   - 使用 `mitt` 作为事件总线
   - 通过 `emitter` 实例进行事件的发布和订阅
   - 避免过多使用事件总线，优先使用组件通信

### 后端通信规范

1. **通信方式**

   - 使用 Tauri 的 `invoke` 机制进行前后端通信
   - 后端命令定义在 `src-tauri/src` 目录下的不同功能模块中
   - 前端通过 `src/backend-channel` 目录下的工具函数调用后端命令

2. **数据模型**

   - 前后端数据模型定义在 `src/backend-channel/models` 目录下
   - 使用 TypeScript 接口定义数据结构，确保类型安全
   - 确保前后端数据类型一致，避免类型不匹配问题
   - 复杂数据结构应明确其字段类型和约束条件

3. **命令组织**

   - 后端命令按功能模块组织到不同的文件中（如 `file_search.rs`, `download.rs`）
   - 每个命令都有明确的输入和输出类型
   - 使用 `tauri::command` 宏注册后端命令
   - 命令函数应保持简洁，遵循单一职责原则

   **后端命令示例**：

   ```rust
   // src-tauri/src/file_search.rs
   #[tauri::command]
   pub async fn search_disk_file_real_time(params: SearchFileParams) -> Result<(), String> {
       // 搜索逻辑实现
   }

   #[tauri::command]
   pub async fn cancel_search_task() -> Result<(), String> {
       // 取消搜索任务逻辑
   }
   ```

   **前端调用示例**：

   ```typescript
   // src/backend-channel/file-search.ts
   import { invoke } from '@tauri-apps/api'

   export interface SearchFileParams {
     name: string
     disks: string[]
     concurrent: number
   }

   export async function searchHarddiskFile(params: SearchFileParams): Promise<void> {
     await invoke('search_disk_file_real_time', { params })
   }

   export async function cancelSearchTask(): Promise<void> {
     await invoke('cancel_search_task')
   }
   ```

4. **事件流处理**

   - 对于长时间运行的任务，使用事件流进行结果推送
   - 前端通过 `useRuntimeEvent` 钩子监听后端事件
   - 后端使用 `emit` 函数发送事件

   **事件处理示例**：

   ```typescript
   // 前端监听后端事件
   useRuntimeEvent<Nullable<ResultFileModel[]>>('search-disk-file-output', async ({ payload }) => {
     if (!payload) {
       taskStatus.value = SearchStatus.Shutdown
       return
     }

     // 处理搜索结果
     const list = supportFolder.value ? payload : payload.filter(item => !item.is_dir)
     // 兼容 windows 路径中盘符的双斜杠
     const formatData = list.map(el => ({ ...el, path: el.path.replaceAll('\\\\', '\\') }))
     searchResult.value.push(...formatData)
     searchResult.value = uniqBy(searchResult.value, el => el.path)
   })
   ```

5. **错误处理**

   - 后端命令应返回 `Result` 类型，包含成功或失败信息
   - 前端调用后端命令时应使用 `try/catch` 包装，处理可能的错误
   - 提供友好的错误提示给用户

6. **性能优化**

   - 对于大数据量传输，考虑分批次发送数据
   - 避免在主线程上执行耗时操作，使用异步函数
   - 合理设置并发数，避免系统资源过度消耗

7. **安全性**
   - 后端命令应对输入参数进行验证，避免安全漏洞
   - 遵循最小权限原则，只授予应用必要的权限
   - 避免在命令中暴露敏感信息

### 后端开发规范

1. **代码组织**

   - 按功能模块划分文件（如 `file_search.rs`, `download.rs`, `autostart.rs`）
   - 使用 `mod` 声明子模块，保持代码结构清晰
   - 每个模块应有明确的功能边界

2. **命令定义**

   - 使用 `tauri::command` 宏定义后端命令
   - 命令参数和返回值类型应明确
   - 命令函数名使用 snake_case 命名风格

3. **错误处理**

   - 使用 `anyhow` 库处理错误
   - 为错误提供清晰的描述信息
   - 避免将内部错误细节暴露给前端

4. **性能优化**

   - 使用异步编程模型（`async/await`）
   - 合理使用线程池处理并发任务
   - 避免不必要的文件 I/O 和网络请求

5. **插件开发**

   - 对于可复用功能，考虑封装为 Tauri 插件
   - 插件应提供清晰的 API 和文档

   **后端插件示例**：

   ```rust
   // src-tauri/src/autostart.rs
   #[tauri::plugin]
   pub fn init() -> TauriResult<impl TauriPlugin<AppHandle>> {
       Ok(TauriPlugin::new("autostart")
           .invoke_handler(tauri::generate_handler![set_auto_start, is_auto_start_enabled]))
   }
   ```

6. **权限管理**
   - 在 `src-tauri/capabilities` 目录下定义应用权限
   - 遵循最小权限原则，只授予必要的权限
   - 明确区分开发环境和生产环境的权限配置

### 工具函数规范

1. **函数组织**

   - **按功能分类**：工具函数按功能分类到不同的文件中（如 `event.ts`, `storage.ts`, `development.ts`）
   - **单一职责**：每个函数只关注一个功能点，避免创建大而全的函数
   - **命名清晰**：函数名要清晰表达其功能（如 `removeTrailingZero`, `getCorrectSize`）
   - **导出方式**：使用 `export function` 导出单个函数，便于按需导入

2. **错误处理**

   - **异步操作**：使用 `try...catch` 捕获异步操作的错误
   - **错误信息**：错误信息要清晰、具体，包含足够的上下文信息
   - **UI 分离**：避免在工具函数中直接处理 UI 反馈，将错误信息返回给调用者处理
   - **类型安全**：使用 TypeScript 的 `Result` 类型或可选类型表示可能的错误

3. **性能优化**

   - **节流防抖**：对频繁调用的函数使用节流或防抖（如搜索框输入处理）
   - **缓存机制**：合理使用缓存减少重复计算（如文件路径解析结果）
   - **惰性求值**：对于复杂计算，考虑使用惰性求值延迟计算时机
   - **避免重复操作**：避免在循环中进行重复的 DOM 操作或网络请求

4. **工具函数示例**

   **事件总线工具**：

   ```typescript
   // src/utils/event.ts
   import mitt, { Emitter } from 'mitt'

   export type GlobalEventMap = {
     'theme-change': boolean
     'close-window': void
   }

   export const emitter = mitt<GlobalEventMap>()

   export interface UseEmitterOptions<T extends Record<string, unknown>> {
     once?: boolean
     instance?: Emitter<T>
   }

   export function useEmitter<
     Events extends Record<string, unknown> = GlobalEventMap,
     Key extends keyof Events = keyof Events
   >(event: Key, handler: (arg: Events[Key]) => void, options?: UseEmitterOptions<Events>) {
     const { instance = emitter, once } = options || {}

     const currentInstance = instance as Emitter<any>

     currentInstance.on(event, (...arg) => {
       handler(...arg)
       if (once) {
         off()
       }
     })

     function off() {
       currentInstance.off(event, handler)
     }

     onUnmounted(off)

     return off
   }
   ```

   **文件大小格式化工具**：

   ```typescript
   // src/views/FileSearch/logic.ts
   function removeTrailingZero(numStr: string): string {
     numStr = numStr.replace(/\.?0+$/, '')
     return numStr
   }

   export function getCorrectSize(size: string) {
     const sizeObj = Big(size)
     const gbOffset = Big(1024).pow(3)
     const mbOffset = Big(1024).pow(2)
     const kbOffset = 1024

     if (sizeObj.gt(gbOffset)) {
       return `${removeTrailingZero(sizeObj.div(gbOffset).toFixed(2))} GB`
     } else if (sizeObj.gt(mbOffset)) {
       return `${removeTrailingZero(sizeObj.div(mbOffset).toFixed(2))} MB`
     } else if (sizeObj.gt(kbOffset)) {
       return `${removeTrailingZero(sizeObj.div(kbOffset).toFixed(2))} KB`
     }
     return `${removeTrailingZero(sizeObj.toFixed(2))} B`
   }
   ```

5. **类型安全**

   - 明确函数参数和返回值的类型
   - 使用 TypeScript 的泛型支持复杂数据结构
   - 避免使用 `any` 类型，确保类型安全

6. **可测试性**

   - 工具函数应易于测试，避免依赖全局状态
   - 函数参数应明确，便于模拟测试数据
   - 避免在工具函数中直接依赖外部资源

7. **跨平台兼容性**

   - 考虑不同操作系统的差异（如文件路径分隔符）
   - 使用 Tauri 提供的跨平台 API，避免直接使用平台特定代码
   - 对于平台特定代码，使用条件判断进行处理

   **跨平台文件浏览器示例**：

   ```typescript
   export function useViewFileInExplorer() {
     const message = useMessage()

     function openInExplorer(file: ResultFileModel) {
       const os = platform()
       if (os === 'windows') {
         return windowsOpener(file)
       } else if (os === 'macos') {
         return macOpener(file)
       } else if (os === 'linux') {
         return linuxOpener(file)
       }

       message.error('暂不支持该操作系统')
     }

     function windowsOpener(file: ResultFileModel) {
       try {
         return Command.create('explorer', `/select,${file.path}`).execute()
       } catch (error) {
         message.error(String(error))
       }
     }

     function macOpener(file: ResultFileModel) {
       try {
         return Command.create('open', `-R ${file.path}`).execute()
       } catch (error) {
         message.error(String(error))
       }
     }

     function linuxOpener(file: ResultFileModel) {
       try {
         if (file.is_dir) {
           return Command.create('xdg-open', file.path).execute()
         }
         const pathList = file.path.split(/(\\|\/)/)
         pathList.pop()
         if (!pathList.length) return message.error('文件路径错误')

         return Command.create('xdg-open', `${pathList.join('/')}`).execute()
       } catch (error) {
         message.error(String(error))
       }
     }

     return { openInExplorer }
   }
   ```

### 其他规范

1. **注释规范**

   - 为复杂的业务逻辑添加注释
   - 为函数和接口添加 JSDoc 注释
   - 注释要清晰、准确，避免冗余

2. **错误处理**

   - 使用 `try...catch` 捕获异步操作的错误
   - 错误信息要清晰、具体
   - 为用户提供友好的错误提示

3. **性能优化**

   - 合理使用 Vue 的 `keep-alive` 组件
   - 对列表数据使用虚拟滚动
   - 避免在模板中使用复杂的计算表达式

4. **安全规范**

   - 避免使用 `eval` 和 `Function` 构造函数
   - 对用户输入进行验证和过滤
   - 避免暴露敏感信息

5. **可访问性**

   - 为所有交互元素添加适当的 ARIA 属性
   - 确保键盘导航正常工作
   - 确保颜色对比度符合标准

6. **国际化**
   - 预留国际化接口
   - 避免在代码中硬编码字符串
   - 使用统一的字符串管理方式

### 架构模式

- 采用前后端分离架构，前端使用 Vue 3 组件化开发
- 后端使用 Rust + Tauri 提供原生功能支持
- 前后端通信通过 Tauri 的 invoke 机制
- 使用插件化架构组织 Rust 代码，每个功能模块封装为独立插件
- 状态管理使用 Vue 3 的 Composition API 和本地存储（@tauri-apps/plugin-store）
- 路由使用 Vue Router（^4.6.3）

### 目录结构

```
├── src/                 # 前端源代码
│   ├── assets/          # 静态资源
│   ├── backend-channel/ # 前后端通信相关模型和工具
│   ├── components/      # Vue 组件
│   ├── hooks/           # Vue 自定义钩子
│   ├── router/          # 路由配置
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 通用工具函数
│   ├── views/           # 页面组件
│   ├── App.vue          # 根组件
│   └── main.ts          # 入口文件
├── src-tauri/           # Tauri 后端代码
│   ├── capabilities/    # 权限配置
│   ├── icons/           # 应用图标
│   ├── src/             # Rust 源代码
│   ├── Cargo.toml       # Rust 依赖配置
│   └── tauri.conf.json  # Tauri 配置
├── public/              # 公共资源
├── openspec/            # 项目规范文档
├── .husky/              # Git 钩子
├── .vscode/             # VS Code 配置
├── package.json         # 前端依赖和脚本
├── tsconfig.json        # TypeScript 配置
├── vite.config.ts       # Vite 配置
├── unocss.config.ts     # UnoCSS 配置
├── .oxlintrc.json       # oxlint 配置
└── .oxfmtrc.json        # oxfmt 配置
```

### 测试策略

- 目前项目未实现自动化测试
- 开发过程中采用手动测试验证功能
- 计划在后续版本中添加单元测试和端到端测试

### Git 工作流程

- 主分支：main（受保护，仅允许合并请求）
- 开发分支：develop（日常开发）
- 功能分支：feature/xxx（开发新功能）
- 修复分支：fix/xxx（修复 bug）
- 提交信息：使用中文，格式清晰，描述具体变更内容
- 代码提交前必须通过 lint 和格式化检查（通过 husky pre-commit 钩子强制执行）

### 项目脚本

- `npm run dev`：启动开发服务器
- `npm run build`：构建生产版本
- `npm run preview`：预览生产版本
- `npm run tauri`：运行 Tauri 命令
- `npm run lint`：使用 oxlint 检查并修复代码
- `npm run fmt`：使用 oxfmt 格式化代码
- `npm run prepare`：初始化 husky 钩子

### 配置文件说明

#### TypeScript 配置 (tsconfig.json)

- 严格模式：启用所有严格类型检查选项
- 模块解析：使用 bundler 模式
- 路径别名：`@` 指向 `./src` 目录
- 包含文件：`src/**/*.ts`, `src/**/*.d.ts`, `src/**/*.tsx`, `src/**/*.vue`

#### Vite 配置 (vite.config.ts)

- 插件：Vue、JSX、AutoImport、UnoCSS、Components、Legacy、Vue DevTools
- 路径别名：`@` 指向 `./src` 目录
- 服务器配置：固定端口 3000，严格端口检查
- 忽略 `src-tauri` 目录的监听

#### UnoCSS 配置 (unocss.config.ts)

- 启用变体组转换
- 支持多种文件类型的内容扫描

#### oxlint 配置 (.oxlintrc.json)

- 插件：unicorn、typescript、oxc
- 规则：启用多种代码质量检查，其中未使用变量为错误级别
- 忽略文件：`src/types/auto-imports.d.ts`, `src/types/components.d.ts`

#### oxfmt 配置 (.oxfmtrc.json)

- 尾随逗号：none
- 缩进宽度：2 个空格
- 分号：不使用
- 行尾：lf
- 引号：单引号
- 打印宽度：100 个字符
- 箭头函数括号：avoid
- 忽略文件：`src/types/auto-imports.d.ts`, `src/types/components.d.ts`

## 领域上下文

### 核心功能模块

- **文件搜索**：实时搜索本地文件系统
- **翻译工具**：文本翻译功能
- **待办事项**：任务管理功能
- **护眼模式**：屏幕护眼功能
- **Windows 激活**：Windows 系统激活工具
- **文件下载**：文件下载功能
- **系统信息**：查看 CPU、硬盘等系统信息

## 重要约束

- 必须兼容 Windows、macOS 和 Linux 平台
- 应用体积应保持轻量，避免不必要的依赖
- 性能要求：文件搜索等功能必须保持高效响应
- 安全性：确保应用不收集用户隐私数据

## 外部依赖

- Tauri 插件生态系统（http、cli、os、notification、shell、fs、dialog、store 等）
- 系统 API：文件系统访问、系统信息获取、网络请求等
- 第三方库：如 mammoth（Word 文档处理）、xlsx（Excel 文档处理）等
