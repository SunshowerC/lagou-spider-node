/**
 * Created by Administrator on 2016/8/18.
 */

var http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    async = require("async"),
    eventproxy = require('eventproxy');
var queryString = require('querystring');

var ep = new eventproxy(),
    CompanyModule = require('./db');

var pageNum = 42;
var pageRequestUrl = [];
var resData = [];

var pageRequest = "http://www.lagou.com/jobs/positionAjax.json?px=new&city=深圳&needAddtionalResult=false";

var spider = {
    init: function () {
        this.getPageRequestUrl();
        this.getCompanyInfo();
         // this.eventHandle();
        
    },
    
    getPageRequestUrl: function () {
 /*       for (var i = 1; i < pageNum; i++) {
            pageRequestUrl.push("http://www.lagou.com/jobs/positionAjax.json?px=new&city=深圳&needAddtionalResult=false&pn=" + i + "&kd=前端开发");
        }*/
        
        // console.log(pageRequestUrl)
    },

    getCompanyInfo: function () {

/*        superagent.get("http://www.lagou.com/jobs/positionAjax.json?px=new&city=深圳&needAddtionalResult=false&pn=12&kd=前端开发")
            .end(function (err,pres) {
                if (err) return console.error(err);
                console.log(pres)
            })*/
/*        pageRequestUrl.forEach(function (pageUrl) {
            superagent.post(pageUrl)
                .end(function (err, pres) {
                    if (err) return console.error(err);
                    // console.log(pres)
                    resData.push(pres);
                    // console.log(pres.text)
                    // 相当于一个计数器
                    ep.emit('getCompanyData');

                })
        });*/

        
        //单个post请求测试
        superagent
            .post('http://www.lagou.com/jobs/positionAjax.json?px=new&city=深圳&needAddtionalResult=false&pn=8&kd=前端开发')
            // .send({ first:false, pn: 8, kd: '前端开发' })
            // .set('X-API-Key', 'foobar')
            .send()
            .set('Accept', 'application/json')
            .end(function(err, res){
                if (res.ok) {
                    // console.log( JSON.stringify(res.body) );
                    resData = resData.concat(res.body.content);
                    // console.log(resData)
                    // return resData;
                    ep.emit('getCompanyData');
                } else {
                    console.log('Oh no! error ' + res.text);
                }
            });

/*            for (var currentPage = 1; currentPage <= pageNum ; currentPage++ ) {

                (function (currentPage) {

                superagent
                    .post(pageRequest)
                    .send({ pn: currentPage, kd: '前端开发' })
                    // .set('X-API-Key', 'foobar')
                    .set('Accept', 'application/json')
                    .end(function(err, res){
                        if (res.ok) {
                            
                            console.log( currentPage );
                            resData = resData.concat(res.body.content.positionResult.result);
                            // console.log(resData)
                            // return resData;
                            ep.emit('getCompanyData');
                        } else {
                            console.log('Oh no! error ' + res.text);
                        }
                    });

                })(currentPage);
            }*/

    },
    
    eventHandle: function (res) {
        console.log("触发事件")

        ep.after('getCompanyData', 1 ,function(articleUrls){
            console.log("事件代理")
            // 当所有 'getCompanyData' 事件完成后的回调触发下面事件
            // ...
            // res.write('<br />');
            // res.write('全部招聘数：   ' + pageRequestUrl.length*39 + '<br />' );
            //
            res.end(JSON.stringify(resData));
            
        });
    }

}


function start() {
    function onRequest(req, res) {
        // 设置字符编码(去掉中文会乱码)
        // res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});  // text/html
        res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
        spider.eventHandle(res)
        spider.init()
        
        // res.end("sucessfully")
        
    }


    http.createServer(onRequest).listen(3000);
}


exports.start= start;
