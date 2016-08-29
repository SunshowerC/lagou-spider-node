/**
 * Created by ChenWeiYu
 * Date : 2016/8/28
 * Time : 15:16
 */


//连接数据库

var mongoose = require('mongoose');
var settings = require('../settings');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/lagou-spider');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // we're connected!
    console.log("connection success!")

});


//新建一个Schema  / 数据库原型
var companySchema = mongoose.Schema({
    companyFullName:String,
    positionId: Number,
    city: String,
    companySize: String,
    financeStage: String,
    salary : Number,
    workYear: String,
    employmentKeyword: Array
});

//一个集合
//  var Company = {};

var Company = mongoose.model(settings.modelName, companySchema); //其中字符串为数据库集合名-前端开发

module.exports = Company;
