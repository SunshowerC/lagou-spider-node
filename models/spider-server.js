/**
 * Created by ChenWeiYu
 * Date : 2016/8/28
 * Time : 15:29
 */

var http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    async = require("async"),
    settings = require("../settings"),
    eventproxy = require('eventproxy');


var CompanyModule = require('./db'); //数据库集合



var idAndKeyword = {} ;  //存放职位详情页id 和 职位关键词 idAndKeyword.id = keyword
var detailUrlId = [];  //存放职位详情页url

// var pageRequest = "http://www.lagou.com/jobs/positionAjax.json"; //页数请求url
var pageRequest = "http://m.lagou.com/search.json"

//标签必须小写
 
var pages = settings.pages ; //将要爬取的页数
var concurrent = 5;  //并发数设置

var pageArr = new Array(pages), i = pages;  //存储每一页对应的id, 生成一个 用来控制并发 的数组
while (i--) {
    pageArr[i] = i + 1;
}
var stopFlag = false;

// spiderPage通过"http://www.lagou.com/jobs/positionAjax.json"爬取招聘职位详情
var spiderPage = {
    stop: false,

    //设置参数
    settings:function (opt) {
        this.city = opt.city || settings.city ;
        this.job = opt.job || settings.job ;
    },

    //发送单次请求，测试用
    sendSingleReq:function (option,callback) {
        superagent
            .get(pageRequest)
            .query({
                px: 'new',
                city: option.city,
                needAddtionalResult: false,
                pn: option.page,
                kd: option.job
            })
            .end(callback)
    },

    //发送请求
    sendRequest: function (curPage) {
        var This = this;
        
        //根据拉勾提供的接口，发送单个get 请求，获取json 数据
        superagent
            .get(pageRequest)
            .query({
                city: This.city,
                // needAddtionalResult: false,
                pageNo: curPage,
                positionName: This.job
 
            })
            .end(This.getCallbackData)

    },

    //获取请求后返回的数据 并处理
    getCallbackData :function (err, res) {
        var This = this;
        if (err) return console.error(err);
        if(!res) return false;
        if (res.ok) {
            
            var arr = [],
                companyList = res.body.content.data.page.result;
                // companyList = res.body.content.positionResult.result;
            if (companyList.length == 0) {
                stopFlag = true;
                return false;
            }
            
            

            //处理数据
            companyList.forEach(function (item,index) {
                var salary = item.salary.split('-');
                
                //工资两种情况：”10k以上“ or "10k-15k"， 平均工资取中位数
                aveSalary = salary.length == 1 ? parseInt(salary[0])*1000 : (parseInt(salary[0]) + parseInt( salary[1] ) )*500;

                //过滤出所需数据
                arr[index] = {
                    companyFullName: item.companyFullName,
                    positionId : item.positionId ,
                    city:item.city ,
                    field: '',
                    companySize:'',
                    financeStage:'' ,
                    salary:aveSalary ,
                    workYear:'' ,
                    employmentKeyword:  []
                }


            });

            spiderPage.saveData(arr);

        } else {
            console.log('Oh no! error ' + res.text);
        }
    },

    //保存数据到数据库
    saveData: function (companyList) {

        CompanyModule.create(companyList,function (err,product) {
            // console.log(product);
            if (err) return console.error(err);
            // console.log(product);
            console.log("save data to database successfully")
        })


    },

    deleteWrongData:function () {
        CompanyModule.remove({workYear:/\d$/ })
            .exec();
    },

    //启动，并控制请求并发数量
    run: function (res,callbackfunc) {
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
            if (stopFlag) {
                delay = 0;
            } else {
                This.sendRequest(curPage);
            }

            setTimeout(function() {
                // console.log('现在的并发数是', curCount, '，正在抓取的是', curPage, '，耗时' + delay + '毫秒');
                res.write('现在的并发数是' + curCount + '，正在抓取的是第' + curPage + '页数据，耗时' + delay + '毫秒<br>');
                curCount--;
                callback(null,curPage +' Call back content');
            }, delay);
        };


        // 使用async控制异步抓取
        // mapLimit(arr, limit, iterator, [callback])
        // 异步回调
        // pageArr-{array}-全部页数数组; curPage-当前页数
        async.mapLimit(pageArr, concurrent ,function (curPage, callback) {
            console.log(stopFlag);
            
                reptileMove(curPage, callback);    
            
        }, function (err,result) {

            //pageArr 访问完成的回调函数
            //result 是经过callback 函数处理过的articleUrls ,此处为每个文章url 后面加字符串 'Call back content'
            console.log(result);
            
            This.deleteWrongData();
            //触发 “返回数据回前端”
            callbackfunc();
            
            console.log("get all data done");
        });
    }

};






//以下开始爬取招聘职位详情页标签
var spiderLabel = {

    //   从数据库获取positionId ， 爬取每个职位的招聘详情页
    getDetailUrl: function (callback) {

        CompanyModule.find({employmentKeyword: []},{"positionId":1,_id:0},function (err,result) {
            result.forEach(function (item) {
                detailUrlId.push(  item.positionId  );
            });


            console.log("从数据库获取id数据");
            callback();
        })

    },

    //发送请求获取返回页面文档的信息
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

    //处理 请求返回数据，获取招聘关键词
    handleCallbackData: function (err,sres,curId) {

        if (err) return console.error(err);
        if(!sres) return false;
        var $ = cheerio.load(sres.text);

        var text = $('#job_detail').find('.job_bt').text().toLowerCase();
        var employmentKeyword =  idAndKeyword[curId] = [];


        /*settings.keyword.forEach(function (item) {
            if (text.indexOf(item) >= 0 ) {
                employmentKeyword.push(item);
            }
        })*/

    },

    //将获取到的招聘关键词更新到 数据库集合里
    updateData:function () {

        for (id in idAndKeyword) {
            if( !idAndKeyword.hasOwnProperty(id) ) continue;
            CompanyModule.findOneAndUpdate({positionId: id },{
                employmentKeyword: idAndKeyword[id] 
            }, function (err,result) {
                // console.log(result);
            } )
        }

    },

    
    
    //启动爬取关键词的爬虫
    run : function (res,callbackfunc) {
        var This = this;
        var curCount = 0;
        var counting =0;  //计数

        console.log("开始爬取标签数据");
        res.write("<br>将要爬取 " + detailUrlId.length + "个职位。<br>");

        //异步控制
        var reptileMove = function(curId,callback){
            //延迟毫秒数
            var delay = parseInt((Math.random() * 30000000) % 4000, 10) + 1000;
            curCount++;
            
            // 发送请求
            This.sendDetailUrlReq(curId);

            
            setTimeout(function() {
                // console.log('现在的并发数是', curCount, '，正在抓取的是', curId, '，耗时' + delay + '毫秒');
                res.write( (counting++) +'. 现在的并发数是' + curCount + '，正在抓取的是http://www.lagou.com/jobs/' + curId + '.html，耗时' + delay + '毫秒<br>');
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
        }, function (err,result) {   // 全部爬完数据后
            
            console.log(result);
            callbackfunc();
        });
    }


};





exports.startSpider = function (req,res) {
    // 设置字符编码(去掉中文会乱码)
    //     res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});  //json
    res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8' });               // text/html
    var i = 0;

    iteration();
    // runSpiderLabel();
    
    //
    function runSpiderLabel() {
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

    function iteration() {
        stopFlag = false;

        spiderPage.settings({
            city:settings.city[i++],
            job:settings.job
        });

        spiderPage.run(res,function () {
            res.write("" + settings.city[i-1]+" 结束页数爬虫<br><br>");
            if (i == settings.city.length && settings.keyword) {
                setTimeout(function () {
                    // runSpiderLabel();
                },3000);
            } else {
                iteration()
            }

        });
    }

};



