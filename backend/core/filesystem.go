package core

import (
	"toolbox/backend/filesystem"
	"toolbox/backend/httpmanage"
)

func (a *App) DownloadUrlToPath(payload httpmanage.DownloadPayload) string {
	return httpmanage.Download(payload, a.ctx)
}

func (a *App) OpenDirByDialog() filesystem.DirPathResult {
	return filesystem.ReadDirByDialog(a.ctx)
}

func (a *App) SaveDataToFile(payload filesystem.SaveFilePayload) string {
	return filesystem.SaveDataToFile(payload)
}
