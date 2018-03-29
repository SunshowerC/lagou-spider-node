
let http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    settings = require("../settings"),
    eventproxy = require('eventproxy');

let proxy = require('./proxy');
let CompanyModule = require('./db'); //数据库集合
let mapLimit = require('./mapLimit')

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

require('superagent-proxy')(superagent);

let spiderHTML = {

    request({requestUrl, jobId, proxyIp=''} ) {
        return new Promise((resolve,reject)=>{
            (()=>{
                if (proxyIp) {
                    const TIMEOUT = 15000;
                    // requestUrl = 'http://m.lagou.com/jobs/3776097.html'
                    return superagent.get(requestUrl)
                            .timeout(TIMEOUT)
                            .proxy(proxyIp)
                } else {    
                    return superagent.get(requestUrl)
                }
            })()
            .set({
'Connection': 'keep-alive',
'Host': 'www.lagou.com',
'Connection': 'keep-alive',
'Cache-Control': 'max-age=0',
'Upgrade-Insecure-Requests': '1',
'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
'Referer': 'https://www.lagou.com/',
'Accept-Encoding': 'gzip, deflate, sdch, br',
'Accept-Language': 'zh-CN,zh;q=0.8',
/*'Cookie': 'user_trace_token=20180129234926-fbca3d2c-050b-11e8-abd5-5254005c3644; LGUID=20180129234926-fbca4005-050b-11e8-abd5-5254005c3644; index_location_city=%E5%85%A8%E5%9B%BD; JSESSIONID=ABAAABAAADEAAFI7408DB57C16ACD2B65A3622981237C6F; PRE_UTM=; PRE_HOST=; PRE_SITE=; PRE_LAND=https%3A%2F%2Fwww.lagou.com%2Fjobs%2F3776097.html; TG-TRACK-CODE=index_hotjob; _gid=GA1.2.873716699.1520171079; _ga=GA1.2.2019647264.1517240965; Hm_lvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1517664816,1518102544,1520171079; Hm_lpvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1520177925; LGSID=20180304232704-7e10d80b-1fc0-11e8-9c55-525400f775ce; LGRID=20180304233844-1f80c464-1fc2-11e8-9c58-525400f775ce',*/

                })
                .end((err, res)=>{
                    if (err ) {
                        // console.error(err);
                        // console.log(`request failed!`, err )

                        console.log(`proxyIp`,proxyIp, `requestUrl`, requestUrl )
                        reject({
                            code: -1,
                            msg: 'request failed!',
                            jobId
                        })
                    } else {
                        resolve({res, jobId})
                    } 
                })
        })
    },
    handleCallbackData({res, jobId}) {
        var $ = cheerio.load(res.text);
 
        let workYear = $('#content > div.detail > div.items > span.item.workyear > span').text(),
            qualification = $('#content > div.detail > div.items > span.item.education').text().trim(),
            field = $('#content > div.company.activeable > div > div > p').text().trim().split(/\s*\/\s*/)[0]
            companySize = $('#content > div.company.activeable > div > div > p').text().trim().split(/\s*\/\s*/)[2];


        console.log('info',
            [workYear,
            qualification,
            field,
            companySize].join(' | '));

            /* 如果这四项数据都没有提取到，很有可能是被拉勾的反爬虫机制拦截了 */
            if ( !(workYear || qualification || field || companySize) ) {
                console.log(res.text)
                return Promise.reject({code:-1, msg:'wrong response!', jobId});
            }
        /*console.log('info',
            jobRequest.find('span:nth-child(3)').text(),
            jobRequest.find('span:nth-child(4)').text(),
            companyInfo.find('li:nth-child(1)').text(),
            companyInfo.find('li:nth-child(3)').text())*/


        return {
            id: jobId,
            jobInfo: {
                workYear,
                qualification,
                field,
                // financeStage,
                companySize,
            }
        }
    },

    save2db({id, jobInfo}) {
        return new Promise((resolve, reject)=>{
            CompanyModule.findOneAndUpdate({positionId: id }, jobInfo, 
                (err,result) => {
                if (err) {
                    console.error('save error', err)
                    reject(err);
                } else {
                    console.log( "成功保存数据到数据库", result.positionId )
                    resolve("save data to database successfully")
                }
            })  
        })
    },

    run(query) {

        return this.request(query)
            .then(this.handleCallbackData)
            .then(this.save2db)
    }

}



let sleep = (time) => {
    return new Promise(resolve => {
        setTimeout(resolve, time)
    })
}


/* 获取招聘岗位id */
let getJobIds = () => {
    return new Promise((resolve, reject)=>{
        CompanyModule.find({
            companySize: '', 
            workYear:'',
            field: '',
            qualification: ''

        },
            {"positionId":1,_id:0},function (err,result) {
            if(err) {
                console.log('fail to get id list')
                return reject(err)
            }

            let ids = result.map(item => item.positionId)

            console.log("成功从数据库获取id数据");
            resolve(ids)
        })
    })
};



exports.start = (req, res) => {
    let limit = 5; // 并发限制数
    let count = 0; // 累计爬取数据计数
    let runningRequestNum = 0; // 当前并发数
    

    res.write(`启动爬虫：<br>`)

    return proxy.getOneValidIp()
    .then(()=>{
        return getJobIds()  
    }).then(ids => {
        res.write(`共${ids.length}项。<br>`)

        // proxy.getValidIps([ 'http://112.27.129.54:3128']);

        mapLimit(ids, limit, async (jobId)=>{
            // let requestUrl = "https://www.lagou.com/jobs/" + jobId + ".html" ;
            let requestUrl = `http://m.lagou.com/jobs/${jobId}.html?source=home_hot&i=home_hot-6` ;
            let delay = parseInt(Math.random() * 2000);

            let currentIndex = count++;
            let proxyIp;

            proxyIp = await proxy.getOneValidIp(currentIndex);

            // proxyIp =  ''
 
            runningRequestNum++

            await sleep( delay );
            let result = await spiderHTML.run({
                            requestUrl,
                            jobId,
                            proxyIp
                        }).catch(e =>{
                            if ( e.code === -1 ){
                                /* 本次爬取失败，ip 可能失效，将其从动态ip池移除 */
                                proxy.removeInvalidIp(proxyIp);
                                ids.push(jobId)
                                console.log(`剩余:`,ids.length)
                                return e;
                            }
                        })
            
            if (result.code === -1 ) {
                res.write(`${currentIndex}：jobId: ${result.jobId}; msg:${result.msg}, proxyIp：${proxyIp}<br>`)
            } else {
                res.write(`${currentIndex}：当前并发数${runningRequestNum}。正在使用代理 ${proxyIp} 抓取的是 ${requestUrl}，耗时 ${delay} 毫秒，<br>`);    
            }
            runningRequestNum--
            
            return result;
        }).then(result => {
            console.log(result)
            res.write(JSON.stringify(result));   
            res.write(`<br><br><br><br>`);           
        }).catch(e => {
            console.log(e);
            res.write('Caught by async: '+JSON.stringify(e))
            
        })


 
    })
}