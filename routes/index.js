/**
 * Created by ChenWeiYu
 * Date : 2016/8/24
 * Time : 19:59
 */


var da = require('../modules/data-analysis');
var eventproxy = require('eventproxy');

var ep = eventproxy();

module.exports = function (app) {
    
    
    
    app.get('/analysis', function (req, res) {
        res.set({'Content-Type': 'application/json;charset=utf-8'});
        
        var mergeData = {};

        da.getCityEmploymentNum(function (data) {
            mergeData.cityEmploymentNum = data;
            ep.emit("getData");

        });

        da.getCityEmploymentSalary(function (data) {
            mergeData.cityEmploymentSalary = data;
            ep.emit("getData");
        });

        da.getWorkYearSalary(function(data){
            mergeData.workYearSalary = data;
            ep.emit("getData");
        });

        da.getCompanySizeSalary(function (data) {
            mergeData.companySizeSalary = data;
            ep.emit("getData");
        });

        da.getEmploymentLabel(function (data) {
            mergeData.employmentLabel = data;
            ep.emit("getData");
        });

        ep.after('getData',5,function () {
            res.send(JSON.stringify(mergeData));
        })


});
    app.get('/', function (req, res) {
        res.send('Hello World');
    });


}