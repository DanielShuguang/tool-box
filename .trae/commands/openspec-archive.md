---
name: /openspec-archive
id: openspec-archive
category: OpenSpec
description: 归档已部署的 OpenSpec 变更并更新规范。
---
<!-- OPENSPEC:START -->
**防护措施**
- 优先采用简单、最小化的实现，只有在明确要求或需要时才增加复杂性。
- 保持变更范围紧密聚焦于请求的结果。
- 如需额外的 OpenSpec 约定或说明，请参考 `openspec/AGENTS.md`（位于 `openspec/` 目录内——如果看不到，请运行 `ls openspec` 或 `openspec update`）。

**步骤**
1. 确定要归档的变更 ID：
   - 如果此提示已包含特定的变更 ID（例如在由斜杠命令参数填充的 `<ChangeId>` 块内），请在去除空白后使用该值。
   - 如果对话中松散地引用了变更（例如通过标题或摘要），运行 `openspec list` 以显示可能的 ID，分享相关候选项，并确认用户意图的那个。
   - 否则，审查对话，运行 `openspec list`，并询问用户要归档哪个变更；在继续前等待确认的变更 ID。
   - 如果仍无法识别单个变更 ID，停止并告诉用户你还不能归档任何内容。
2. 通过运行 `openspec list`（或 `openspec show <id>`）验证变更 ID，如果变更缺失、已归档或其他不准备归档的情况则停止。
3. 运行 `openspec archive <id> --yes`，使 CLI 移动变更并应用规范更新而无需提示（仅对纯工具工作使用 `--skip-specs`）。
4. 审查命令输出以确认目标规范已更新且变更已落在 `changes/archive/` 中。
5. 使用 `openspec validate --strict` 验证，如果有任何异常则使用 `openspec show <id>` 检查。

**参考**
- 在归档前使用 `openspec list` 确认变更 ID。
- 使用 `openspec list --specs` 检查刷新的规范，在交接前解决任何验证问题。
<!-- OPENSPEC:END -->
