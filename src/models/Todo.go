package models

import (
	"github.com/PuerkitoBio/goquery"
	"time"
)

type Todo struct {
	Id        int
	Title     string
	Url       string
	Memo      string
	TimeLimit time.Time
	State     int
	CreatedAt time.Time
	UpdateAt  time.Time
}

const (
	Available int = iota
	Archived
	Deleted
)

const TodoTimeLimitFormat = "2006/01/02 15:04 -07:00"

func (t Todo) GetUrlTitle() string {
	title := ""
	if t.Url == "" {
		return title
	}
	doc, err := goquery.NewDocument(t.Url)
	if err != nil {
		return title
	}
	doc.Find("title").Each(func(_ int, s *goquery.Selection) {
		title = s.Text()
	})
	return title
}

func (t Todo) ToJsonObj() map[string]interface{} {
	timeLimitFormatted := ""
	if !t.TimeLimit.IsZero() {
		timeLimitFormatted = t.TimeLimit.UTC().Format("2006/01/02 15:04")
	}

	return map[string]interface{}{"id": t.Id,
		"title":     t.Title,
		"url":       t.Url,
		"memo":      t.Memo,
		"timeLimit": timeLimitFormatted,
		"state":     t.State}
}
