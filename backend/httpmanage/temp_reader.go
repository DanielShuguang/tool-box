package httpmanage

import (
	"io"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type TempReader struct {
	down   *HttpDownloader
	reader io.Reader
}

func (tr *TempReader) Read(p []byte) (n int, err error) {
	n, err = tr.reader.Read(p)
	tr.down.current += n

	runtime.EventsEmit(tr.down.ctx, "backend:download-progress", DownloadPercentResult{
		Url:     tr.down.url,
		Current: tr.down.current,
		Total:   tr.down.contentLength,
	})
	return
}

func NewReader(src io.Reader, down *HttpDownloader) io.Reader {
	tr := &TempReader{
		down:   down,
		reader: src,
	}

	return tr
}
