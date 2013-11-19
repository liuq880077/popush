Popush 部署文档
==============

*stjh10@gmail.com*

*15 Sep 2013*

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

	git clone https://github.com/qiankanglai/popush.git

## 创建主目录

	sudo cp -r popush /popush    # popush 是上一步获取的源码的根目录
	
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
	
# 关于各组提交补充说明

* 各组组长申请education plan之后，将popush复制成私人项目，并添加助教作为协作者
* 各组在私有仓库完成指定功能之后，请在[issues](https://github.com/qiankanglai/popush/issues)声明，助教会检查对应的commits
* 每轮检查之后，助教会选出符合要求的一组代码合并到主仓库

# 其他优秀版本
* 我们都是水果 小组：https://github.com/SilunWang/popush
* 扬帆启程 小组：https://github.com/Epsirom/popush
