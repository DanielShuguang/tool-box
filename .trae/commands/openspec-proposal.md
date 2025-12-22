---
name: /openspec-proposal
id: openspec-proposal
category: OpenSpec
description: 创建新的 OpenSpec 变更并严格验证。
---
<!-- OPENSPEC:START -->
**防护措施**
- 优先采用简单、最小化的实现，只有在明确要求或需要时才增加复杂性。
- 保持变更范围紧密聚焦于请求的结果。
- 如需额外的 OpenSpec 约定或说明，请参考 `openspec/AGENTS.md`（位于 `openspec/` 目录内——如果看不到，请运行 `ls openspec` 或 `openspec update`）。
- 识别任何模糊或不明确的细节，在编辑文件前询问必要的后续问题。

**步骤**
1. 审查 `openspec/project.md`，运行 `openspec list` 和 `openspec list --specs`，检查相关代码或文档（例如通过 `rg`/`ls`）以基于当前行为制定提案；记录任何需要澄清的差距。
2. 选择一个唯一的动词引导的 `change-id`，在 `openspec/changes/<id>/` 下创建 `proposal.md`、`tasks.md` 和 `design.md`（如需要）。
3. 将变更映射为具体的能力或需求，将多范围的工作分解为具有明确关系和顺序的不同规范增量。
4. 当解决方案跨越多个系统、引入新模式或需要在提交规范前进行权衡讨论时，在 `design.md` 中记录架构推理。
5. 在 `changes/<id>/specs/<capability>/spec.md` 中起草规范增量（每个能力一个文件夹），使用 `## ADDED|MODIFIED|REMOVED Requirements`，每个需求至少包含一个 `#### Scenario:`，并在相关时交叉引用相关能力。
6. 将 `tasks.md` 起草为有序的小型、可验证工作项列表，提供用户可见的进展，包括验证（测试、工具），并突出依赖关系或可并行化的工作。
7. 使用 `openspec validate <id> --strict` 验证，在分享提案前解决每个问题。

**参考**
- 当验证失败时，使用 `openspec show <id> --json --deltas-only` 或 `openspec show <spec> --type spec` 检查详细信息。
- 在编写新需求前，使用 `rg -n "Requirement:|Scenario:" openspec/specs` 搜索现有需求。
- 使用 `rg <keyword>`、`ls` 或直接文件读取探索代码库，使提案与当前实现现实保持一致。
<!-- OPENSPEC:END -->
