/**
 * Created by Administrator on 2016/8/23.
 */


var da = require('./modules/data-analysis');
 

var express = require('express');
var app = express();
app.use(express.static('public'));

app.get('/analysis', function (req, res) {
    // 设置字符编码(去掉中文会乱码)
    // res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
    // res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});  // text/html
    res.set( {'Content-Type': 'application/json;charset=utf-8'});

    da.getCityEmploymentNum(function (data) {
        res.send(JSON.stringify(data));
        // console.log(data);
    });
});

app.get('/', function (req, res) {
    res.send('Hello World');
})


var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("应用实例，访问地址为 http://%s:%s", host, port)
})
//这样可以在浏览器中直接访问 http://127.0.0.1:8081/images/logo.png



