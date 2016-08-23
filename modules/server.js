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
    CompanyModule = require('./db'); //数据库集合



var idAndKeyword = {} ;  //存放职位详情页id 和 职位关键词 idAndKeyword.id = keyword
var detailUrlId = [];  //存放职位详情页url
var resData = [];//存储相应回来的数据



var pageRequest = "http://www.lagou.com/jobs/positionAjax.json"; //页数请求url
    // city = "北京",  //所在城市
    // job = "前端开发";

//标签必须小写
var label = "性能,兼容,组件,响应式,架构,移动,手机,面向对象,数据库,博客,微信,数据结构,算法,svn,git,oop,mobile,webapp,gulp,grunt,webpack,http,canvas,svg,backbone,ember,angular,react,vue,node,bootstrap,jquery,ajax,sass,less,stylus,require,sea,photoshop,firework,php,python,mvc,mvvm,dom,json,xml,zepto,dojo,d3,underscore,seo,oracle,sql,mongodb".split(',');


var pageArr = new Array(250), i = pageArr.length;  //爬取多少页
while (i--) {
    pageArr[i] = i + 1;
}


var spiderPage = {

    //设置参数
    settings:function (opt) {
        this.city = opt.city || "深圳";
        this.job = opt.job || "前端开发";
    },

    //发送单次请求，测试用
    sendSingleReq:function (option,callback) {
        superagent
            .get(pageRequest)
            .query({
                px: 'new',
                city: option.city,
                needAddtionalResult: false,
                pn: option.curPage,
                kd: '前端开发'
            })
            .end(callback)
    },

    //发送请求
    sendRequest: function (curPage) {
        var This = this;
        //单个get 请求
        superagent
            .get(pageRequest)
            .query({
                px: 'new',
                city: This.city,
                needAddtionalResult: false,
                pn: curPage,
                kd: This.job
            })
            .end(This.getCallbackData)
    },

    //获取请求后返回的数据 并处理
    getCallbackData :function (err, res) {
        var This = this;
        if (err) return console.error(err);
        if(!res) return false;
        if (res.ok) {
            // console.log( JSON.stringify(res.body) );

            // resData = resData.concat( res.body );//res.body.content.positionResult.result

            // ep.emit('handleData',res.body.content.positionResult.result);

            var arr = [],
                companyList = res.body.content.positionResult.result;
            if (companyList.length == 0) return false;
            //处理数据
            companyList.forEach(function (item,index) {
                var salary = item.salary.split('-');
                //工资两种情况：”10k以上“ or "10k-15k"
                aveSalary = salary.length == 1 ? parseInt(salary[0])*1000 : (parseInt(salary[0]) + parseInt( salary[1] ) )*500;

                arr[index] = {
                    companyFullName: item.companyFullName,
                    positionId : item.positionId ,
                    city:item.city ,
                    companySize:item.companySize ,
                    financeStage:item.financeStage ,
                    salary:aveSalary ,
                    workYear:item.workYear ,
                    employmentKeyword:  []
                }
                

            });
            // console.log(arr)

            spiderPage.saveData(arr);
            // return arr;

        } else {
            console.log('Oh no! error ' + res.text);
        }
    },

    //保存数据到数据库
    saveData: function (companyList) {

            // var doc =  new CompanyModule();
            // console.log(companyList);
/*
            CompanyModule.create(companyList)
                .then(function (product) {
                    if (err) return console.error(err);
                    console.log(product);
                    console.log("save data to database successfully")
                })
                */
        CompanyModule.create(companyList,function (err,product) {
                if (err) return console.error(err);
                // console.log(product);
                console.log("save data to database successfully")
            })


    },

    //响应数据返回前端界面
    sendResponse : function (res) {

            console.log("response data successfully");
            res.write("successfully");
            // res.write(JSON.stringify(resData));
            // res.end();

    },


    //启动，并控制请求并发数量
    runSpider: function (res,callbackfunc) {
        var This = this;
        var curCount = 0;
       
        console.log("触发事件");
        //异步控制
        var reptileMove = function(curPage,callback){
            //延迟毫秒数(1000毫秒以内)
            var delay = parseInt((Math.random() * 30000000) % 4000 + 1000, 10);
            curCount++;
            

            // res.write( "第" + (count++) + "页数据 " + " 正在抓取" +  + '<br />');
            
            // 发送请求
            This.sendRequest(curPage);

            setTimeout(function() {
                // console.log('现在的并发数是', curCount, '，正在抓取的是', curPage, '，耗时' + delay + '毫秒');
                res.write('现在的并发数是' + curCount + '，正在抓取的是' + curPage + '，耗时' + delay + '毫秒<br>');
                curCount--;
                callback(null,curPage +' Call back content');
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
            // ep.emit('sendResponse');
            callbackfunc();

            console.log("get all data done");
        });
    }

};






//以下开始爬取招聘职位详情页标签
var spiderLabel = {

    //   从数据库获取
    getDetailUrl: function (callback) {
        var This = this;
        CompanyModule.find({employmentKeyword: []},{"positionId":1,_id:0},function (err,result) {
            result.forEach(function (item) {
                detailUrlId.push(  item.positionId  );
            });
            console.log("从数据库获取id数据")
            callback();
        })

    },

    //发送请求获取数据
    sendDetailUrlReq: function (curId) {
        var This = this;
        //单个get 请求
        superagent
            .get( "http://www.lagou.com/jobs/" + curId + ".html" )
            .set('User-Agent',"Mozilla/5.0+(compatible;+MSIE+9.0;+Windows+NT+6.1;+Trident/5.0);+360Spider")
            .end(function (err, sres) {
                This.handleCallbackData(err,sres, curId);
            });
    },

    //处理 请求返回数据
    handleCallbackData: function (err,sres,curId) {
        var This = this;
        if (err) return console.error(err);
        if(!sres) return false;
        var $ = cheerio.load(sres.text);

        var text = $('#job_detail').find('.job_bt').text().toLowerCase();
        var employmentKeyword =  idAndKeyword[curId] = [];


        label.forEach(function (item) {

            if (text.indexOf(item) >= 0 ) {
                employmentKeyword.push(item);
            }
        })

    },

    updateData:function () {

        for (id in idAndKeyword) {
            if( !idAndKeyword.hasOwnProperty(id) ) continue;
            CompanyModule.findOneAndUpdate({positionId: id },{employmentKeyword: idAndKeyword[id] }, function (err,result) {
                console.log(result);
            } )
        }

    },

    run : function (res,callbackfunc) {
        var This = this;
        var curCount = 0;
        var counting =0;  //计数
        
        console.log("开始爬取标签数据");
        res.write("将要爬取 " + detailUrlId.length + "个职位。<br>")
        
        //异步控制
        var reptileMove = function(curId,callback){
            //延迟毫秒数(1000毫秒以内)
            var delay = parseInt((Math.random() * 30000000) % 4000, 10) + 1000;
            curCount++;



            // 发送请求
            This.sendDetailUrlReq(curId);

            setTimeout(function() {
                // console.log('现在的并发数是', curCount, '，正在抓取的是', curId, '，耗时' + delay + '毫秒');
                res.write( (counting++) +'. 现在的并发数是' + curCount + '，正在抓取的是' + curId + '，耗时' + delay + '毫秒<br>');
                curCount--;
                callback(null,curId +' Call back content');
            }, delay);
        };


        // 使用async控制异步抓取
        // mapLimit(arr, limit, iterator, [callback])
        // 异步回调
        // detailUrlId-{array}-全部id数组; curId-当前id
        async.mapLimit(detailUrlId, 5 ,function (curId, callback) {
            reptileMove(curId, callback);
        }, function (err,result) {


            console.log(result);

            callbackfunc();

            
        });
    }

    
};





function start() {
    function onRequest(req, res) {
        var urlObj = url.parse(req.url,true);
 
        if (urlObj.pathname != "/") return false;
        
        // 设置字符编码(去掉中文会乱码)
        //     res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
        res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8' });  // text/html

        

        // 测试单次触发爬虫  //深圳120  北京244
/*        spiderPage.sendSingleReq({curPage:244,city:"北京"},function (err, sres) {
            console.log("send single request successfully");
            res.end(JSON.stringify(sres.body));
        });*/

/*
        spiderPage.settings({
   
        });
        spiderPage.runSpider(res,function () {
            spiderPage.sendResponse(res);
            console.log("结束页数爬虫");
            
            spiderLabel.getDetailUrl(function () {
                spiderLabel.run(res,function () {

                    spiderLabel.updateData();

                    res.write(JSON.stringify(idAndKeyword));

                    res.write("结束爬虫");

                    // res.write(JSON.stringify(resData));
                    res.end();
                    console.log("结束爬虫")
                });
            });
        });
 */
        
        
        //爬取详情页招聘关键词        
        spiderLabel.getDetailUrl(function () {
            spiderLabel.run(res,function () {

                spiderLabel.updateData();

                res.write(JSON.stringify(idAndKeyword));
                
                res.write("结束爬虫");

                // res.write(JSON.stringify(resData));
                res.end();

            });   
        });
        


         
        
    }


    http.createServer(onRequest).listen(3000);
}


exports.start = start;
