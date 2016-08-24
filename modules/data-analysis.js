/**
 * Created by Administrator on 2016/8/23.
 */


var CompanyModule = require('./db'), //数据库集合
    eventproxy = require('eventproxy');

var ep = eventproxy();
var city = ['北京', '上海', '广州', '深圳', '杭州', '全国'];
var salaryLevel = [
    [0, 6000],
    [6000, 10000],
    [10000, 20000],
    [20000, 100000]
];
//标签必须小写
var label = "性能,兼容,组件,响应式,架构,移动,手机,面向对象,数据库,博客,微信,数据结构,算法,svn,git,oop,mobile,webapp,gulp,grunt,webpack,http,canvas,svg,backbone,ember,angular,react,vue,node,bootstrap,jquery,ajax,sass,less,stylus,require,sea,photoshop,firework,php,python,mvc,mvvm,dom,json,xml,zepto,dojo,d3,underscore,seo,oracle,sql,mongodb".split(',');


function getCityEmploymentNum(callback) {
    var cityEmploymentNum = {};

    CompanyModule.aggregate([{$group: {_id: "$city", aveSalary: {$sum: 1}}}], function (err, result) {
        console.log(result);
        result.forEach(function (item) {
            cityEmploymentNum[item._id] = item.aveSalary;
        });
        callback(cityEmploymentNum);
    });

    /*city.forEach(function (item) {
     CompanyModule.where({city:item}).count(function (err, count) {
     cityEmploymentNum[item] = count;
     console.log("获取" + item + "招聘数" + cityEmploymentNum[item]);
     ep.emit('getEmploymentNum');
     });

     });

     //全部获取招聘数量后触发
     ep.after('getEmploymentNum',city.length,function () {
     callback(cityEmploymentNum)
     })*/

}

//四个层次 6k以下，6k-10k，10k-20k, 20k以上

function getCityEmploymentSalary(callback) {

    var cityEmploymentSalary = {};

    city.forEach(function (cityItem) {

        var curCity = cityEmploymentSalary[cityItem] = [];
        salaryLevel.forEach(function (salaryItem, index) {
            CompanyModule
                .where('city', cityItem == "全国" ? /.*/ : cityItem)
                .where('salary').gt(salaryItem[0]).lte(salaryItem[1])
                .count(function (err, count) {
                    curCity[index] = count;
                    ep.emit('getCityEmploymentSalary')
                })
        })
    });

    ep.after('getCityEmploymentSalary', city.length * salaryLevel.length, function () {
        CompanyModule.aggregate([
            {
                $group: {
                    _id: "$city",
                    aveSalary: {$avg: "$salary"}
                }
            }], function (err, result) {
            // console.log(result);


            //将平均工资插入cityEmploymentSalary 数组
            result.forEach(function (item) {
                cityEmploymentSalary[item._id].push(Math.round(item.aveSalary));
            });


            //将全国平均工资插入数据
            CompanyModule.aggregate([
                {
                    $group: {
                        _id: null,
                        aveSalary: {$avg: "$salary"}
                    }
                }], function (err, result) {
                cityEmploymentSalary['全国'].push(Math.round(result[0].aveSalary));
                callback(cityEmploymentSalary);
            })

        })
    })
}


//资历-对应资历的数量-平均工资
function getWorkYearSalary(callback) {
    var workYearSalary = {};
    city.forEach(function (cityItem) {

        CompanyModule
            .aggregate([
                {
                    $match: {city: cityItem == '全国' ? /.*/ : cityItem}
                },
                {
                    $group: {
                        _id: "$workYear",
                        sum: {$sum: 1},
                        aveSalary: {$avg: "$salary"}
                    }
                }
            ], function (err, result) {
                console.log(result);
                workYearSalary[cityItem] = result;
                ep.emit("getWorkYearSalary");
            });
    })


    ep.after('getWorkYearSalary', city.length, function () {
        callback(workYearSalary);
    })

}


function getCompanySizeSalary(callback) {
    var companySizeSalary = {};
    city.forEach(function (cityItem) {
        CompanyModule
            .aggregate([
                {
                    $match: {city: cityItem == '全国' ? /.*/ : cityItem}
                },
                {
                    $group: {
                        _id: "$companySize",
                        sum: {$sum: 1},
                        aveSalary: {$avg: "$salary"}
                    }
                }
            ], function (err, result) {
                console.log(result);
                companySizeSalary[cityItem] = result;
                ep.emit("getCompanySizeSalary");
            });
    });


    ep.after('getCompanySizeSalary', city.length, function () {
        callback(companySizeSalary);
    })

}

function getEmploymentLabel(callback) {
    var labelCount = {};
    label.forEach(function (item) {
        CompanyModule
            .where('employmentKeyword').in([item])
            .count(function (err, count) {
                labelCount[item] = count;
                console.log(item + " 出现频率" + count);
                ep.emit('getEmploymentLabel');
            });

    });

    ep.after('getEmploymentLabel', label.length, function () {
        callback(labelCount);
    })

}


module.exports = {
    getCityEmploymentNum: getCityEmploymentNum,  //城市-招聘职位数
    getCityEmploymentSalary: getCityEmploymentSalary, //城市-招聘数-招聘工资
    getWorkYearSalary: getWorkYearSalary,  // 工作资历-招聘数-工资
    getCompanySizeSalary: getCompanySizeSalary, //公司规模-招聘数-工资
    getEmploymentLabel: getEmploymentLabel    //招聘标签-数量-工资
};
 















