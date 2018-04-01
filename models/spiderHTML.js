
let http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    settings = require("../settings"),
    eventproxy = require('eventproxy');

let proxy = require('./proxy');
let JobModule = require('./db'); //数据库集合
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

                })
                .end((err, res)=>{
                    if (err ) {
                        // console.error(err);
                        // console.log(`request failed!`, err )

                        console.log(`proxyIp`,proxyIp, `requestUrl`, requestUrl )
                        reject({
                            code: -1,
                            msg: '请求失败! 该代理IP可能已失效。',
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
                return Promise.reject({code:-1, msg:'响应数据异常，Ip可能已被封!', jobId});
            }


        return {
            id: jobId,
            jobInfo: {
                workYear,
                qualification,
                field,
                companySize,
            }
        }
    },

    save2db({id, jobInfo}) {
        return new Promise((resolve, reject)=>{
            JobModule.findOneAndUpdate({positionId: id }, jobInfo, 
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
        JobModule.find({
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