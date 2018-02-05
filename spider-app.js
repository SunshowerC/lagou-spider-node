/**
 * Created by ChenWeiYu
 * Date : 2016/8/28
 * Time : 15:07
 */

var spiderServer = require('./models/spider-server');
var spiderJSON = require('./models/spiderJSON');
var spiderHTML = require('./models/spiderHTML');

var express = require('express');
var app = express();


//  启动爬虫，在前端页面展示爬虫进度
app.get('/spider',spiderServer.startSpider);

app.get('/start', (req, res)=>{
    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8' });               // text/html

 // spiderHTML.start(req, res)
    spiderJSON.start(req, res)
    .then(() => {
        spiderHTML.start(req, res)
    })

});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("爬虫应用实例，访问地址 http://%s:%s/spider 启动爬虫并查看进度", host, port)
});
