package validators

import (
	"../models"
	"../repository"
	"fmt"
	"net/url"
	"strconv"
	"time"
)

type IValidateError interface {
	GetField() string
	GetMessage() string
}

///////////

type ValidateError struct {
	Field   string
	Message string
}

func (v ValidateError) GetField() string {
	return v.Field
}
func (v ValidateError) GetMessage() string {
	return v.Message
}

///////////

type TodoValidator struct{}

func (t TodoValidator) ValidateId(id string) IValidateError {
	_, err := strconv.Atoi(id)
	if err != nil {
		return ValidateError{"id", "Invalid Id"}
	}
	return nil
}

func (t TodoValidator) ValidateTitle(title string) IValidateError {
	if len(title) > 100 {
		return ValidateError{"title", "Invalid Title lenght"}
	}
	return nil
}

func (t TodoValidator) ValidateUrl(urlStr string) IValidateError {

	if len(urlStr) > 1000 {
		return ValidateError{"url", "Invalid URL length"}
	}
	if urlStr != "" {
		_, err := url.ParseRequestURI(urlStr)
		if err != nil {
			return ValidateError{"url", "URL is not valid"}
		}
	}
	return nil
}

func (t TodoValidator) ValidateTitleAndUrl(title string, url string) IValidateError {
	if title == "" && url == "" {
		return ValidateError{"title", "Please input Title or URL"}
	}
	return nil
}

func (t TodoValidator) ValidateMemo(memo string) IValidateError {
	if len(memo) > 500 {
		return ValidateError{"memo", "Invalid Memo length"}
	}
	return nil
}

func (t TodoValidator) ValidateTimeLimit(timeLimit string) IValidateError {
	if timeLimit == "" {
		return nil
	}
	_, err := time.Parse(models.TodoTimeLimitFormat, timeLimit)
	if err != nil {
		return ValidateError{"timeLimit", "TimeLimit is not valid"}
	}
	return nil
}

func (t TodoValidator) ValidateState(state string) IValidateError {
	if state == "" {
		return nil
	}
	states := []int{models.Available, models.Archived, models.Deleted}
	for _, s := range states {
		if state == fmt.Sprint(s) {
			return nil
		}
	}
	return ValidateError{"state", "Invalid state"}
}

func (t TodoValidator) ValidateCreationLimit() IValidateError {
	tr := repository.NewTodoRepository()
	count := tr.CountAllTodo()
	if count >= 1000 {
		return ValidateError{"todoCount", "You've reached the todo create upper limit"}
	}
	return nil
}
