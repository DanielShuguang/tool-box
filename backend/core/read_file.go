package core

import (
	"toolbox/backend/filesystem"
	"toolbox/backend/httpmanage"
)

func (a *App) DownloadUrlToPath(url, dirPath string) string {
	return httpmanage.Download(url, dirPath, a.ctx)
}

func (a *App) OpenDirByDialog() filesystem.DirPathResult {
	return filesystem.ReadDirByDialog(a.ctx)
}
