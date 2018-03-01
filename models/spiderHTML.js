
let http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    settings = require("../settings"),
    eventproxy = require('eventproxy');

let proxy = require('./proxy');
let CompanyModule = require('./db'); //数据库集合
let mapLimit = require('./mapLimit')


require('superagent-proxy')(superagent);

let spiderHTML = {

    request({requestUrl, jobId, proxyIp=''} ) {
        return new Promise((resolve,reject)=>{
            (()=>{
                if (proxyIp) {
                    const TIMEOUT = 15000;
                    let url = 'http://m.lagou.com/jobs/3776097.html'
                    return superagent.get(url)
                            .timeout(TIMEOUT)
                            .proxy(proxyIp)
                    return superagent.get(requestUrl).timeout(15000).proxy(proxyIp)
                } else {
                    return superagent.get(requestUrl)
                }
            })()
            .set({
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Encoding': 'gzip, deflate',
                    'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
                     'Cookie': `user_trace_token=20180202001832-dcad9599-14c0-4b25-bcc2-8ba67f639f3f; LGUID=20180202002853-fe2031db-076c-11e8-a513-525400f775ce; index_location_city=%E5%85%A8%E5%9B%BD; _ga=GA1.3.1712563544.1517502531; _ga=GA1.2.1712563544.1517502531; JSESSIONID=ABAAABAAAGCABCC2FBAF68CBF38E732BFA063C3E925D6B9; _gid=GA1.2.878231416.1519828998; Hm_lvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1517502531,1517669062,1519828999; _gat=1; LGSID=20180301000823-99db587e-1ca1-11e8-b106-5254005c3644; PRE_UTM=; PRE_HOST=; PRE_SITE=; PRE_LAND=http%3A%2F%2Fm.lagou.com%2Fjobs%2F3776097.html; Hm_lpvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1519834112; LGRID=20180301000834-a0974950-1ca1-11e8-b106-5254005c3644`

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

       
        let jobRequest = $('.job_request > p');
        let companyInfo = $('.c_feature');
        

/*        let workYear = jobRequest.find('span:nth-child(3)').text().slice(0,-1).trim(),
            qualification = jobRequest.find('span:nth-child(4)').text().slice(0,-1).trim(),
            field = companyInfo.find('li:nth-child(1)').text().split(/\s+/)[1],
            // financeStage = companyInfo.find('li:nth-child(2)').text().split(/\s+/)[1],
            companySize = companyInfo.find('li:nth-child(3)').text().split(/\s+/)[1];*/
        let workYear = $('#content > div.detail > div.items > span.item.workyear > span').text(),
            qualification = $('#content > div.detail > div.items > span.item.education').text().trim(),
            field = $('#content > div.company.activeable > div > div > p').text().trim().split(/\s*\/\s*/)[0]
            companySize = $('#content > div.company.activeable > div > div > p').text().trim().split(/\s*\/\s*/)[2];

        let infoList = $('#content > div.company.activeable > div > div').html();
        console.log(res.text)   
        /*console.log('info',
            [workYear,
            qualification,
            field,
            companySize].join(' | '));*/

            if ( !(workYear || qualification || field || companySize) ) {
                // console.log(res.text)
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
                    console.error(err)
                    reject(err);
                } else {
                    console.log( "save data to database successfully", result )
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
 

    return getJobIds()
    .then(ids => {
        res.write(`共${ids.length}项。<br>`)

        // proxy.getValidIps([ 'http://112.27.129.54:3128']);

        mapLimit(ids, limit, async (jobId)=>{
            let delay = parseInt(Math.random() * 2000);
            // let requestUrl = "https://www.lagou.com/jobs/" + jobId + ".html" ;
            let requestUrl = `http://m.lagou.com/jobs/${jobId}.html` ;
            runningRequestNum++

            await sleep(delay);
            
            count++
            let proxyIp = await proxy.getOneValidIp(count);

            // proxyIp =  'http://123.207.150.111:8888'
 
           
            let result = await spiderHTML.run({
                            requestUrl,
                            jobId,
                            proxyIp
                        }).catch(e =>{
                            if ( e.code === -1 ){
                                proxy.removeInvalidIp(count);

                                return e;
                            }
                        })
            
            if (result.code === -1 ) {
                res.write(`jobId: ${result.jobId}; msg:${result.msg}, proxyIp：${proxyIp}<br>`)
            } else {
                res.write(`${count}：当前并发数${runningRequestNum}。正在使用代理 ${proxyIp} 抓取的是 ${requestUrl}，耗时 ${delay} 毫秒，<br>`);    
            }
            runningRequestNum--
            
            return result;
        }).then(result => {
            console.log(result)
            res.write(JSON.stringify(result));   
            res.write(`<br><br><br><br>`);           
        }).catch(e => {
            console.log(e);
            res.write(JSON.stringify(e))
            /* 本次爬取失败，ip 可能失效，将其从动态ip池移除 */
        })


 
    })
}