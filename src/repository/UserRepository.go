package repository

import (
	"../utils"
	"crypto/sha256"
	"database/sql"
	"fmt"
	_ "github.com/mattn/go-sqlite3"
	"math/rand"
	"strconv"
	"time"
)

type UserRepository struct {
	*BaseRepository
}

var userRepository *UserRepository

func NewUserRepository() *UserRepository {
	if userRepository != nil {
		return userRepository
	}
	userRepository = new(UserRepository)
	userRepository.BaseRepository = new(BaseRepository)
	userRepository.createUserTableIfNotExists()
	return userRepository
}

func (u UserRepository) CreateUserIfNotExists(cookieUserId string) string {
	u.createUserTableIfNotExists()
	userId := cookieUserId
	if !u.existsUser(cookieUserId) {
		userId = u.createUser()

		if utils.NewSettings().IsDemo {
			NewTodoRepository().CreateSampleTodo()
		}
	}
	return userId
}

func (u UserRepository) existsUser(cookieUserId string) bool {
	if cookieUserId == "" {
		return false
	}
	db, err := sql.Open("sqlite3", DbName)
	u.checkErr(err)
	defer db.Close()

	sql := "SELECT count(id) FROM user WHERE id = ?"
	stmt, err := db.Prepare(sql)
	u.checkErr(err)
	defer stmt.Close()
	var count int
	err = stmt.QueryRow(cookieUserId).Scan(&count)
	if count == 1 {
		u.updateAccessTime()
		return true
	}
	return false
}

func (u UserRepository) updateAccessTime() {
	db, err := sql.Open("sqlite3", DbName)
	u.checkErr(err)
	defer db.Close()

	sqlStmt := "UPDATE user SET access_time = ? WHERE id = ?;"
	stmt, err := db.Prepare(sqlStmt)
	u.checkErr(err)
	defer stmt.Close()
	_, err = stmt.Exec(time.Now(), userId)
	u.checkErr(err)
}

func (u UserRepository) createUser() string {

	if utils.NewSettings().IsDemo {
		if u.isOverUserCount() {
			u.deleteOldestUser()
		}
	}

	userId := u.createUserId()
	db, err := sql.Open("sqlite3", DbName)
	u.checkErr(err)
	defer db.Close()

	sqlStmt := "INSERT INTO user (id, access_time, created_at) VALUES(?, ?, ?);"
	stmt, err := db.Prepare(sqlStmt)
	u.checkErr(err)
	defer stmt.Close()
	_, err = stmt.Exec(userId, time.Now(), time.Now())
	u.checkErr(err)
	return userId
}

func (u UserRepository) createUserId() string {
	rand.Seed(time.Now().Unix())
	randId := rand.Intn(1000000000000000)
	sha := sha256.New()
	sha.Write([]byte(strconv.Itoa(randId)))
	b := sha.Sum(nil)
	userId = fmt.Sprintf("%x", b)
	return userId
}
func (u UserRepository) isOverUserCount() bool {
	db, err := sql.Open("sqlite3", DbName)
	u.checkErr(err)
	defer db.Close()

	sqlStmt := "SELECT count(id) FROM user;"
	stmt, err := db.Prepare(sqlStmt)
	u.checkErr(err)
	defer stmt.Close()
	count := 0
	err = stmt.QueryRow().Scan(&count)
	u.checkErr(err)
	return count > 5
}
func (u UserRepository) deleteOldestUser() {

	db, err := sql.Open("sqlite3", DbName)
	u.checkErr(err)
	defer db.Close()

	userId := u.findOldestUserId()
	sqlStmt := "DELETE FROM user WHERE id = ?;"
	stmt, err := db.Prepare(sqlStmt)
	u.checkErr(err)
	defer stmt.Close()
	_, err = stmt.Exec(userId)
	u.checkErr(err)

	sqlStmt = "DELETE FROM todo WHERE user_id = ?;"
	stmt, err = db.Prepare(sqlStmt)
	u.checkErr(err)
	defer stmt.Close()
	_, err = stmt.Exec(userId)
	u.checkErr(err)

}

func (u UserRepository) findOldestUserId() string {
	db, err := sql.Open("sqlite3", DbName)
	u.checkErr(err)
	defer db.Close()

	sqlStmt := "SELECT id FROM user ORDER BY access_time ASC LIMIT 1;"
	stmt, err := db.Prepare(sqlStmt)
	u.checkErr(err)
	defer stmt.Close()
	id := ""
	err = stmt.QueryRow().Scan(&id)
	u.checkErr(err)
	return id
}
func (u UserRepository) createUserTableIfNotExists() {
	db, err := sql.Open("sqlite3", DbName)
	u.checkErr(err)
	defer db.Close()

	sqlStmt := `
	CREATE TABLE IF NOT EXISTS user (
	    id           text primary key,
	    access_time  datetime,
	    created_at   datetime
    );
	`

	_, err = db.Exec(sqlStmt)
	u.checkErr(err)
}
