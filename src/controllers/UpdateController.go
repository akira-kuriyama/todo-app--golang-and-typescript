package controllers

import (
	"../models"
	"../repository"
	"../validators"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

type UpdateController struct{}

const UpdateUrl = "/update"

func (c UpdateController) UpdateHandler(w http.ResponseWriter, r *http.Request) {

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
	id, _ := strconv.Atoi(values.Get("id"))
	todo := todoRepository.Find(id)

	_, exist := values["title"]
	if exist {
		todo.Title = values.Get("title")
	}

	_, exist = values["url"]
	if exist {
		todo.Url = values.Get("url")
	}

	if todo.Title == "" {
		urlTitle := todo.GetUrlTitle()
		if urlTitle != "" {
			todo.Title = urlTitle
		} else {
			todo.Title = "(No Title)"
		}
	}

	_, exist = values["memo"]
	if exist {
		todo.Memo = values.Get("memo")
	}

	_, exist = values["timeLimit"]
	if exist {
		todo.TimeLimit, _ = time.Parse(models.TodoTimeLimitFormat, values.Get("timeLimit"))
	}

	_, exist = values["state"]
	if exist {
		state, _ := strconv.Atoi(values.Get("state"))
		todo.State = state
	}

	todoRepository.Update(todo)

	result := map[string]interface{}{"status": 0, "todo": todo.ToJsonObj()}
	b, err := json.Marshal(result)
	if err != nil {
		panic(err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprint(w, string(b))
}

func (c UpdateController) validate(r *http.Request) []validators.IValidateError {
	r.ParseForm()
	values := r.Form

	errors := make([]validators.IValidateError, 0)
	validator := new(validators.TodoValidator)

	id := values.Get("id")
	err := validator.ValidateId(id)
	if err != nil {
		errors = append(errors, err)
	}

	_, titleExist := values["title"]
	if titleExist {
		title := values.Get("title")
		err = validator.ValidateTitle(title)
		if err != nil {
			errors = append(errors, err)
		}
	}

	_, urlExist := values["url"]
	if urlExist {
		url := values.Get("url")
		err := validator.ValidateUrl(url)
		if err != nil {
			errors = append(errors, err)
		}
	}

	if titleExist && urlExist {
		title := values.Get("title")
		url := values.Get("url")
		err := validator.ValidateTitleAndUrl(title, url)
		if err != nil {
			errors = append(errors, err)
		}
	}

	_, timeLimitExist := values["timeLimit"]
	if timeLimitExist {
		timeLimit := values.Get("timeLimit")
		err := validator.ValidateTimeLimit(timeLimit)
		if err != nil {
			errors = append(errors, err)
		}
	}

	_, stateExist := values["state"]
	if stateExist {
		state := values.Get("state")
		err := validator.ValidateState(state)
		if err != nil {
			errors = append(errors, err)
		}

	}

	return errors
}
