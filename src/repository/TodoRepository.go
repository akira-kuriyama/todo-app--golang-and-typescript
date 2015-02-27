package repository

import (
	"../models"
	"database/sql"
	_ "github.com/mattn/go-sqlite3"
	"time"
)

type TodoRepository struct {
	*BaseRepository
}

const DbName = "todo.db"

var userId string
var todoRepository *TodoRepository

func NewTodoRepository() *TodoRepository {
	if todoRepository != nil {
		return todoRepository
	}
	todoRepository = new(TodoRepository)
	todoRepository.BaseRepository = new(BaseRepository)
	todoRepository.createTodoTableIfNotExists()
	return todoRepository
}
func (t TodoRepository) SetUserId(userId_ string) {
	userId = userId_
}

func (t TodoRepository) Find(id int) *models.Todo {
	db, err := sql.Open("sqlite3", DbName)
	t.checkErr(err)
	defer db.Close()

	sql := "SELECT id, title, url, memo, time_limit, state, created_at, updated_at FROM todo WHERE user_id = ? AND id = ?"

	stmt, err := db.Prepare(sql)
	t.checkErr(err)
	defer stmt.Close()
	rows, err := stmt.Query(userId, id)
	defer rows.Close()
	t.checkErr(err)
	rows.Next()
	todo := t.convertTodo(rows)
	return todo

}

func (t TodoRepository) FindAvailableList() []models.Todo {
	return t.findList(models.Available)
}

func (t TodoRepository) FindArchiveList() []models.Todo {
	return t.findList(models.Archived)
}

func (t TodoRepository) FindDeletedList() []models.Todo {
	return t.findList(models.Deleted)
}

func (t TodoRepository) Create(todo *models.Todo) {
	db, err := sql.Open("sqlite3", DbName)
	t.checkErr(err)
	defer db.Close()

	sqlStmt := "INSERT INTO todo (user_id, title, url, memo, time_limit, state, created_at, updated_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?);"
	stmt, err := db.Prepare(sqlStmt)
	t.checkErr(err)
	defer stmt.Close()
	res, err := stmt.Exec(userId, todo.Title, todo.Url, todo.Memo, todo.TimeLimit, todo.State, time.Now(), time.Now())
	t.checkErr(err)
	insertId, err := res.LastInsertId()
	todo.Id = int(insertId)
	t.checkErr(err)
}

func (t TodoRepository) Update(todo *models.Todo) {
	db, err := sql.Open("sqlite3", DbName)
	t.checkErr(err)
	defer db.Close()

	sqlStmt := "UPDATE todo SET title = ?, url = ?, memo = ?, time_limit = ?, state = ?, updated_at = ? WHERE user_id = ? AND id = ?;"
	stmt, err := db.Prepare(sqlStmt)
	t.checkErr(err)
	defer stmt.Close()
	_, err = stmt.Exec(todo.Title, todo.Url, todo.Memo, todo.TimeLimit, todo.State, time.Now(), userId, todo.Id)
	t.checkErr(err)
}

func (t TodoRepository) EmptyTrash() {
	db, err := sql.Open("sqlite3", DbName)
	t.checkErr(err)
	defer db.Close()

	sqlStmt := "DELETE FROM todo WHERE user_id = ? AND state = ?;"
	stmt, err := db.Prepare(sqlStmt)
	t.checkErr(err)
	defer stmt.Close()
	_, err = stmt.Exec(userId, models.Deleted)
	t.checkErr(err)
}

func (t TodoRepository) CountAllTodo() int {
	db, err := sql.Open("sqlite3", DbName)
	t.checkErr(err)
	defer db.Close()

	sql := "SELECT count(id) FROM todo WHERE user_id = ?"

	stmt, err := db.Prepare(sql)
	t.checkErr(err)
	defer stmt.Close()
	count := 0
	err = stmt.QueryRow(userId).Scan(&count)
	t.checkErr(err)
	return count
}

func (t TodoRepository) CreateSampleTodo() {
	now := time.Now()

	timeLimit1 := now.Truncate(time.Hour).AddDate(0, 0, 7)
	t.Create(&models.Todo{Title: "Order candies", TimeLimit: timeLimit1})

	t.Create(&models.Todo{Title: "Buy cases of wine", Url: "https://www.google.co.jp/search?q=wine cases"})

	timeLimit2 := time.Date(now.Year(), now.Month(), now.Day(), 19, 0, 0, 0, now.Location()).AddDate(0, 0, 3)
	t.Create(&models.Todo{Title: "Haircut", Memo: "1 Astor Place Manhattan, NY 10002", TimeLimit: timeLimit2})

	t.Create(&models.Todo{Title: "Wash car"})

}

func (t TodoRepository) convertTodo(rows *sql.Rows) *models.Todo {
	var id int
	var title string
	var url string
	var memo string
	var timeLimit time.Time
	var state int
	var createdAt time.Time
	var updatedAt time.Time
	rows.Scan(&id, &title, &url, &memo, &timeLimit, &state, &createdAt, &updatedAt)
	todo := new(models.Todo)
	todo.Id = id
	todo.Title = title
	todo.Url = url
	todo.Memo = memo
	todo.TimeLimit = timeLimit
	todo.State = state
	todo.CreatedAt = createdAt
	todo.UpdateAt = updatedAt
	return todo
}
func (t TodoRepository) findList(state int) []models.Todo {
	db, err := sql.Open("sqlite3", DbName)
	t.checkErr(err)
	defer db.Close()

	sql := "SELECT id, title, url, memo, time_limit, state, created_at, updated_at FROM todo WHERE user_id = ? AND state = ? ORDER BY created_at DESC;"
	stmt, err := db.Prepare(sql)
	t.checkErr(err)
	defer stmt.Close()
	rows, err := stmt.Query(userId, state)
	t.checkErr(err)
	defer rows.Close()
	todoList := make([]models.Todo, 0)
	for rows.Next() {
		todo := t.convertTodo(rows)
		todoList = append(todoList, *todo)
	}
	return todoList
}

func (t TodoRepository) createTodoTableIfNotExists() {
	db, err := sql.Open("sqlite3", DbName)
	t.checkErr(err)
	defer db.Close()

	sqlStmt := `
	CREATE TABLE IF NOT EXISTS todo (
	    id           integer primary key autoincrement,
	    user_id      string,
	    title        text not null,
	    url          text,
	    memo         text,
	    time_limit   datetime,
	    state        integer,
	    created_at   datetime,
	    updated_at   datetime
    );
	`

	_, err = db.Exec(sqlStmt)
	t.checkErr(err)
}
