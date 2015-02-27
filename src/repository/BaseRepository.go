package repository

import (
	"fmt"
)

type BaseRepository struct{}

func (b BaseRepository) checkErr(err error) {
	if err != nil {
		fmt.Println(err)
		panic(err)
	}
}
