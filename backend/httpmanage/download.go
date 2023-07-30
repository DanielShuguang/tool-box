package httpmanage

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path"
	"strings"
	"sync"
	"toolbox/backend/utils"

	"github.com/shirou/gopsutil/v3/cpu"
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
}

func newHttpDownloader(url, dirPath string, numThreads int, ctx context.Context) *HttpDownloader {
	var urlSplits []string = strings.Split(url, "/")
	var filename string = urlSplits[len(urlSplits)-1]

	res, err := http.Head(url)
	check(err)

	httpDownload := new(HttpDownloader)
	httpDownload.url = url
	httpDownload.contentLength = int(res.ContentLength)
	httpDownload.numThreads = numThreads
	httpDownload.filename = filename
	httpDownload.dirPath = dirPath
	httpDownload.ctx = ctx

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
	f, err := os.Create(h.filename)
	check(err)
	defer f.Close()

	if !h.acceptRanges {
		fmt.Println("该文件不支持多线程下载，单线程下载中：")
		resp, err := http.Get(h.url)
		check(err)

		save2file(h.filename, 0, NewReader(resp.Body, h))
	} else {
		var wg sync.WaitGroup
		for _, ranges := range h.Split() {
			fmt.Printf("多线程下载中:%d-%d\n", ranges[0], ranges[1])
			wg.Add(1)
			go func(start, end int) {
				defer wg.Done()
				h.download(start, end)
			}(ranges[0], ranges[1])
		}
		wg.Wait()
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
	check(err)
	req.Header.Set("Range", fmt.Sprintf("bytes=%v-%v", start, end))

	resp, err := http.DefaultClient.Do(req)
	check(err)
	defer resp.Body.Close()

	save2file(path.Join(h.dirPath, h.filename), int64(start), NewReader(resp.Body, h))
}

func save2file(filename string, offset int64, reader io.Reader) {
	tmpFile, err := os.OpenFile(filename+".temp", os.O_WRONLY, 0660)
	if err != nil {
		tmpFile, err = os.Create(filename + ".temp")
	}
	defer tmpFile.Close()
	check(err)
	tmpFile.Seek(offset, 0)

	_, err = io.Copy(tmpFile, reader)
	check(err)

	err = os.Rename(filename+".temp", filename)
	check(err)
}

func check(e error) {
	if e != nil {
		log.Println(e)
		panic(e)
	}
}

// 多线程下载文件到指定目录
func Download(url, dirPath string, ctx context.Context) string {
	coreCount, err := cpu.Counts(true)
	if err != nil {
		coreCount = 5
	}

	utils.Try(func() {
		downloader := newHttpDownloader(url, dirPath, coreCount, ctx)
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
