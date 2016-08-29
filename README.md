# 拉勾职位爬虫


##爬虫设置-settings.js
```
{
	delay: Number, //请求延时，延时太短可能会有被封ip的危险，可固定也可设置随机。如： parseInt((Math.random() * 30000000) % 4000, 10) + 1000  
    modelName: String ,   //数据库model名，存储集合名字, 如 "php"，"employment","job"
    job: String,     //爬虫爬取职位名称，如 "php", "前端开发","iOS"
    pages: Number,   //爬取页数，每页15个，一般来说设置250即能爬取到接口上能提供的全部的职位数据
    city: Array,  //爬取职位对应城市, 如['北京','上海','广州','深圳','杭州']
    keyword: Array  //爬取招聘关键词，如：['node','javascript','html','css','jquery',...]; 为false则不爬取关键词

}
```

##启动
1. npm install 安装依赖包;
2. node spider-app.js  爬虫预启动
3. 访问 localhost:3000/spider 启动爬虫并查看进度

