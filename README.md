Popush 部署文档
==============

*stjh10@gmail.com*

*2 Jun 2013*

## 安装依赖

软件 | 版本 |
------------- | ----- |
Ubuntu Server | 13.04 |
Nginx *       | 1.5   |
Node          | 0.10  |
MongoDB       | 2.2   |
GCC           | 4.7   |
GDB           | 7.5   |
Python        | 2.7   |
Perl          | 5.14  |
Ruby          | 2.0   |
Lua           | 5.2   |
JDK           | 7.0   |

**请下载源码编译，并以默认方式安装在 /usr/local/nginx*

## 获取源码

	svn co https://166.111.80.105:8443/svn/sssta

## 创建主目录

	cd sssta                     # sssta 是上一步获取的源码的根目录

	sudo cp -r popush /popush
	
## 设置主目录权限
	
	sudo chmod -R 777 /popush

## 部署

	cd /popush
	
	make deploy                  # 请确保能访问互联网

## 开启服务
	
	sudo service popush start    # 开启 websocket 服务器
	
	sudo service nginx start     # 开启 http 服务器

## 关闭服务
	
	sudo service popush stop     # 关闭 websocket 服务器
	
	sudo service nginx stop      # 关闭 http 服务器