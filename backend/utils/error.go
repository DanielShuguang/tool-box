package utils

func Try(fun func(), handler func(any)) {
	defer func() {
		if err := recover(); err != nil {
			handler(err)
		}
	}()
	fun()
}
