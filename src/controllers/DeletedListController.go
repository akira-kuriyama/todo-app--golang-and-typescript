package controllers

import (
	"../models"
	"../repository"
	"html/template"
	"net/http"
)

type DeletedListController struct{}

const DeletedListUrl = "/trashbox"

func (l DeletedListController) DeletedListHandler(w http.ResponseWriter, r *http.Request) {
	funcMap := template.FuncMap{
		"safehtml": func(text string) template.HTML { return template.HTML(text) },
	}
	template := template.Must(template.New("").Delims("[[", "]]").Funcs(funcMap).ParseFiles("../views/layout.html", "../views/body.html"))

	todoRepository := repository.NewTodoRepository()
	deletedList := todoRepository.FindDeletedList()
	todoList := make([]map[string]interface{}, 0)
	for _, todo := range deletedList {
		todoList = append(todoList, todo.ToJsonObj())
	}
	page := models.Page{
		Title:    "Todo Sample(Go+Typescript)",
		SubTitle: "Trash Box",
		Color:    "black",
		TodoList: todoList}
	err := template.ExecuteTemplate(w, "base", page)
	if err != nil {
		panic(err)
	}
}
