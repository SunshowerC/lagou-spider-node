var http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    async = require("async"),
    settings = require("../settings"),
    eventproxy = require('eventproxy');
let proxy = require('./proxy');

let CompanyModule = require('./db'); //数据库集合
let mapLimit = require('./mapLimit')

require('superagent-proxy')(superagent);

let header = {
'Accept':'application/json, text/javascript, */*; q=0.01',
'Accept-Encoding':'gzip, deflate, br',
'Accept-Language':'zh-CN,zh;q=0.9,zh-TW;q=0.8',
'Connection':'keep-alive',
'Content-Length':'40',
'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8',
'Cookie':'user_trace_token=20180202001832-dcad9599-14c0-4b25-bcc2-8ba67f639f3f; ,LGUID=20180202002853-fe2031db-076c-11e8-a513-525400f775ce; _ga=GA1.2.1712563544.1517502531; index_location_city=%E5%85%A8%E5%9B%BD; JSESSIONID=ABAAABAAAIAACBI3F666B6807F7CCF89FDA6EDA409E5C7B; hideSliderBanner20180305WithTopBannerC=1; _gid=GA1.2.1206953337.1520517390; Hm_lvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1519828999,1520339101,1520517391; LGSID=20180308215633-826187a5-22d8-11e8-a19a-525400f775ce; PRE_UTM=; PRE_HOST=; PRE_SITE=; PRE_LAND=https%3A%2F%2Fwww.lagou.com%2F; TG-TRACK-CODE=search_code; _gat=1; LGRID=20180308220920-4be7522d-22da-11e8-b147-5254005c3644; Hm_lpvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1520518160; SEARCH_ID=592a8e67bd6b4e1193e451a86a1a7cee',
'Host':'www.lagou.com',
'Origin':'https://www.lagou.com',
'Referer':'https://www.lagou.com/jobs/,list_web%E5%89%8D%E7%AB%AF?labelWords=&fromSearch=true&suginput=',
'User-Agent':`Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ,Chrome/63.0.3239.132 Safari/537.36`,
'X-Anit-Forge-Code':'0',
'X-Anit-Forge-Token':'None',
'X-Requested-With':'XMLHttpRequest',
};

let spider = {
    requestUrl : "https://www.lagou.com/jobs/positionAjax.json?needAddtionalResult=false&isSchoolJob=0",
    query: {
        
        city: '',
        pageNum: '',
        job: '',
    },
    request(proxyIp) {
        return new Promise((resolve,reject)=>{
            let pn = this.query.pageNum;
            (()=>{
                if (proxyIp) {
                    const TIMEOUT = 15000;
                    // requestUrl = 'http://m.lagou.com/jobs/3776097.html'
                    return superagent.post(this.requestUrl)
                            .timeout(TIMEOUT)
                            .proxy(proxyIp)
                } else {    
                    return superagent.post(this.requestUrl)
                }
            })().send({
                    first:false,
                    pn,
                    kd:'web前端'
                })
                .set(header)
                .end((err, res)=>{
                    let dataList = [];
                    if (err || !res || !res.ok) {
                        console.error('请求错误');
                        reject('request failed!')
                    } else  {
                        console.log(pn, res.body)
                        if (!res.body.content) {
                            return resolve();
                        } 
                        dataList = res.body.content.positionResult.result
                        if (dataList.length === 0) {
                            reject('finish')    
                        } else {
                            console.log('爬取到数据', pn)
                            resolve(dataList)
                        }
                    } 
                })
        })
        
    },

    handleCallbackData(companyList) {
        let arr = [];
        
        //处理数据
        companyList.forEach(function (item,index) {
            let salary = item.salary.split('-');
            
            //工资两种情况：”10k以上“ or "10k-15k"， 平均工资取中位数
            aveSalary = salary.length == 1 ? parseInt(salary[0])*1000 : (parseInt(salary[0]) + parseInt( salary[1] ) )*500;

            //过滤出所需数据
            arr[index] = {
                companyFullName: item.companyFullName,
                positionId : item.positionId ,
                city:item.city ,

                field: '',
                companySize:'',
                // financeStage:'' ,
                salary:aveSalary ,
                workYear:'' ,
                qualification: '',
                // employmentKeyword:  []
            }
        });

        return Promise.resolve(arr)
        
    },

    save2db(companyList) {
        return new Promise((resolve, reject)=>{
            CompanyModule.create(companyList,function (err,product) {
                // console.log(product);
                if (err) {
                    console.error(err.errmsg)
                    err.code == 11000 && resolve('丢弃重复数据')
                    reject(err);
                } else {
                    resolve("save data to database successfully")
                }
                
            })    
        })
    },

    run(query, proxyIp) {
        Object.assign(this.query, query);

        return this.request(proxyIp)
            // .then(this.handleCallbackData)
            // .then(this.save2db)
    }
}



exports.start =  (req,res) => {


    return (async ()=>{
        /* 遍历所有城市 */
        for (let curCity of settings.city) {
            let runningRequestNum = 0;
            let pageList = Array(settings.pages).fill(0).map((item, index)=> index + 1)
            let proxyIp;

            proxyIp = await proxy.getOneValidIp(0);

            await mapLimit(pageList, 3, (curPage)=>{
                    return new Promise((resolve, reject)=>{
                        let delay = parseInt(0|Math.random() *  1000 + 1000);
                        runningRequestNum++
                        proxy.getOneValidIp(curPage)
                        .then((proxyIp)=>{
                            setTimeout(()=>{
                               console.log('当前页', curPage, '代理ip', proxyIp)
                                spider.run({
                                    city: curCity,
                                    pageNum: curPage,
                                    job: settings.job,
                                }, proxyIp).then(result => {
                                    // res.write(`正在抓取的是【${curCity}】第 ${curPage}页，耗时 ${delay} 毫秒，当前并发数 ${runningRequestNum--}<br>`);
                                    resolve(result)   
                                })
                                .catch(e => {
                                    console.log('捕获错误')
                                    proxy.removeInvalidIp(proxyIp);
                                    resolve()
                                    
                                })
                            }, delay)
                        })
                        
                    })
                }).then(result => {
                    console.log(result)
                    res.write(JSON.stringify(result));   
                    res.write(`<br><br><br><br>`);           
                }).catch(e => {
                    if (e === 'finish') {
                        res.write(`完成${curCity}的爬虫<br><br><br><br>`);      
                        return 'finish'
                    } else {
                        return Promise.reject(e)
                    }
                })
        }
            
    })()
 
}


if (require.main === module) {
    exports.start()
}