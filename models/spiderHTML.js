
var http = require("http"),
    url = require("url"),
    superagent = require("superagent"),
    cheerio = require("cheerio"),
    async = require("async"),
    settings = require("../settings"),
    eventproxy = require('eventproxy');

let CompanyModule = require('./db'); //数据库集合
let mapLimit = require('./mapLimit')


let spiderHTML = {


    request({requestUrl, jobId}) {
        return new Promise((resolve,reject)=>{
            superagent
                .get(requestUrl)
                .set({
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
                    'Referrer': 'www.baidu.com',
                    'Cookie': 'user_trace_token=20180202001832-dcad9599-14c0-4b25-bcc2-8ba67f639f3f; LGUID=20180202002853-fe2031db-076c-11e8-a513-525400f775ce; index_location_city=%E5%85%A8%E5%9B%BD; JSESSIONID=ABAAABAAAGCABCC98D2F64D702FE7808D50FC7C2D7C7499; _gat=1; PRE_UTM=; PRE_HOST=; PRE_SITE=; PRE_LAND=https%3A%2F%2Fm.lagou.com%2Fjobs%2F4084618.html; _ga=GA1.2.1712563544.1517502531; _gid=GA1.2.1849429623.1517760673; _ga=GA1.3.1712563544.1517502531; Hm_lvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1517502531,1517669062; Hm_lpvt_4233e74dff0ae5bd0a3d81c6ccf756e6=1517760904; X_HTTP_TOKEN=aa7662a1b25a7e589baca1ab2dc650de; LGSID=20180205000759-91e0941c-09c5-11e8-aec8-5254005c3644; LGRID=20180205001508-91857e49-09c6-11e8-aed0-5254005c3644'

                })
                .end((err, res)=>{
                    if (err || !res || !res.ok) {
                        console.error(err);
                        reject('request failed!')
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
        
// console.log(companyInfo.get(0).innerText)
// console.log(companyInfo[0].innerText)
// console.log(companyInfo[0].text())

/*        let workYear = jobRequest.find('span:nth-child(3)').text().slice(0,-1).trim(),
            qualification = jobRequest.find('span:nth-child(4)').text().slice(0,-1).trim(),
            field = companyInfo.find('li:nth-child(1)').text().split(/\s+/)[1],
            // financeStage = companyInfo.find('li:nth-child(2)').text().split(/\s+/)[1],
            companySize = companyInfo.find('li:nth-child(3)').text().split(/\s+/)[1];*/
        let workYear = $('#content > div.detail > div.items > span.item.workyear > span').text(),
            qualification = $('#content > div.detail > div.items > span.item.education').text().trim(),
            field = $('#content > div.company.activeable > div > div > p').text().trim().split(/\s*\/\s*/)[0]
            companySize = $('#content > div.company.activeable > div > div > p').text().trim().split(/\s*\/\s*/)[2];

        console.log('info',
            [workYear,
            qualification,
            field,
            companySize].join(' | '));

            if ( !(workYear || qualification || field || companySize) ) {
                console.log(res.text)
                return Promise.reject('wrong response!');
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
                    console.log(id, "save data to database successfully" )
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


let getJobIds = () => {
    return new Promise((resolve, reject)=>{
        CompanyModule.find({companySize: ''},{"positionId":1,_id:0},function (err,result) {
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
    let count = 0;
    let runningRequestNum = 0;
    return getJobIds()
    .then(ids => {
        res.write(`共${ids.length}项。<br>`)
        mapLimit(ids, 2, (jobId)=>{
            return new Promise((resolve, reject)=>{

                let delay = parseInt(Math.random() * 5000 + 10000, 10);
                // let requestUrl = "https://www.lagou.com/jobs/" + jobId + ".html" ;
                let requestUrl = `https://m.lagou.com/jobs/${jobId}.html` ;
                
                runningRequestNum++
                setTimeout(()=>{

                    spiderHTML.run({
                        requestUrl,
                        jobId
                    }).then(result => {
                        res.write(`${count++}：正在抓取的是 ${requestUrl}，耗时 ${delay} 毫秒，当前并发数
                        ${runningRequestNum--}<br>`);
                        resolve(result)   
                    }).catch(reject)

                }, delay)
            })
        }).then(result => {
            console.log(result)
            res.write(JSON.stringify(result));   
            res.send(`<br><br><br><br>`);           
        }).catch(e => {
            console.log(e);
            res.write(JSON.stringify(e))
        })
    })
}