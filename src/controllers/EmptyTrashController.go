package controllers

import (
	"../repository"
	"net/http"
)

type EmptyTrashController struct{}

const EmptyTrashUrl = "/emptyTrash"

func (c EmptyTrashController) EmptyTrashHandler(w http.ResponseWriter, r *http.Request) {

	todoRepository := repository.NewTodoRepository()
	todoRepository.EmptyTrash()

	http.Redirect(w, r, DeletedListUrl+"?emptied", http.StatusFound)
}
