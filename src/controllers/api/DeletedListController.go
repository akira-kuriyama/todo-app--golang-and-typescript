package api

import (
	"../../repository"
	"encoding/json"
	"fmt"
	"net/http"
)

type DeletedListController struct{}

const DeletedListUrl = "/api/trashbox"

func (l DeletedListController) DeletedListHandler(w http.ResponseWriter, r *http.Request) {

	todoRepository := repository.NewTodoRepository()
	deletedList := todoRepository.FindDeletedList()
	todoList := make([]map[string]interface{}, len(deletedList))
	for i, todo := range deletedList {
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
