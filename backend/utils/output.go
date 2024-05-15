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

type OutputObject struct {
	Module  string `json:"module"`  // 模块名称
	Message string `json:"message"` // 输出内容
}

type OutputImpl struct {
	ctx    context.Context
	module string
}

func NewOutputImpl(ctx context.Context, module string) *OutputImpl {
	return &OutputImpl{
		ctx:    ctx,
		module: module,
	}
}

func (o *OutputImpl) Output(a ...any) {
	fmt.Println(a...)

	runtime.EventsEmit(o.ctx, "backend:output", OutputObject{
		Module:  o.module,
		Message: fmt.Sprintln(a...),
	})
}
