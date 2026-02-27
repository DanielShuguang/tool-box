# Tool Box - AGENTS.md

## Project Overview

Personal desktop utility application built with Tauri (Rust backend + Vue 3 frontend).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vue 3 (Composition API), TypeScript, Vite |
| UI Framework | Naive UI |
| CSS | UnoCSS (Atomic CSS) |
| State Management | Pinia |
| Routing | Vue Router |
| Animation | Motion-v |
| Desktop API | Tauri API |
| Backend | Tauri 2.x (Rust) |
| Async Runtime | Tokio |
| HTTP Client | reqwest |
| Package Manager | pnpm 10.4+ |

---

## Environment Requirements

- **Node.js**: >= 22.18.0 (managed by Volta)
- **Rust**: >= 1.88
- **pnpm**: >= 10.4.1

---

## Code Conventions

### Frontend (Vue 3 + TypeScript)

**File Naming**
- Components: `PascalCase` (e.g., `Download.vue`)
- Stores: `camelCase` (e.g., `download.ts`)
- Utilities: `camelCase` (e.g., `formatDate.ts`)
- Types: `camelCase` (e.g., `types/download.ts`)

**Code Style**
- Single quotes
- No semicolons
- 2 space indentation
- Line width: 100 characters
- Arrow functions: no parentheses for single parameter
- No trailing commas
- Max 300 lines per file
- Max 3 function parameters (use object params if exceeded)
- Comments in Chinese when necessary

**Component Structure**
```vue
<script setup lang="ts">
// 1. Imports
// 2. Types/Interfaces
// 3. Props/Emits
// 4. Reactive state
// 5. Computed
// 6. Watch
// 7. Methods
// 8. Lifecycle
</script>

<template>
  <!-- Template content -->
</template>

<style scoped lang="scss">
/* Scoped styles */
</style>
```

**Component Development**
- Use `<script setup lang="ts">` syntax
- Component file structure: `.vue` (template) + `logic.ts` (logic)
- Use Composition API
- Use TypeScript for type definitions
- Use Naive UI component library
- Split complex features into independent components

**State Management (Pinia)**
- Use setup store pattern with `defineStore`
- Store files: `src/stores/*.ts`
- Naming: feature-based (e.g., `download.ts`, `musicPlayer.ts`)

**Auto-imports**
Project uses Vite's unplugin plugins. Check `src/types/auto-imports.d.ts` and `src/types/components.d.ts` for auto-imported components and functions.

### Backend (Rust)

**File Naming**
- Modules: `snake_case` (e.g., `file_search`)
- Functions/Variables: `snake_case` (e.g., `search_disk_file`)
- Structs: `PascalCase` (e.g., `SearchResult`)
- Enums: `PascalCase` (e.g., `FileStatus`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_FILE_SIZE`)

**Module Organization**
- One module per feature domain
- Commands defined with `#[tauri::command]` macro
- Use `anyhow` for error handling

**Command Pattern**
```rust
#[tauri::command]
async fn command_name(
    state: tauri::State<'_, AppState>,
    param: ParamType,
) -> Result<ReturnType, String> {
    // Implementation
}
```

---

## Naming Conventions

### TypeScript / JavaScript

| Type | Naming | Example |
|------|--------|---------|
| Components | PascalCase | `AppSettings.vue` |
| Files | kebab-case | `file-search.ts` |
| Variables/Functions | camelCase | `searchDiskFile` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `SearchResult` |
| Enums | PascalCase | `FileStatus` |

### Rust

| Type | Naming | Example |
|------|--------|---------|
| Modules | snake_case | `file_search` |
| Functions/Variables | snake_case | `search_disk_file` |
| Structs | PascalCase | `SearchResult` |
| Enums | PascalCase | `FileStatus` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |

---

## Code Quality

### Frontend Commands

```bash
# Lint check and auto-fix (only modified files)
npx oxlint --fix <modified-files>

# Code formatting (only modified files)
npx oxfmt <modified-files>

# Type check (with incremental build cache)
pnpm check
```

### Backend Commands

```bash
# Rust code formatting
cargo fmt

# Rust code linting
cargo clippy
```

### Required Workflow
After code modifications, MUST run:
1. `pnpm lint` - Lint check
2. `pnpm fmt` - Code formatting
3. `pnpm build` - Build verification

---

## Linting & Formatting

### Tools
- **Linter**: oxlint (`.oxlintrc.json`)
- **Formatter**: oxfmt (`.oxfmtrc.json`)
- **Type Check**: vue-tsc (`tsconfig.json`)
- **Git Hooks**: husky (pre-commit hook)

### Commands
```bash
pnpm lint        # Run oxlint with auto-fix
pnpm fmt         # Run oxfmt
pnpm check       # Type check
```

---

## Testing

- **Framework**: Vitest 4.0+
- **Assertions**: @testing-library/jest-dom

```bash
pnpm test           # Run tests
pnpm test:ui       # Run with UI
pnpm test:coverage  # Run with coverage
```

### Testing Notes
When testing code that calls Tauri commands or uses `invoke`, use `@tauri-apps/api/mocks` to mock the backend behavior instead of calling the actual backend.

---

## Tauri Commands Development

### Backend (Rust) Development
1. Create module in `src-tauri/src/`
2. Define command with `#[tauri::command]` macro
3. Register command in `lib.rs` `invoke_handler`
4. Return type: `Result<T, String>`

### Frontend (TypeScript) Development
1. Create file in `src/backend-channel/`
2. Use `invoke` function to call backend commands
3. Define TypeScript types corresponding to Rust structs

---

## Tauri Commands API

### Registration (Rust)
Commands registered in `src-tauri/src/lib.rs`:
```rust
.invoke_handler(tauri::generate_handler![
    command_name,
    // ...other commands
])
```

---

## Routing

- **Mode**: Hash history (`createWebHashHistory`)
- **Pattern**: Lazy-loaded views
- **Meta**: Each route includes `title` in meta

```typescript
{
  path: '/feature',
  component: () => import('@/views/Feature/Feature.vue'),
  meta: { title: 'Feature Name' }
}
```

---

## Git Commit

- Use husky pre-commit hook (auto-runs lint before commit)
- Commit messages in Chinese
- Keep commit messages concise and clear

---

## Tauri Plugins

| Plugin | Purpose |
|--------|---------|
| tauri-plugin-fs | File system access |
| tauri-plugin-dialog | Native dialogs |
| tauri-plugin-shell | Shell commands |
| tauri-plugin-notification | System notifications |
| tauri-plugin-os | OS info |
| tauri-plugin-http | HTTP requests |
| tauri-plugin-store | Persistent storage |
| tauri-plugin-cli | CLI arguments |
| tauri-plugin-autostart | Auto-start |

---

## Development Commands

```bash
pnpm dev          # Start Vite dev server
pnpm tauri dev   # Start Tauri development
pnpm build       # Build frontend (type check + Vite build)
pnpm tauri build # Build Tauri application
pnpm test        # Run tests
pnpm lint        # Lint with auto-fix
pnpm check       # Type check
```

---

## Build Requirements

- Node.js >= 22.18.0
- Rust >= 1.88
- pnpm >= 10.4.1

---

## Window Configuration

- **Main Window**: `label: "main"`, decorations disabled, min 1024x768
- **Lyrics Window**: `label: "lyrics-window"`, transparent, always on top, 600x80

---

## Important Notes

### Code Quality
1. After code modifications, MUST run `pnpm lint`, `pnpm fmt`, and `pnpm build`
2. Follow existing code style and naming conventions

### Feature Development
1. New features: create new page in `src/views/`
2. New Tauri commands: update both frontend and backend

### Type Safety
1. Use TypeScript strict mode
2. Avoid `any` type - use `unknown` or specific types instead
