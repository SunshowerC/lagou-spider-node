/**
 * Created by Administrator on 2016/8/23.
 */


var CompanyModule = require('./db'), //数据库集合
    eventproxy = require('eventproxy');

var ep = eventproxy();
var city = ['北京', '上海', '广州', '深圳', '杭州'];
var salaryLevel = [
    [0, 6000],
    [6000, 10000],
    [10000, 20000],
    [20000, 100000]
];

function getCityEmploymentNum(callback) {
    var cityEmploymentNum = {};

    db.employeeinfo1.aggregate([{$group: {_id: "$city", aveSalary: {$sum: 1}}}], function (err, result) {
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
                .where('city', cityItem)
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

            callback(cityEmploymentSalary);
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
                    $match: {city: cityItem}
                },
                {
                    $group: {
                        _id: "$workYear",
                        sum: {$sum: 1},
                        avgSalary: {$avg: "$salary"}
                    }
                }
            ],function (err, result) {
                console.log(result);
                workYearSalary[cityItem] = result;
                ep.emit("getWorkYearSalary");
            });
    })
    
    
    ep.after('getWorkYearSalary',city.length,function () {
        callback(workYearSalary);
    })
    
}



function getCompanySizeSalary(callback) {
    var companySizeSalary = {};
    city.forEach(function (cityItem) {

        CompanyModule
            .aggregate([
                {
                    $match: {city: cityItem}
                },
                {
                    $group: {
                        _id: "$companySize",
                        sum: {$sum: 1},
                        avgSalary: {$avg: "$salary"}
                    }
                }
            ],function (err, result) {
                console.log(result);
                companySizeSalary[cityItem] = result;
                ep.emit("getCompanySizeSalary");
            });
    })


    ep.after('getCompanySizeSalary',city.length,function () {
        callback(companySizeSalary);
    })

}


        
        
module.exports = {
    getCityEmploymentNum : getCityEmploymentNum,
    getCityEmploymentSalary : getCityEmploymentSalary,
    getWorkYearSalary : getWorkYearSalary,
    getCompanySizeSalary: getCompanySizeSalary
};
 















