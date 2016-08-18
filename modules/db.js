/**
 * Created by Administrator on 2016/8/18.
 */

//连接数据库
var mongoose = require('mongoose');


mongoose.connect('mongodb://localhost/lagou-spider');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // we're connected!
    console.log("connection success!")
});


//新建一个Schema  / 数据库原型
var companySchema = mongoose.Schema({
    positionId: Number,
    city: String,
    companySize: String,
    financeStage: String,
    salary : Number,
    workYear: Number,
    employmentKeyword: Array
});

//一个集合
var Company = mongoose.model('Company', companySchema);


module.exports = Company;

