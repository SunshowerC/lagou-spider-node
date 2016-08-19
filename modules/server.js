/**
 * Created by Administrator on 2016/8/18.
 */

var http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    async = require("async"),
    eventproxy = require('eventproxy');


var ep = new eventproxy(),
    CompanyModule = require('./db');




var resData = [];//存储相应回来的数据

var pageRequest = "http://www.lagou.com/jobs/positionAjax.json";


var pageArr = new Array(3), i = pageArr.length;
while (i--) {
    pageArr[i] = i + 1;
}


var spider = {

    
    
    //发送请求
    sendRequest: function (curPage) {
        var This = this;
        //单个get 请求
        superagent
            .get(pageRequest)
            .query({
                px: 'new',
                city: '深圳',
                needAddtionalResult: false,
                pn: curPage,
                kd: '前端开发'
            })
            .end(This.getCallbackData)
    },

    //获取请求后返回的数据
    getCallbackData :function (err, res) {
        if (res.ok) {
            // console.log( JSON.stringify(res.body) );

            resData = resData.concat( res.body );//res.body.content.positionResult.result

            ep.emit('handleData',res.body.content.positionResult.result);

        } else {
            console.log('Oh no! error ' + res.text);
        }
    },


    //启动，并控制请求并发数量
    runSpider: function (res) {
        var This = this;
        var curCount = 0;
       
        console.log("触发事件");
        //异步控制
        var reptileMove = function(curPage,callback){
            //延迟毫秒数(1000毫秒以内)
            var delay = parseInt((Math.random() * 30000000) % 1000, 10);
            curCount++;
            

            // res.write( (count++) + " 正在抓取" + url + '<br />');

            // 发送请求
            This.sendRequest(curPage);

            setTimeout(function() {
                console.log('现在的并发数是', curCount, '，正在抓取的是', curPage, '，耗时' + delay + '毫秒');
                curCount--;
                callback(null,curCount +' Call back content');
            }, delay);
        };


        // 使用async控制异步抓取
        // mapLimit(arr, limit, iterator, [callback])
        // 异步回调
        // pageArr-{array}-全部页数数组; curPage-当前页数
        async.mapLimit(pageArr, 5 ,function (curPage, callback) {
            reptileMove(curPage, callback);
        }, function (err,result) {

            //pageArr 访问完成的回调函数
            //result 是经过callback 函数处理过的articleUrls ,此处为每个文章url 后面加字符串 'Call back content'
            console.log(result);

            //触发 “返回数据回前端”
            ep.emit('sendResponse');


            console.log("get all data done");
        });
    },


    //绑定事件 “保存数据到数据库” ， “返回响应数据到前端”
    bindEvent: function (res) {
        ep.on('handleData',function (err,companyList) {
            
            
            
            var arr = [];

            companyList.forEach(function (item,index) {
                arr[index] = {
                    positionId : item.positionId ,
                    city:item.city ,
                    companySize:item.companySize ,
                    financeStage:item.financeStage ,
                    salary:item.salary ,
                    workYear:item.workYear ,
                    employmentKeyword:item.employmentKeyword
                }
            });

            ep.emit('saveDataToDb',arr);
        });

        ep.on('saveDataToDb',function (err,companyList) {
            // var doc =  new CompanyModule();
            // console.log(companyList);

            CompanyModule.create(companyList)
                .then(function (product) {
                    if (err) return console.error(err);
                    // console.log(product);
                })
            
            
        });

        ep.on('sendResponse',function (err,result) {
            console.log("successfully");
            res.write("successfully");
            res.write(JSON.stringify(resData));
            res.end();
        });
    }



};

function start() {
    function onRequest(req, res) {
        var urlObj = url.parse(req.url,true);
        console.log(urlObj.pathname )
        if (urlObj.pathname != "/") return false;
        if (req)
        // 设置字符编码(去掉中文会乱码)
        // res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});  // text/html
        res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});


        spider.bindEvent(res);
        spider.runSpider();
        
    }


    http.createServer(onRequest).listen(3000);
}


exports.start = start;
