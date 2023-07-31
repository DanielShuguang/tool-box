package utils

import "github.com/shirou/gopsutil/v3/cpu"

type CpuInfo struct {
	Info []cpu.InfoStat `json:"info"`
	Err  string         `json:"err"`
}

func GetCpuInfo() CpuInfo {
	info, err := cpu.Info()
	if err != nil {
		return CpuInfo{
			Info: make([]cpu.InfoStat, 0), Err: err.Error(),
		}
	}
	return CpuInfo{
		Info: info, Err: "",
	}
}
