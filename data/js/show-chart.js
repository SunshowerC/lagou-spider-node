

console.log(`岗位样本总数`, originData.length)
document.querySelector('#count').innerHTML = originData.length;

let data = {
    cityEmploymentNum: [],
    cityEmploymentSalary: [[],[],[],[],[]],
    /* 所在领域 */
    fieldList: originData.reduce((prev, cur) => {
            let tag = cur.field.split(/\s*[,，、、；;\s]\s*/)
            tag.forEach(item => prev.add(item))
            return prev;
        }, new Set()),

};

(function(){
    let mapData = {}; // {城市: [{...}, ...], }
    data.mapData = mapData;

    originData.forEach(item => {
        mapData[item.city] || (mapData[item.city] = [])
        mapData[item.city].push(item);
    })

    /* 城市-招聘数关系: data.cityEmploymentNum = [{name:城市, value: 招聘数}, ... ] */
    data.cityEmploymentNum = Object.entries(mapData).map(item => {
        return {
            name : item[0],
            value: item[1].length,
        }
    })

    /* 城市 */
    data.city = Object.keys(mapData);




    /* 城市-招聘数-工资水平 */
    /* 
    data.cityEmploymentSalary = [
        [北,上,广,深,杭], // 北上广深航中对应的6K以下招聘数
        [北,上,广,深,杭], // 北上广深航中对应的6K-10K招聘数
        [北,上,广,深,杭], // 北上广深航中对应的10K-20K招聘数
        [北,上,广,深,杭], // 北上广深航中对应的20K 以上招聘数
        [北,上,广,深,杭], // 北上广深航中对应的平均工资
     ]
     */
    Object.values(mapData).forEach( (item, index) => {
        data.cityEmploymentSalary[0][index] = item.filter(job => job.salary < 6000).length;
        data.cityEmploymentSalary[1][index] = item.filter(job => job.salary >= 6000 && job.salary < 10000).length;
        data.cityEmploymentSalary[2][index] = item.filter(job => job.salary >= 10000 && job.salary < 20000).length;
        data.cityEmploymentSalary[3][index] = item.filter(job => job.salary >= 20000).length;
        data.cityEmploymentSalary[4][index] = 0|item.reduce((prev, cur)=> prev + cur.salary, 0) / item.length;
    })

})();



(function () {

    var chartModule = {



        init: function () {
            var This = this;
            
            This.renderPie('cityEmployment', data.cityEmploymentNum);
            This.renderCitySalary('cityEmploymentSalary',data.cityEmploymentSalary);
            This.renderCompanySize('companySizeSalary',data.mapData);
            This.renderWorkYearSalary('workYearSalary',data.mapData);
            This.renderField('fieldSalary');
             
            sessionStorage.setItem("data",JSON.stringify(data) );


            

            this.bindEvent();
        },

 



        renderPie: function (id, cityEmploymentNum) {
            var pieData = cityEmploymentNum;
             



            //配置
            var cityEmploymentNumOption = {
                title: {
                    text: '城市-前端招聘数',

                    x: 'center'
                },
                tooltip: {
                    trigger: 'item',
                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                legend: {
                    orient: 'vertical',
                    x: 'left',
                    data: data.city
                },
                toolbox: {
                    show: true,
                    feature: {
                        mark: {show: true},
                        dataView: {show: true, readOnly: false},
                        magicType: {
                            show: true,
                            type: ['pie', 'funnel'],
                            option: {
                                funnel: {
                                    x: '25%',
                                    width: '50%',
                                    funnelAlign: 'left',
                                    max: 1548
                                }
                            }
                        },
                        restore: {show: true},
                        saveAsImage: {show: true}
                    }
                },
                calculable: true,
                series: [
                    {
                        name: '前端招聘数',
                        type: 'pie',
                        radius: '55%',
                        center: ['50%', '50%'],
                        data: pieData
                    }
                ]
            };

            //初始化dom元素为 echarts容器
            var myChart = echarts.init(document.getElementById(id));
            //加载数据
            myChart.setOption(cityEmploymentNumOption);
        },

        renderCitySalary : function (id, cityEmploymentSalary) {

            // var cityEmploymentSalary = data.cityEmploymentSalary;

            var renderData = cityEmploymentSalary,
                city = data.city;


            var option = {
                title: {
                    text: '城市-招聘数-工资水平',

                    x: 'left'
                },
                tooltip : {
                    trigger: 'axis'
                },
                toolbox: {
                    show : true,
                    feature : {
                        mark : {show: true},
                        dataView : {show: true, readOnly: false},
                        magicType: {show: true, type: ['line', 'bar']},
                        restore : {show: true},
                        saveAsImage : {show: true}
                    }
                },
                calculable : true,
                legend: {

                    data:['6k以下','6k-10k','10k-20k','20k以上','平均工资']
                },
                xAxis : [
                    {
                        type : 'category',
                        data : city
                    }
                ],
                yAxis : [
                    {
                        type : 'value',
                        name : '工资段对应招聘数量',
                        axisLabel : {
                            formatter: '{value} 个'
                        }
                    },
                    {
                        type : 'value',
                        name : '城市平均工资',
                        axisLabel : {
                            formatter: '{value} 元'
                        }
                    }
                ],
                series : [

                    {
                        name:'6k以下',
                        type:'bar',
                        data:renderData[0]
                    },
                    {
                        name:'6k-10k',
                        type:'bar',
                        data:renderData[1]
                    },
                    {
                        name:'10k-20k',
                        type:'bar',
                        data:renderData[2]
                    },
                    {
                        name:'20k以上',
                        type:'bar',
                        data:renderData[3]
                    },
                    {
                        name:'平均工资',
                        type:'line',
                        yAxisIndex: 1,
                        data:renderData[4]
                    }
                ]
            };

            var myChart = echarts.init(document.getElementById(id));
            myChart.setOption(option);
        },

        renderCompanySize : function (id, companySizeSalary,city) {

            city = city || '深圳';

            var x = ['少于15人','15-50人','50-150人','150-500人','500-2000人','2000人以上'];
            var cityData = city === '全国' ? Object.values(companySizeSalary).reduce((prev, cur) => prev.concat(cur), []) : companySizeSalary[city];

            let renderData = {
                employmentNum: [],
                aveSalary: []
            };

            x.forEach((item,index) => {
                let matchCompanySizeJobs = cityData.filter(job => job.companySize === item)
                renderData.employmentNum[index] = matchCompanySizeJobs.length;
                renderData.aveSalary[index] = 0 | matchCompanySizeJobs.reduce((prev,cur)=> prev + cur.salary, 0) / matchCompanySizeJobs.length;

            })
            
            var option = {
                title: {
                    text: city + '公司规模-招聘数-平均工资',

                    x: 'left'
                },
                tooltip : {
                    trigger: 'axis'
                },
                toolbox: {
                    show : true,
                    feature : {
                        mark : {show: true},
                        dataView : {show: true, readOnly: false},
                        magicType: {show: true, type: ['line', 'bar']},
                        restore : {show: true},
                        saveAsImage : {show: true}
                    }
                },
                calculable : true,
                legend: {

                    data:['招聘数量', '平均工资']
                },
                xAxis : [
                    {
                        type : 'category',
                        // data: Object.keys(cityEmploymentSalary)
                        data : x
                    }
                ],
                yAxis : [
                    {
                        type : 'value',
                        name : '公司规模对应招聘数',
                        axisLabel : {
                            formatter: '{value} 个'
                        }
                    },
                    {
                        type : 'value',
                        name : '平均工资',
                        axisLabel : {
                            formatter: '{value} 元'
                        }
                    }
                ],
                series : [
                    {
                        name:'招聘数量',
                        type:'bar',
                        data: renderData.employmentNum
                    },
                    {
                        name:'平均工资',
                        type:'line',
                        yAxisIndex: 1,
                        data: renderData.aveSalary
                    }
                ]
            };

            var container = document.getElementById(id);
            var myChart = echarts.init(container);
            myChart.setOption(option);
        },


        /* 所在领域-招聘数-平均工资 */
        renderField : function (id) {
            data.fieldList.delete('');
            var x = Array.from(data.fieldList);
 

            let renderData = {
                employmentNum: [],
                aveSalary: []
            };

            x.forEach((item,index) => {
                let matchFieldJobs = originData.filter(job => job.field.indexOf(item) > -1)
                renderData.employmentNum[index] = matchFieldJobs.length;
                renderData.aveSalary[index] = 0 | matchFieldJobs.reduce((prev,cur)=> prev + cur.salary, 0) / matchFieldJobs.length;

            })
            
            var option = {
                title: {
                    text: '公司领域-招聘数-平均工资',

                    x: 'left'
                },
                tooltip : {
                    trigger: 'axis'
                },
                toolbox: {
                    show : true,
                    feature : {
                        mark : {show: true},
                        dataView : {show: true, readOnly: false},
                        magicType: {show: true, type: ['line', 'bar']},
                        restore : {show: true},
                        saveAsImage : {show: true}
                    }
                },
                calculable : true,
                legend: {

                    data:['招聘数量', '平均工资']
                },
                xAxis : [
                    {
                        type : 'category',
                        // data: Object.keys(cityEmploymentSalary)
                        data : x
                    }
                ],
                yAxis : [
                    {
                        type : 'value',
                        name : '公司规模对应招聘数',
                        axisLabel : {
                            formatter: '{value} 个'
                        }
                    },
                    {
                        type : 'value',
                        name : '平均工资',
                        axisLabel : {
                            formatter: '{value} 元'
                        }
                    }
                ],
                series : [
                    {
                        name:'招聘数量',
                        type:'bar',
                        data: renderData.employmentNum
                    },
                    {
                        name:'平均工资',
                        type:'line',
                        yAxisIndex: 1,
                        data: renderData.aveSalary
                    }
                ]
            };

            var container = document.getElementById(id);
            var myChart = echarts.init(container);
            myChart.setOption(option);
        },

        renderWorkYearSalary : function (id, workYearSalary,city) {
            city = city || '深圳';

            var cityData = city === '全国' ? Object.values(workYearSalary).reduce((prev, cur) => prev.concat(cur), []) : workYearSalary[city];

            let renderData = {
                employmentNum: [],
                aveSalary: []
            };
            var x = ['应届毕业生','1年以下','1-3年','3-5年','5-10年','10年以上','不限'] ;


            x.forEach((item,index) => {
                let matchWorkYearJobs = cityData.filter(job => job.workYear === item)
                renderData.employmentNum[index] = matchWorkYearJobs.length;
                renderData.aveSalary[index] = 0 | matchWorkYearJobs.reduce((prev,cur)=> prev + cur.salary, 0) / matchWorkYearJobs.length;

            })
 


            var option = {
                title: {
                    text: city + '工作资历-招聘数-平均工资',

                    x: 'left'
                },
                tooltip : {
                    trigger: 'axis'
                },
                toolbox: {
                    show : true,
                    feature : {
                        mark : {show: true},
                        dataView : {show: true, readOnly: false},
                        magicType: {show: true, type: ['line', 'bar']},
                        restore : {show: true},
                        saveAsImage : {show: true}
                    }
                },
                calculable : true,
                legend: {
                    data:['招聘数量', '平均工资']
                },
                xAxis : [
                    {
                        type : 'category',
                        // data: Object.keys(cityEmploymentSalary)
                        data : x
                    }
                ],
                yAxis : [
                    {
                        type : 'value',
                        name : '工资资历对应招聘数',
                        axisLabel : {
                            formatter: '{value} 个'
                        }
                    },
                    {
                        type : 'value',
                        name : '平均工资',
                        axisLabel : {
                            formatter: '{value} 元'
                        }
                    }
                ],
                series : [
                    {
                        name:'招聘数量',
                        type:'bar',
                        data:renderData.employmentNum
                    },
                    {
                        name:'平均工资',
                        type:'line',
                        yAxisIndex: 1,
                        data:renderData.aveSalary
                    }
                ]
            };

            var container = document.getElementById(id);

            var myChart = echarts.init(container);
            myChart.setOption(option);
        }, 
 

        bindEvent: function () {
            var This = this;

            $('#company-size-city,#workYear-salary-city').on('change',function () {

                var data = JSON.parse( sessionStorage.getItem('data') );

                if (this.id == 'company-size-city') {
                    This.renderCompanySize('companySizeSalary',data.mapData,this.value);
                } else {
                    This.renderWorkYearSalary('workYearSalary',data.mapData,this.value);
                }

            });

        }



    };

    window.chartModule = chartModule;



})();
