package filesystem

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func ReadDirByDialog(ctx context.Context) DirPathResult {
	path, err := runtime.OpenDirectoryDialog(ctx, runtime.OpenDialogOptions{})
	result := DirPathResult{}
	if err != nil {
		result.Error = err.Error()
	}
	result.Data = path

	return result
}
