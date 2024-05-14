package utils

import (
	"context"
	"fmt"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func Output(ctx context.Context, a ...any) {
	fmt.Println(a...)

	runtime.EventsEmit(ctx, "backend:output", fmt.Sprintln(a...))
}
