package api

import (
	"../../repository"
	"encoding/json"
	"fmt"
	"net/http"
)

type ArchivedListController struct{}

const ArchivedListUrl = "/api/archivedList"

func (l ArchivedListController) ArchivedListHandler(w http.ResponseWriter, r *http.Request) {

	todoRepository := repository.NewTodoRepository()
	archivedList := todoRepository.FindArchiveList()
	todoList := make([]map[string]interface{}, len(archivedList))
	for i, todo := range archivedList {
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
