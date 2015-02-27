package controllers

import (
	"../models"
	"../repository"
	"html/template"
	"net/http"
)

type ArchivedListController struct{}

const ArchivedListUrl = "/archivedList"

func (c ArchivedListController) ArchivedListHandler(w http.ResponseWriter, r *http.Request) {

	funcMap := template.FuncMap{
		"safehtml": func(text string) template.HTML { return template.HTML(text) },
	}
	template := template.Must(template.New("").Delims("[[", "]]").Funcs(funcMap).ParseFiles("../views/layout.html", "../views/body.html"))

	todoRepository := repository.NewTodoRepository()
	archivedList := todoRepository.FindArchiveList()
	todoList := make([]map[string]interface{}, 0)
	for _, todo := range archivedList {
		todoList = append(todoList, todo.ToJsonObj())
	}
	page := models.Page{
		Title:    "Todo Sample(Go+Typescript)",
		SubTitle: "Archive",
		Color:    "purple",
		TodoList: todoList}
	err := template.ExecuteTemplate(w, "base", page)
	if err != nil {
		panic(err)
	}
}
