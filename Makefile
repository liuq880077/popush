.PHONY: clean npm static conf start stop server bin deploy all

LIB_DIR = lib
BIN_DIR = bin
STATIC_DIR = static
APPARMOR_DIR = /etc/apparmor.d
NGINX_CONF = /usr/local/nginx/conf/nginx.conf
NGINX = /etc/init.d/nginx
POPUSH = /etc/init.d/popush
TMP_DIR = tmp
FACE_DIR = static/faces
TARGET = $(TMP_DIR) $(FACE_DIR)

all: npm $(TARGET)

server: all static conf

deploy: all static bin conf

start:
	@echo ">  start popush"
	@sudo service popush restart 1>/dev/null

stop:
	@echo ">  stop popush"
	@sudo service popush stop 1>/dev/null

npm:
	@echo ">  npm install"
	@npm install
	@cp -f `find node_modules/socket.io/node_modules/socket.io-client -name socket.io.js` `find static -name socket.io.js`
	@cd node_modules/mongojs && npm install

static:
	@echo ">  do not make static"

conf:
	@echo ">  configure"
	@sudo cp $(LIB_DIR)/nginx.conf $(NGINX_CONF)
	@sudo cp $(LIB_DIR)/nginx $(NGINX)
	@sudo update-rc.d nginx defaults 1>/dev/null 2>&1
	@sudo cp $(LIB_DIR)/popush $(POPUSH)
	@sudo update-rc.d popush defaults 1>/dev/null 2>&1
	@sudo cp $(LIB_DIR)/apparmor.d/* $(APPARMOR_DIR)/
	@echo ">  restart apparmor"
	@sudo service apparmor restart 1>/dev/null 2>&1
	@echo ">  restart nginx"
	@sudo service nginx restart 1>/dev/null

$(TMP_DIR):
	@echo ">  make $@"
	@-mkdir $@

$(FACE_DIR):
	@echo ">  make $@"
	@-mkdir $@

bin:
	@echo ">  make bin"
	@rm -rf $(BIN_DIR)
	@-mkdir $(BIN_DIR)
	@gcc -o $(BIN_DIR)/a $(LIB_DIR)/a.c
	@cp `which gdb` $(BIN_DIR)/gdb
	@cp `which node` $(BIN_DIR)/node
	@cp `which python` $(BIN_DIR)/python
	@cp `which perl` $(BIN_DIR)/perl
	@cp `which ruby` $(BIN_DIR)/ruby
	@cp `which lua` $(BIN_DIR)/lua
	@cp -r `readlink -f \`which javac\` | sed "s:bin/javac:jre:"` $(BIN_DIR)/

clean:
	@rm -rf $(TMP_DIR)/*
