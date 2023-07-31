package filesystem

import "os"

type SaveFilePayload struct {
	FullPath string `json:"fullPath"`
	Data     string `json:"data"`
}

func SaveDataToFile(payload SaveFilePayload) string {
	err := os.WriteFile(payload.FullPath, []byte(payload.Data), os.FileMode(0644))
	if err != nil {
		return err.Error()
	}
	return ""
}
