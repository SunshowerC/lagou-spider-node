let superagent = require("superagent");
require('superagent-proxy')(superagent);
let cheerio = require("cheerio");

// IP 源， 可自行选用更加稳定可靠的IP 源
let proxyListUrl = 'http://www.66ip.cn/mo.php?sxb=&tqsl=20&port=&export=&ktip=&sxa=%B5%E7%D0%C5&submit=%CC%E1++%C8%A1&textarea=http%3A%2F%2Fwww.66ip.cn%2F%3Fsxb%3D%26tqsl%3D20%26ports%255B%255D2%3D%26ktip%3D%26sxa%3D%25B5%25E7%25D0%25C5%26radio%3Dradio%26submit%3D%25CC%25E1%2B%2B%25C8%25A1';
proxyListUrl = `https://www.us-proxy.org/`

proxyListUrl = `http://www.89ip.cn/apijk/?&tqsl=600&sxa=&sxb=&tta=&ports=&ktip=&cf=1`


let proxy = {
    ips : [ ],   // 代理ip 列表


    MIN_IP_NUM: 10, // 至少要 MIN_IP_NUM 个 IP
    isRunning: false, // 是否正在从proxyListUrl获取ips，同一时间理应只有一个getProxyIps在跑

    getProxyIps() {
        this.isRunning = true;
        return new Promise((resolve, reject) => {
            console.log(`getting ips from ${proxyListUrl }`)
            superagent
                .get(proxyListUrl )
                .set({
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Encoding': 'gzip, deflate',
                    'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
                    'Referer': 'http://www.66ip.cn/'
                })
                .end((err, res) => {
                    if (err || !res || !res.ok) {
                        console.error('get proxy list failed!', err);
                        reject('get proxy list failed!')
                    } else {
                        var $ = cheerio.load(res.text);
                        // console.log(`ip table`, $('#list').text())
                        /*let proxyList = $('.table.float-left').text().match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,4}/g);*/

                        // https://www.us-proxy.org/    $('#proxylisttable')
                        // let proxyList = $('#proxylisttable').html().replace(/<\/td>\s*<td>/g, ':').match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,4}/g);
                        

                        let proxyList = res.text.match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,4}/g);


                        if (!proxyList) {
                            proxyList = [];
                        }
                        resolve(proxyList)
                    }
                })
        })
    },

    /* 过滤出有效的ip, 排除无效的ip */
    filterValidIps(testIps) {
        let ipsPromise = testIps ? Promise.resolve([].concat(testIps)) : this.getProxyIps();
        
        return ipsPromise
            .then(ips => {

                // let url = 'http://ip.chinaz.com';
                let url = 'http://m.lagou.com/jobs/3776097.html'
                // url = 'http://www.66ip.cn/'
                // url = 'http://m.lagou.com/'
                // url = 'http://www.runoob.com/'
                url = 'http://www.baidu.com'
                // ips = ['110.170.150.166:8080', '223.223.187.195:80']
                // ips.unshift('127.0.0.1:1080');
                
                console.log('ips', ips.length)
                let ipTestResultList = [];
                const TIMEOUT = 15000;

                for (let proxyIp of ips) {
                    proxyIp = proxyIp.indexOf('http') === 0 ? proxyIp : ('http://' + proxyIp);
                    // console.log('proxyIp', proxyIp)
                    let curIpTest = new Promise(resolve => {
                        superagent.get(url)
                            .timeout(TIMEOUT)
                            .proxy(proxyIp)
                            .end((err, res) => {
                                if (err ) {
                                    // console.error('request failed!', err);

                                    resolve()
                                    // if( res.text.indexOf('百度一下') > -1)
                                } else {
                                    console.log('当前经检测有效ip: ',  proxyIp )

                                    resolve(proxyIp)
                                }

                            });
                    })

                    ipTestResultList.push(curIpTest)
                }

                return Promise.all(ipTestResultList);

            }).then(result => {

                result = result.filter(ip => ip)
                
                this.ips.push(...result);
                this.ips = Array.from( new Set(this.ips) )
                this.isRunning = false;

                console.log('ips.length', this.ips.length, 'result', result)

                return  this.ips;
            })
    },

    removeInvalidIp(ip) {
        let index = this.ips.indexOf(ip);
        index > -1 && this.ips.splice(index, 1);
    },

    /* 从ip池中取出一个ip */
    getOneValidIp(index=0) {
        
        return (async ()=>{
            if (this.isRunning && this.ips.length !== 0) {
                return this.ips[index % this.ips.length ];
            }
            while(this.ips.length < this.MIN_IP_NUM) {
                await this.filterValidIps()
                        .catch(e => {
                            return console.log(`caught by getOneVaildIp`, e)
                        })
            }
            // if (this.ips.length < this.MIN_IP_NUM) {
            //     await this.filterValidIps()    
            // }


            let len = this.ips.length;
            console.log(`proxyIpLen`, len)
            return this.ips[index % len ];
        })()
         
    }

}

// 
// 
// 
//  ["123.207.150.111:8888", "106.14.12.240:8081", "47.75.0.253:8081", "37.29.75.241:8080", "195.190.124.202:8080", "46.218.73.162:80", "66.82.144.29:8080", "76.80.8.68:80", "91.121.162.173:80", "47.88.226.56:80", 'http://219.223.251.173:3128' , 'http://123.207.150.111:8888', 'http://195.190.124.202:8080']

/* [ 'http://112.228.159.80:8118',
  'http://61.135.217.7:80',
  'http://122.114.31.177:808',
  'http://111.155.116.210:8123' ]*/



if (require.main === module) {
    // proxy.getValidIps(["123.207.150.111:8888", "106.14.12.240:8081", "47.75.0.253:8081", "37.29.75.241:8080", "195.190.124.202:8080", "46.218.73.162:80", "66.82.144.29:8080", "76.80.8.68:80", "91.121.162.173:80", "47.88.226.56:80", 'http://219.223.251.173:3128' , 'http://123.207.150.111:8888', 'http://195.190.124.202:8080'])

    proxy.getOneValidIp()
    .then(ip => console.log(`getOneIp`, ip))

}


module.exports = proxy;



