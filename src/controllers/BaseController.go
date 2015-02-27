package controllers

import (
	"../repository"
	"net/http"
	"time"
)

func BaseHandlerFunc(handler func(w http.ResponseWriter, r *http.Request)) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		cookie, _ := r.Cookie("user_id")
		cookieUserId := ""
		if cookie != nil {
			cookieUserId = cookie.Value
		}
		userId := repository.NewUserRepository().CreateUserIfNotExists(cookieUserId)
		repository.NewTodoRepository().SetUserId(userId)
		userIdCookie := &http.Cookie{Name: "user_id", Value: userId, Path: "/", Expires: time.Now().AddDate(10, 0, 0)}
		http.SetCookie(w, userIdCookie)

		http.HandlerFunc(handler).ServeHTTP(w, r)
	})
}
