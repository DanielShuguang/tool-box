package filesystem

type DirPathResult struct {
	Error string `json:"error,omitempty"`
	Data  string `json:"data"`
}
