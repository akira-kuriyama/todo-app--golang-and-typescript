package api

import (
	"../../repository"
	"encoding/json"
	"fmt"
	"net/http"
)

type ListController struct{}

const ListUrl = "/api/list"

func (l ListController) ListHandler(w http.ResponseWriter, r *http.Request) {

	todoRepository := repository.NewTodoRepository()
	availableList := todoRepository.FindAvailableList()
	todoList := make([]map[string]interface{}, len(availableList))
	for i, todo := range availableList {
		todoList[i] = todo.ToJsonObj()
	}

	result := map[string]interface{}{"status": 0, "todoList": todoList}
	b, err := json.Marshal(result)
	if err != nil {
		panic(err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprint(w, string(b))
}
