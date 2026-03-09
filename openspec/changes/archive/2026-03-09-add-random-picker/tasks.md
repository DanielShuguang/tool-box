## 1. 类型定义

- [x] 1.1 创建 `src/views/RandomPicker/types/picker.ts` 类型文件
- [x] 1.2 定义 `Option` 候选项类型
- [x] 1.3 定义 `PickTarget` 选择目标类型
- [x] 1.4 定义 `PickMode` 选择模式枚举
- [x] 1.5 定义 `PickerConfig` 选择配置类型
- [x] 1.6 定义 `PickResult` 选择结果类型

## 2. 状态管理

- [x] 2.1 创建 `src/stores/randomPicker.ts` Pinia Store
- [x] 2.2 实现候选项列表状态和方法
- [x] 2.3 实现选择目标配置状态和方法
- [x] 2.4 实现选择配置状态
- [x] 2.5 实现选择历史状态和方法
- [x] 2.6 配置持久化存储

## 3. 选择核心逻辑

- [x] 3.1 创建选择核心逻辑（已整合到 Store）
- [x] 3.2 实现普通选择算法（Fisher-Yates 洗牌）
- [x] 3.3 实现权重选择算法
- [x] 3.4 实现顺序选择逻辑
- [x] 3.5 实现已选项剔除逻辑
- [x] 3.6 实现禁用过滤逻辑

## 4. 候选项管理逻辑

- [x] 4.1 创建候选项管理逻辑（已整合到 OptionList.vue）
- [x] 4.2 实现添加候选项方法
- [x] 4.3 实现批量导入候选项方法
- [x] 4.4 实现编辑/删除候选项方法
- [x] 4.5 实现禁用/启用方法
- [x] 4.6 实现批量禁用方法

## 5. 前端组件 - 候选项列表

- [x] 5.1 创建 `src/views/RandomPicker/components/OptionList.vue`
- [x] 5.2 实现候选项列表展示
- [x] 5.3 实现禁用状态视觉反馈
- [x] 5.4 实现添加/导入候选项对话框
- [x] 5.5 实现批量操作功能

## 6. 前端组件 - 选择区域

- [x] 6.1 创建 `src/views/RandomPicker/components/PickArea.vue`
- [x] 6.2 实现选择模式选择器
- [x] 6.3 实现选取数量配置
- [x] 6.4 实现已选剔除配置开关
- [x] 6.5 实现选择按钮和动画效果

## 7. 前端组件 - 选择目标配置

- [x] 7.1 创建 `src/views/RandomPicker/components/TargetConfig.vue`
- [x] 7.2 实现目标列表展示
- [x] 7.3 实现目标添加/编辑/删除
- [x] 7.4 实现目标排序功能

## 8. 前端组件 - 选择历史

- [x] 8.1 创建 `src/views/RandomPicker/components/PickHistory.vue`
- [x] 8.2 实现历史记录列表展示
- [x] 8.3 实现撤销最近选择功能
- [x] 8.4 实现清空历史功能

## 9. 导出功能

- [x] 9.1 创建导出逻辑（已整合到 ExportDialog.vue）
- [x] 9.2 实现 JSON 格式导出
- [x] 9.3 实现 CSV 格式导出
- [x] 9.4 创建 `src/views/RandomPicker/components/ExportDialog.vue` 导出对话框
- [x] 9.5 实现导出范围选择（当前/全部）

## 10. 主页面集成

- [x] 10.1 创建 `src/views/RandomPicker/RandomPicker.vue` 主页面
- [x] 10.2 集成候选项列表组件
- [x] 10.3 集成选择区域组件
- [x] 10.4 集成目标配置组件（顺序选择模式时显示）
- [x] 10.5 集成选择历史组件
- [x] 10.6 实现页面布局和响应式适配

## 11. 路由配置

- [x] 11.1 在 `src/router/index.ts` 添加随机选择工具路由
- [x] 11.2 配置路由元信息（title）

## 12. 测试与验证

- [x] 12.1 测试普通选择功能
- [x] 12.2 测试顺序选择功能
- [x] 12.3 测试权重选择功能
- [x] 12.4 测试已选项剔除功能
- [x] 12.5 测试禁用功能
- [x] 12.6 测试导出功能
- [x] 12.7 测试数据持久化
- [x] 12.8 运行代码检查（lint、fmt、check）
