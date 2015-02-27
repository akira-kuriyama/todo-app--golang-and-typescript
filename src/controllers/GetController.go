package controllers

import (
	"../repository"
	"../validators"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
)

type GetController struct{}

const GetUrl = "/get"

func (c GetController) GetHandler(w http.ResponseWriter, r *http.Request) {

	validateError := c.validate(r)
	if validateError != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		result := map[string]interface{}{"status": 0, "error": validateError}
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

	result := map[string]interface{}{"status": 0, "todo": todo.ToJsonObj()}
	b, err := json.Marshal(result)
	if err != nil {
		panic(err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprint(w, string(b))
}

func (c GetController) validate(r *http.Request) validators.IValidateError {
	r.ParseForm()
	values := r.Form

	validator := new(validators.TodoValidator)

	id := values.Get("id")
	return validator.ValidateId(id)
}
