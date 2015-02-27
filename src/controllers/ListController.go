package controllers

import (
	"../models"
	"html/template"
	"net/http"
)

type ListController struct{}

const ListUrl = "/list"

func (l ListController) ListHandler(w http.ResponseWriter, r *http.Request) {

	funcMap := template.FuncMap{
		"safehtml": func(text string) template.HTML { return template.HTML(text) },
	}
	template := template.Must(template.New("").Delims("[[", "]]").Funcs(funcMap).ParseFiles("../views/layout.html", "../views/body.html"))

	page := models.Page{
		Title:    "Todo Sample(Go+Typescript)",
		SubTitle: "List",
		Color:    "red"}
	err := template.ExecuteTemplate(w, "base", page)
	if err != nil {
		panic(err)
	}
}
