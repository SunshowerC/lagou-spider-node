# 拉勾职位爬虫

## 安装
1. 安装基本依赖包 `npm i`
2. 安装 mongodb

## 使用指南

1.  爬虫基本设置 - `settings.js`
    ```
	{
		dbUri: "mongodb://hostname/xxx",  // mongodb数据库地址
		modelName: "frontend", // 将本次数据保存到数据库的表名
		job: "前端", // 职位搜索条件
		city: ["北京", "上海", "广州", "深圳", "杭州"] // 职位搜索城市条件
	}
    ```

2. 启动爬虫: `npm start` ， 访问 `127.0.0.1:3000/start` 启动并查看进度
3. 挂在后台等待爬虫爬完。

> 注意事项：此处用的是一个免费的动态IP源，稳定性一般，所以爬虫速度不可能太快。追求速度与激情的，可自行替换更加稳定可靠快速的IP源，秒速爬完不是梦。

## 数据可视化分析demo
- [前端招聘岗位分析](http://sunshowerc.github.io/data-analysis/frontend.html)
- [C++招聘岗位分析](http://sunshowerc.github.io/data-analysis/cpp.html)
- [JAVA招聘岗位分析](http://sunshowerc.github.io/data-analysis/java.html)
- [PHP招聘岗位分析](http://sunshowerc.github.io/data-analysis/php.html)
- [Python招聘岗位分析](http://sunshowerc.github.io/data-analysis/python.html)


## 目录
```
|
|---- settings.js        	 爬虫配置
|---- spider-app.js  		 应用入口
|
|---- models/
|       |---- db.js  		 数据库模型
|		|---- mapLimit.js    并发控制库
|		|---- proxy.js 	     动态代理Ip池
|		|---- spiderJson.js  爬取json数据
|		|---- spiderHTML.js  爬取详情信息
|		
|---- analysis/
		|---- data/  		 源数据
		|---- js/ 		     数据处理
		|---- index.html 	 数据分析
```

## [博客详解](https://segmentfault.com/a/1190000014128148)

