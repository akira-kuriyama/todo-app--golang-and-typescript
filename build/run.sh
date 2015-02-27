cd /usr/local/src/todo/src
go run app.go &
nginx -p /usr/local/src/todo -g "daemon off;"
