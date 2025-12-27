# 变更：优化音乐播放器进度存储和加载机制

## 为什么

当前音乐播放器的播放进度存储和加载机制存在以下问题：

1. **存储结构冗余**：

   - 当前使用 `Record<string, number>` 存储所有音乐的播放进度
   - 实际上只需要存储当前正在播放的单个音乐进度
   - 多音乐进度存储导致存储空间浪费，且增加了数据管理的复杂度

2. **初始化加载问题**：

   - 初始化加载音乐进度时，仅恢复播放时间戳
   - 未触发对应音乐音轨的预加载机制
   - 用户点击播放按钮时，需要等待音轨加载完成才能继续播放
   - 导致播放延迟或无法立即继续播放，影响用户体验

3. **切换音乐时的状态管理**：
   - 当前切换音乐时，需要更新多个音乐的进度信息
   - 状态管理逻辑复杂，容易出现数据不一致的问题

为了解决这些问题，需要改造播放进度存储格式为单音乐进度存储，并在初始化加载时预加载目标音乐音轨，确保用户能够无缝继续播放。

## 变更内容

### 1. 播放进度存储格式改造

#### 1.1 重构存储结构

将当前的多音乐进度存储 `Record<string, number>` 改造为单音乐进度存储结构：

```typescript
// 修改前
interface PlaybackProgressState {
  playbackProgress: Record<string, number>
}

// 修改后
interface PlaybackProgressState {
  currentTrackId: string | null
  currentTime: number
  isPlaying: boolean
}
```

#### 1.2 更新 Store 实现

修改 `src/stores/musicPlayer.ts` 中的 `usePlaybackProgressStore`：

- 移除 `Record<string, number>` 类型的 `playbackProgress`
- 新增 `currentTrackId`、`currentTime`、`isPlaying` 状态
- 更新 `saveProgress` 方法，仅保存当前播放音乐的进度
- 更新 `getProgress` 方法，返回当前播放音乐的进度
- 移除 `clearProgress` 和 `clearAllProgress` 方法（不再需要）

#### 1.3 更新 Hook 实现

修改 `src/views/MusicPlayer/hooks/usePlaybackProgress.ts`：

- 简化 Hook 的实现，移除不必要的 trackId 参数
- 直接使用 store 中的 `currentTrackId` 和 `currentTime`
- 更新 `setCurrentTrack` 方法，在切换音乐时更新 store 状态

### 2. 初始化加载音乐进度优化

#### 2.1 添加音轨预加载机制

在 `src/views/MusicPlayer/hooks/useAudioCore.ts` 中添加预加载方法：

```typescript
async function preloadTrack(track: AudioFile): Promise<void> {
  if (!audio.value) return

  try {
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl)
      currentBlobUrl = null
    }

    const audioData = await readAudioFile({ filePath: track.path })
    const mimeType = getMimeType(track.path)
    const blob = new Blob([audioData], { type: mimeType })
    currentBlobUrl = URL.createObjectURL(blob)

    audio.value.src = currentBlobUrl
    await audio.value.load()
  } catch (err) {
    console.error('Audio preload error:', err)
    currentBlobUrl = null
  }
}
```

#### 2.2 更新初始化加载逻辑

在 `src/views/MusicPlayer/hooks/usePlayerCoordinator.ts` 中更新初始化逻辑：

- 在组件初始化时，检查 `playbackProgressStore` 中是否有保存的播放进度
- 如果有保存的进度，获取对应的音乐信息
- 调用 `audioCore.preloadTrack()` 预加载该音乐音轨
- 预加载完成后，设置播放时间到保存的进度位置

#### 2.3 更新播放器协调器

修改 `src/views/MusicPlayer/hooks/usePlayerCoordinator.ts` 中的 `playTrack` 方法：

- 在播放音乐时，先检查是否已预加载该音乐
- 如果已预加载，直接使用预加载的音轨
- 如果未预加载，则加载新音轨

### 3. 整体功能验证

完成上述改造后，进行全面测试验证：

- 验证单音乐进度存储功能正常工作
- 验证音乐切换时进度正确更新
- 验证初始化加载进度后能够立即响应播放操作
- 验证预加载机制正常工作，无播放延迟

## 技术方案

### 3.1 存储结构设计

新的存储结构更加简洁，仅包含必要的信息：

```typescript
export interface PlaybackProgressState {
  /** 当前播放音乐的 ID */
  currentTrackId: string | null
  /** 当前播放时间（秒） */
  currentTime: number
  /** 是否正在播放 */
  isPlaying: boolean
}
```

### 3.2 Store 实现方案

```typescript
export const usePlaybackProgressStore = defineStore(
  'playbackProgress',
  () => {
    const currentTrackId = ref<string | null>(null)
    const currentTime = ref(0)
    const isPlaying = ref(false)

    function saveProgress(trackId: string, time: number) {
      currentTrackId.value = trackId
      currentTime.value = time
      isPlaying.value = true
    }

    function getProgress(): { trackId: string | null; time: number } {
      return {
        trackId: currentTrackId.value,
        time: currentTime.value
      }
    }

    function pauseProgress() {
      isPlaying.value = false
    }

    function clearProgress() {
      currentTrackId.value = null
      currentTime.value = 0
      isPlaying.value = false
    }

    return {
      currentTrackId,
      currentTime,
      isPlaying,
      saveProgress,
      getProgress,
      pauseProgress,
      clearProgress
    }
  },
  {
    persist: {
      fileName: ConfigFile.MusicPlayer,
      key: 'playback-progress',
      keys: ['currentTrackId', 'currentTime', 'isPlaying']
    }
  }
)
```

### 3.3 Hook 实现方案

```typescript
export function usePlaybackProgress() {
  const playbackProgressStore = usePlaybackProgressStore()
  const { saveProgress, getProgress, pauseProgress, clearProgress } = playbackProgressStore

  const { currentTrackId, currentTime, isPlaying } = storeToRefs(playbackProgressStore)

  function setCurrentTrack(trackId: string | null) {
    if (trackId) {
      const progress = getProgress()
      if (progress.trackId !== trackId) {
        currentTime.value = 0
      }
    }
  }

  return {
    currentTrackId,
    currentTime,
    isPlaying,
    saveProgress,
    getProgress,
    setCurrentTrack,
    pauseProgress,
    clearProgress
  }
}
```

### 3.4 预加载机制实现

```typescript
// 在 useAudioCore.ts 中添加
const preloadedTrack = ref<AudioFile | null>(null)

async function preloadTrack(track: AudioFile): Promise<void> {
  if (!audio.value) return

  try {
    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl)
      currentBlobUrl = null
    }

    const audioData = await readAudioFile({ filePath: track.path })
    const mimeType = getMimeType(track.path)
    const blob = new Blob([audioData], { type: mimeType })
    currentBlobUrl = URL.createObjectURL(blob)

    audio.value.src = currentBlobUrl
    await audio.value.load()

    preloadedTrack.value = track
    currentTrackPath = track.path
  } catch (err) {
    console.error('Audio preload error:', err)
    currentBlobUrl = null
    preloadedTrack.value = null
  }
}

function applyPreloadedTrack(track: AudioFile): boolean {
  return preloadedTrack.value?.id === track.id
}
```

### 3.5 初始化加载实现

```typescript
// 在 usePlayerCoordinator.ts 中添加
async function initializeProgress() {
  const progress = progress.getProgress()
  const { trackId, time } = progress

  if (trackId && time > 0) {
    const track = playlist.playlist.value.find(t => t.id === trackId)
    if (track) {
      await audioCore.preloadTrack(track)
      audioCore.seekTo(time)
      progress.setCurrentTrack(trackId)
    }
  }
}

// 在组件初始化时调用
onMounted(async () => {
  await initializeProgress()
})
```

## 风险评估

### 技术风险

1. **数据迁移风险**：

   - 从多音乐进度存储迁移到单音乐进度存储可能导致历史数据丢失
   - **应对措施**：在迁移时保留当前播放音乐的进度，其他音乐的进度可以忽略

2. **预加载性能风险**：

   - 预加载音乐音轨可能增加初始化时间
   - **应对措施**：预加载过程在后台进行，不阻塞用户界面

3. **内存占用风险**：
   - 预加载音轨可能增加内存占用
   - **应对措施**：限制预加载的音轨数量，及时释放不再需要的音轨资源

### 兼容性风险

1. **破坏性变更**：

   - 修改存储结构属于破坏性变更，可能导致旧版本数据无法使用
   - **应对措施**：在应用启动时检查数据格式，必要时进行数据迁移

2. **API 变更**：
   - Hook 和 Store 的 API 发生变化，可能影响其他代码
   - **应对措施**：全面检查所有使用这些 API 的地方，确保正确更新

### 测试风险

1. **测试覆盖**：

   - 需要确保新的存储结构和预加载机制在各种场景下正常工作
   - **应对措施**：编写全面的单元测试和集成测试

2. **性能测试**：
   - 需要验证预加载机制对性能的影响
   - **应对措施**：对比改造前后的初始化时间和内存占用

## 影响

### 受影响规范

- 无（优化现有功能，不影响功能规范）

### 受影响代码

#### 修改文件

- `src/stores/musicPlayer.ts` - 重构播放进度存储结构

  - 修改 `usePlaybackProgressStore` 的状态定义
  - 更新 `saveProgress`、`getProgress` 等方法
  - 移除 `clearProgress` 和 `clearAllProgress` 方法

- `src/views/MusicPlayer/hooks/usePlaybackProgress.ts` - 简化 Hook 实现

  - 移除不必要的 trackId 参数
  - 更新 `setCurrentTrack` 方法

- `src/views/MusicPlayer/hooks/useAudioCore.ts` - 添加预加载功能

  - 新增 `preloadTrack` 方法
  - 新增 `applyPreloadedTrack` 方法
  - 新增 `preloadedTrack` 状态

- `src/views/MusicPlayer/hooks/usePlayerCoordinator.ts` - 更新协调器逻辑

  - 新增 `initializeProgress` 方法
  - 更新 `playTrack` 方法，支持预加载音轨
  - 在组件初始化时调用 `initializeProgress`

- `src/views/MusicPlayer/MusicPlayer.vue` - 更新组件逻辑
  - 在组件初始化时调用进度初始化逻辑

### 性能影响

- **正面影响**：

  - 存储结构简化，减少存储空间占用
  - 预加载机制减少播放延迟，提升用户体验
  - 状态管理逻辑简化，减少不必要的计算

- **潜在影响**：
  - 预加载音轨可能增加初始化时间和内存占用
  - 需要确保预加载机制不会影响应用启动速度

### 兼容性影响

- **破坏性变更**：修改存储结构和 API
- **迁移成本**：需要更新所有使用相关 API 的代码
- **数据兼容性**：需要进行数据迁移，确保旧版本数据能够正确加载

### 开发体验影响

- **正面影响**：

  - 存储结构更加简洁，易于理解和维护
  - API 更加直观，减少使用复杂度
  - 预加载机制提升用户体验

- **注意事项**：
  - 开发人员需要了解新的 API 使用方式
  - 需要更新相关文档和示例代码

## 后续优化方向

1. **智能预加载**：

   - 根据用户播放习惯，智能预加载下一首音乐
   - 在后台预加载，不影响当前播放

2. **进度同步**：

   - 考虑在多个设备间同步播放进度
   - 使用云存储或本地网络同步

3. **进度恢复策略**：

   - 提供多种进度恢复策略（如：总是恢复、询问用户、不恢复）
   - 让用户自定义进度恢复行为

4. **性能优化**：
   - 优化预加载机制，减少内存占用
   - 使用流式加载，支持大文件播放
