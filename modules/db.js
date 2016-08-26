/**
 * Created by Administrator on 2016/8/18.
 */

//连接数据库

var mongoose = require('mongoose');

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
var Company = mongoose.model('employeeInfo1', companySchema); //其中字符串为数据库集合名-前端开发
// var Company = mongoose.model('employee-product', companySchema); //其中字符串为数据库集合名-产品经理
// var Company = mongoose.model('employee-android', companySchema); //其中字符串为数据库集合名-安卓开发

module.exports = Company;

