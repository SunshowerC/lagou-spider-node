/**
 * Created by ChenWeiYu
 * Date : 2016/8/28
 * Time : 15:16
 */


//连接数据库

var mongoose = require('mongoose');
var settings = require('../settings');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://192.168.18.129/lagou');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // we're connected!
    console.log("connection success!")

});


//新建一个Schema  / 数据库原型
var companySchema = mongoose.Schema({
    companyFullName:String,  // 公司全称
    positionId: Number,   // 岗位id
    field: String,   // 公司领域
    city: String,   // 工作城市
    companySize: String, // 公司规模
    // financeStage: String,  // 融资阶段
    salary : Number,   // 薪酬水平
    workYear: String,  // 岗位要求年限
    qualification: String, // 岗位要求学历
    // employmentKeyword: Array
});

//一个集合
//  var Company = {};

var Company = mongoose.model(settings.modelName, companySchema); //其中字符串为数据库集合名-前端开发

module.exports = Company;
