var http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    async = require("async"),
    settings = require("../settings"),
    eventproxy = require('eventproxy');

let CompanyModule = require('./db'); //数据库集合
let mapLimit = require('./mapLimit')


let spider = {
    requestUrl : "http://m.lagou.com/search.json",
    query: {
        city: '',
        pageNum: '',
        job: '',
    },
    
    /**
     * 发起单个请求
     * @return {<Promise<Array>> | <Promise<String>>} 请求成功resolve原始数据，否则reject
     **/
    request() {
        return new Promise((resolve,reject)=>{
            superagent
            .get(this.requestUrl)
            .query({
                city: this.query.city,
                pageNo: this.query.pageNum,
                positionName: this.query.job
            }).end((err, res)=>{
                let dataList = [];
                if (err || !res || !res.ok) {
                    console.error(err);
                    reject('request failed!')
                } else  {
                    dataList = res.body.content.data.page.result
                    if (dataList.length === 0) {
                        reject('finish')    
                    } else {
                        resolve(dataList)
                    }
                } 
            })
        })
    },

    /**
     * 处理爬取到的原始数据，提取出所需的数据
     * @param {<Array>} - companyList : 原始数据
     * @return {<Promise<Array>>} resolve处理过的数据
     **/
    handleCallbackData(companyList) {
       
        //处理数据
         let arr = companyList.map((item) => {
            let salary = item.salary.split('-');
            
            //工资两种情况：”10k以上“ or "10k-15k"， 平均工资取中位数
            aveSalary = salary.length == 1 ? parseInt(salary[0])*1000 : (parseInt(salary[0]) + parseInt( salary[1] ) )*500;

            //过滤出所需数据
            return {
                companyFullName: item.companyFullName,
                positionId : item.positionId ,
                salary:aveSalary ,
                city:item.city ,

                field: '',
                companySize:'',
                workYear:'' ,
                qualification: '',
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

    run(query) {
        Object.assign(this.query, query);

        return this.request()
            .then(this.handleCallbackData)
            .then(this.save2db)
    },


}


let sleep = (time) => {
    return new Promise(resolve => {
        setTimeout(resolve, time)
    })
}



exports.start =  (req,res) => {
    let limit = 5 ; // 并发控制数

    return (async ()=>{
        /* 遍历所有城市 */
        for (let curCity of settings.city) {
            let runningRequestNum = 0;  // 当前并发量
            let pageList = Array(settings.pages).fill(0).map((item, index)=> index + 1) // 页码

            let mapResult = await mapLimit(pageList, limit, async (curPage)=>{

                let delay = parseInt(0|Math.random() *  1000 + 1000);

                runningRequestNum++
                await sleep(delay); // delay 一下，避免短时间请求太多被封ip
                let result = await spider.run({
                                city: curCity,
                                pageNum: curPage,
                                job: settings.job,
                            });

                res.write(`正在抓取的是【${curCity}】第 ${curPage}页，耗时 ${delay} 毫秒，当前并发数 ${runningRequestNum--}<br>`);

                return result;

                    /*return new Promise((resolve, reject)=>{
                        let delay = parseInt(0|Math.random() *  1000 + 1000);
                        runningRequestNum++
                        setTimeout(()=>{
                           

                            spider.run({
                                city: curCity,
                                pageNum: curPage,
                                job: settings.job,
                            }).then(result => {
                                res.write(`正在抓取的是【${curCity}】第 ${curPage}页，耗时 ${delay} 毫秒，当前并发数 ${runningRequestNum--}<br>`);
                                resolve(result)   
                            })
                            .catch(reject)
                        }, delay)
                    })*/
                }).catch(e => {
                    if (e === 'finish') {
                        res.write(`完成${curCity}的爬虫<br><br><br><br>`);      
                        return 'finish'
                    } else {
                        return Promise.reject(e)
                    }
                })

            res.write(`当次并发爬取结果：${JSON.stringify(mapResult)}<br><br><br><br>`);   
            
        }
            
    })()
 

}


