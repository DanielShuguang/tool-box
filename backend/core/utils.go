package core

import (
	"toolbox/backend/utils"
)

func (a *App) GetCpuInfo() utils.CpuInfo {
	return utils.GetCpuInfo()
}
