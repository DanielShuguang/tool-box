package httpmanage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"strings"
	"sync"
	"toolbox/backend/utils"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type DownloadMissionInfo struct {
	Url           string `json:"url"`
	Filename      string `json:"filename"`
	ContentLength int    `json:"contentLength"`
	AcceptRanges  bool   `json:"acceptRanges"`
	DirPath       string `json:"dirPath"`
}

type DownloadPercentResult struct {
	Url     string `json:"url"`
	Total   int    `json:"total"`
	Current int    `json:"current"`
}

type HttpDownloader struct {
	ctx           context.Context
	url           string
	filename      string
	contentLength int    // 总大小
	acceptRanges  bool   // 是否支持断点续传
	numThreads    int    // 同时下载线程数
	dirPath       string // 文件存放路径
	current       int    // 已下载
	fullPath      string // 完整存放路径，带文件名
	output        *utils.OutputImpl
}

func newHttpDownloader(url, dirPath string, numThreads int, ctx context.Context) *HttpDownloader {
	var urlSplits []string = strings.Split(url, "/")
	var filename string = urlSplits[len(urlSplits)-1]

	res, err := http.Head(url)

	httpDownload := new(HttpDownloader)
	httpDownload.output = utils.NewOutputImpl(ctx, "download")
	check(httpDownload, err)

	httpDownload.url = url
	httpDownload.contentLength = int(res.ContentLength)
	httpDownload.current = 0
	httpDownload.numThreads = numThreads
	httpDownload.filename = filename
	httpDownload.dirPath = dirPath
	httpDownload.ctx = ctx
	httpDownload.fullPath = path.Join(dirPath, filename)

	if len(res.Header["Accept-Ranges"]) != 0 && res.Header["Accept-Ranges"][0] == "bytes" {
		httpDownload.acceptRanges = true
	} else {
		httpDownload.acceptRanges = false
	}

	runtime.EventsEmit(ctx, "backend:download-info", DownloadMissionInfo{
		Url:           httpDownload.url,
		Filename:      httpDownload.filename,
		ContentLength: httpDownload.contentLength,
		AcceptRanges:  httpDownload.acceptRanges,
		DirPath:       httpDownload.dirPath,
	})

	return httpDownload
}

func (h *HttpDownloader) Download() {
	if checkFileExist(h.fullPath) {
		h.output.Output("文件已存在，跳过下载：", h.fullPath)
		return
	}

	if !h.acceptRanges {
		h.output.Output("该文件不支持多线程下载，单线程下载中：", h.filename)
		resp, err := http.Get(h.url)
		check(h, err)

		save2file(h, h.fullPath+".temp", 0, NewReader(resp.Body, h), true)
	} else {
		var wg sync.WaitGroup
		h.output.Output("多线程下载中：", h.filename)
		for _, ranges := range h.Split() {
			wg.Add(1)
			go func(start, end int) {
				defer wg.Done()
				h.download(start, end)
			}(ranges[0], ranges[1])
		}
		wg.Wait()
	}

	err := os.Rename(h.fullPath+".temp", h.fullPath)
	if err != nil {
		h.output.Output("重命名错误：", err)
	}
}

func (h *HttpDownloader) Split() [][]int {
	ranges := [][]int{}
	blockSize := h.contentLength / h.numThreads
	for i := 0; i < h.numThreads; i++ {
		var start int = i * blockSize
		var end int = (i+1)*blockSize - 1
		if i == h.numThreads-1 {
			end = h.contentLength - 1
		}
		ranges = append(ranges, []int{start, end})
	}
	return ranges
}

func (h *HttpDownloader) download(start, end int) {
	req, err := http.NewRequest("GET", h.url, nil)
	check(h, err)
	req.Header.Set("Range", fmt.Sprintf("bytes=%v-%v", start, end))

	resp, err := http.DefaultClient.Do(req)
	check(h, err)
	defer resp.Body.Close()
	h.current++

	finished := h.current == h.contentLength
	save2file(h, h.fullPath+".temp", int64(start), NewReader(resp.Body, h), finished)
}

func save2file(h *HttpDownloader, filePath string, offset int64, reader io.Reader, finished bool) {
	tmpFile, err := os.OpenFile(filePath, os.O_WRONLY, 0660)
	if err != nil {
		tmpFile, err = os.Create(filePath)
	}
	defer tmpFile.Close()
	check(h, err)
	tmpFile.Seek(offset, 0)

	_, err = io.Copy(tmpFile, reader)
	check(h, err)

	if finished { // 下载完成
		tmpFile.Close()
	}
}

func check(h *HttpDownloader, e error) {
	if e != nil {
		h.output.Output(e)
		panic(e)
	}
}

type DownloadPayload struct {
	Url        string `json:"url"`
	DirPath    string `json:"dirPath"`
	Concurrent int    `json:"concurrent"`
}

// 多线程下载文件到指定目录
func Download(payload DownloadPayload, ctx context.Context) string {
	var err error = nil
	utils.Try(func() {
		downloader := newHttpDownloader(payload.Url, payload.DirPath, payload.Concurrent, ctx)
		downloader.Download()
	}, func(res any) {
		v, ok := res.(error)
		if ok {
			err = v
		} else {
			err = errors.New("下载出现未知错误！")
		}
	})

	if err != nil {
		return err.Error()
	}
	return ""
}

func checkFileExist(fullPath string) bool {
	_, err := os.ReadFile(fullPath)
	return err == nil
}
