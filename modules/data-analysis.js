/**
 * Created by Administrator on 2016/8/23.
 */


var CompanyModule = require('./db'), //数据库集合
    eventproxy = require('eventproxy');

var ep = eventproxy();
var city = ['北京','上海','广州','深圳','杭州'];


function getCityEmploymentNum(callback) {
    var num = {};
 
        CompanyModule.find({city:"北京"}, function (err,result) {

            // num[item] = result.length;
            console.log(result);    
            // console.log("获取" + item + "招聘数" + num[item]);
            ep.emit('getEmploymentNum');

        });
 

    //全部获取招聘数量后触发
    ep.after('getEmploymentNum',1,function () {
        console.log('回调')
        callback(num)
    })
    
}


exports.getCityEmploymentNum = getCityEmploymentNum;
















