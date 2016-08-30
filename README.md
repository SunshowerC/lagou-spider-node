# 拉勾职位爬虫

##使用门槛
精通nodejs和mongodb……的安装与启动(这个都不精通的同学出去逛一圈再回来。)

##使用指南

1. 爬虫设置-settings.js
	```
{
	delay: Number, //请求延时，延时太短可能会有被封ip的危险，可固定也可设置随机。
	               //如： parseInt((Math.random() * 30000000) % 4000, 10) + 1000  
    modelName: String ,    //数据库model名，存储集合名字, 如 "php"，"employment","job"
    job: String,           //爬虫爬取职位名称，如 "php", "前端开发","iOS"
    pages: Number,         //爬取页数，每页15个，一般来说设置250即能爬取到接口上能提供的全部的职位数据
    city: Array,           //爬取职位对应城市, 如['北京','上海','广州','深圳','杭州']
    keyword: Array         //爬取招聘关键词，如：['node','javascript','html','css','jquery',...]; 
                           //为false则不爬取关键词

}
	```

2. 启动
	1. npm install 安装依赖包;
	2. node spider-app.js  爬虫预启动
	3. 访问 localhost:3000/spider 启动爬虫并查看进度

3. 爬取获得的单个文档JSON数据结构
 ```
{
	"_id" : ObjectId("57c4e82682d5ce50174d8257"),
	"companyFullName" : "XXXX有限公司",  //公司名字
	"positionId" : 123456,               //招聘ID
	"city" : "北京",                     //所在城市
	"companySize" : "150-500人",         //公司规模
	"financeStage" : "成熟型(C轮)",      //发展阶段
	"salary" : 20000,                    //招聘工资
	"workYear" : "1-3年",                //要求应聘者工作资历
	"employmentKeyword" : [              //招聘详情页关键词(如果有)
		"性能",
		"架构",
		"数据库",
		"oop",
		"http",
		"php",
		"sql"
	],    
	"__v" : 0
},
 ```
4. 数据处理
获得了原始数据，就可以用数据来分析出很多有趣的结果了。有条件的同学可以自行对数据库查询计算，这里附上我写好的简单的[数据统计和前端echarts数据可视化](https://github.com/Weiyu-Chen/lagou-spider-data-handle)，不过有条件的同学希望还是自行编写数据处理程序。

