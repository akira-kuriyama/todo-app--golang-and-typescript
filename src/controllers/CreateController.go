package controllers

import (
	"../models"
	"../repository"
	"../utils"
	"../validators"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type CreateController struct{}

const CreateUrl = "/create"

func (c CreateController) CreateHandler(w http.ResponseWriter, r *http.Request) {

	validateErrors := c.validate(r)
	if len(validateErrors) != 0 {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		result := map[string]interface{}{"status": 0, "error": validateErrors}
		b, err := json.Marshal(result)
		if err != nil {
			panic(err)
		}
		fmt.Fprint(w, string(b))
		return
	}

	todoRepository := repository.NewTodoRepository()
	values := r.Form
	todo := new(models.Todo)
	todo.Title = values.Get("title")
	todo.Url = values.Get("url")
	if todo.Title == "" {
		urlTitle := todo.GetUrlTitle()
		if urlTitle != "" {
			todo.Title = urlTitle
		} else {
			todo.Title = "(No Title)"
		}
	}

	todo.Memo = values.Get("memo")
	timeLimit := values.Get("timeLimit")
	if timeLimit != "" {
		todo.TimeLimit, _ = time.Parse(models.TodoTimeLimitFormat, values.Get("timeLimit"))
	}
	todoRepository.Create(todo)

	result := map[string]interface{}{"status": 0, "todo": todo.ToJsonObj()}
	b, err := json.Marshal(result)
	if err != nil {
		panic(err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprint(w, string(b))
}
func (c CreateController) validate(r *http.Request) []validators.IValidateError {
	r.ParseForm()
	values := r.Form

	errors := make([]validators.IValidateError, 0)
	validator := new(validators.TodoValidator)

	title := values.Get("title")
	err := validator.ValidateTitle(title)
	if err != nil {
		errors = append(errors, err)
	}

	url := values.Get("url")
	err = validator.ValidateUrl(url)
	if err != nil {
		errors = append(errors, err)
	}

	err = validator.ValidateTitleAndUrl(title, url)
	if err != nil {
		errors = append(errors, err)
	}

	memo := values.Get("memo")
	err = validator.ValidateMemo(memo)
	if err != nil {
		errors = append(errors, err)
	}

	timeLimit := values.Get("timeLimit")
	err = validator.ValidateTimeLimit(timeLimit)
	if err != nil {
		errors = append(errors, err)
	}

	if utils.NewSettings().IsDemo {
		err = validator.ValidateCreationLimit()
		if err != nil {
			errors = append(errors, err)
		}
	}

	return errors
}
