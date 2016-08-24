/**
 * Created by Administrator on 2016/8/23.
 */



 

var express = require('express');
var app = express();
var routes = require('./routes/index');
app.use(express.static('public'));


routes(app);

var server = app.listen(8081, function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("应用实例，访问地址为 http://%s:%s", host, port)
});
//这样可以在浏览器中直接访问 http://127.0.0.1:8081/images/logo.png



