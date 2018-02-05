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
    request() {
        return new Promise((resolve,reject)=>{
            superagent
            .get(this.requestUrl)
            .query({
                city: this.query.city,
                // needAddtionalResult: false,
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
                    console.error(err)
                    reject(err);
                } else {
                    resolve("save data to database successfully")
                }
                // console.log(product);
            })    
        })
    },

    run(query) {
        Object.assign(this.query, query);

        return this.request()
            .then(this.handleCallbackData)
            .then(this.save2db)
    }
}


let pageList = Array(settings.pages).fill(0).map((item, index)=> index + 1)

exports.start =  (req,res) => {


    return (async ()=>{
        /* 遍历所有城市 */
        for (let curCity of settings.city) {
            let runningRequestNum = 0;

            await mapLimit(pageList, 5, (curPage)=>{
                    return new Promise((resolve, reject)=>{
                        let delay = parseInt((Math.random() * 30000000) % 4000 + 1000, 10);
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
                    })
                }).then(result => {
                    console.log(result)
                    res.write(JSON.stringify(result));   
                    res.write(`<br><br><br><br>`);           
                }).catch(e => {
                    if (e === 'finish') {
                        res.write(`<br><br><br><br>`);      
                        return 'finish'
                    } else {
                        return Promise.reject(e)
                    }
                })
        }
            
    })()
 

}


