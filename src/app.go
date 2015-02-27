package main

import (
	"./controllers"
	"./controllers/api"
	"net/http"
)

func main() {
	http.Handle(controllers.TopUrl, controllers.BaseHandlerFunc(new(controllers.TopController).TopHandler))

	http.Handle(controllers.ListUrl, controllers.BaseHandlerFunc(new(controllers.ListController).ListHandler))
	http.Handle(controllers.ArchivedListUrl, controllers.BaseHandlerFunc(new(controllers.ArchivedListController).ArchivedListHandler))
	http.Handle(controllers.DeletedListUrl, controllers.BaseHandlerFunc(new(controllers.DeletedListController).DeletedListHandler))

	http.Handle(api.ListUrl, controllers.BaseHandlerFunc(new(api.ListController).ListHandler))
	http.Handle(api.ArchivedListUrl, controllers.BaseHandlerFunc(new(api.ArchivedListController).ArchivedListHandler))
	http.Handle(api.DeletedListUrl, controllers.BaseHandlerFunc(new(api.DeletedListController).DeletedListHandler))

	http.Handle(controllers.GetUrl, controllers.BaseHandlerFunc(new(controllers.GetController).GetHandler))
	http.Handle(controllers.CreateUrl, controllers.BaseHandlerFunc(new(controllers.CreateController).CreateHandler))
	http.Handle(controllers.UpdateUrl, controllers.BaseHandlerFunc(new(controllers.UpdateController).UpdateHandler))
	http.Handle(controllers.EmptyTrashUrl, controllers.BaseHandlerFunc(new(controllers.EmptyTrashController).EmptyTrashHandler))

	http.ListenAndServe(":8080", nil)

}
