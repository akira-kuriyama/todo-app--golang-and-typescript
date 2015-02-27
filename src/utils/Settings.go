package utils

import (
	"github.com/BurntSushi/toml"
)

type Settings struct {
	IsDemo bool
}

var instance *Settings = nil

func NewSettings() *Settings {
	if instance != nil {
		return instance
	}
	var settings *Settings
	_, err := toml.DecodeFile("../config/config.tml", &settings)
	if err != nil {
		panic(err)
	}
	instance = settings
	return settings

}
