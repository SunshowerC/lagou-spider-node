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
var currentPage = 6;

var spider = {
    init: function () {
        this.getPageRequestUrl();
        this.getCompanyInfo();
         // this.eventHandle();
        
    },
    
    getPageRequestUrl: function () {

    },

    getCompanyInfo: function () {

        //单个get 请求
        while (currentPage--) {
            superagent
                .get("http://www.lagou.com/jobs/positionAjax.json")
                .query({
                    px:'new',
                    city:'深圳',
                    needAddtionalResult:false,
                    pn:currentPage,
                    kd:'前端开发'
                })
                .end(function (err,res) {
                    if (res.ok) {
                        // console.log( JSON.stringify(res.body) );
                        
                        resData = resData.concat(res.body );//res.body.content.positionResult.result
                        
                        // console.log(resData)
                        ep.emit('getCompanyData');
                        console.log(currentPage)
                        
                        if (currentPage == 10) return false;
                        
                        
                    } else {
                        console.log('Oh no! error ' + res.text);
                    }
                })

        }



    },
    
    eventHandle: function (res) {
        console.log("触发事件")

        ep.after('getCompanyData', 5 ,function(articleUrls){
            console.log("事件代理")
            // 当所有 'getCompanyData' 事件完成后的回调触发下面事件

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
