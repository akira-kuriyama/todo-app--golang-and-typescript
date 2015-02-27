package controllers

import (
	"net/http"
)

type TopController struct{}

const TopUrl = "/"

func (c TopController) TopHandler(w http.ResponseWriter, r *http.Request) {
	if r.URL.String() == TopUrl {
		http.Redirect(w, r, ListUrl, http.StatusFound)
	}
	http.Error(w, "", http.StatusNotFound)
}
