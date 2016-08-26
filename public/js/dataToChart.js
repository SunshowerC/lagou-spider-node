/**
 * Created by Administrator on 2016/8/24.
 */

(function () {

    var chartModule = {
        init: function () {
            var This = this;
            this.getAllData(function (data) {
                This.renderPie('cityEmployment', data.cityEmploymentNum);
                This.renderCitySalary('cityEmploymentSalary',data.cityEmploymentSalary);
                This.renderCompanySize('companySizeSalary',data.companySizeSalary);
                This.renderWorkYearSalary('workYearSalary',data.workYearSalary);
                This.renderEmploymentLabel('employmentLabel',data.employmentLabel);

                if (!sessionStorage.getItem("data")) {
                    sessionStorage.setItem("data",JSON.stringify(data) );
                }

            });

            this.bindEvent();
        },

        getAllData: function (callback) {
            $.get('/analysis')
                .done(callback);
        },


        renderPie: function (id, cityEmploymentNum) {
            var pieData = [];
            // var cityEmploymentNum = data.cityEmploymentNum;
            for (var name in cityEmploymentNum) {
                var obj = {};
                obj.name = name;
                obj.value = cityEmploymentNum[name];
                pieData.push(obj);
            }



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
                    data: Object.keys(cityEmploymentNum)
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
            delete  cityEmploymentSalary['全国'];

            var renderData = [[],[],[],[],[]],
                city = ['北京','上海','广州','深圳','杭州'];

            //数据格式化
            city.forEach(function (cityItem, cityIndex) {
                cityEmploymentSalary[cityItem].forEach(function (dataItem, dataIndex) {
                    renderData[dataIndex][cityIndex] = dataItem;
                })
            });

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
                        // data: Object.keys(cityEmploymentSalary)
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


            var x = ['少于15人','50-150人','150-500人','500-2000人','2000人以上'];
            var cityData = companySizeSalary[city];

            cityData.sort(function (a, b) {
                return  a._id.localeCompare(b._id);
            });


            var renderData = [[],[]];
            var sort = [5,0,3,1,4,2];
            //数据格式化
            for (var i = 0 ,len= cityData.length; i < len; i++) {
                renderData[0].push( cityData[ sort[i] ].sum );
                renderData[1].push( parseInt( cityData[ sort[i] ].aveSalary ) );
            }


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
                        data:renderData[0]
                    },
                    {
                        name:'平均工资',
                        type:'line',
                        yAxisIndex: 1,
                        data:renderData[1]
                    }
                ]
            };

            var container = document.getElementById(id);
            var myChart = echarts.init(container);
            myChart.setOption(option);
        },

        renderWorkYearSalary : function (id, workYearSalary,city) {
            city = city || '深圳';

            var x = ['应届毕业生','1年以下','1-3年','3-5年','5-10年','不限'];


            var cityData =  workYearSalary[city];
            cityData.sort(function (a, b) {
                return  a._id.localeCompare(b._id);
            });

            var renderData = [[],[]];
            var sort = [5,1,0,2,3,4];
            //数据格式化

            for (var i = 0 ,len= cityData.length; i < len; i++) {

                renderData[0].push( cityData[ sort[i] ].sum );
                renderData[1].push( parseInt( cityData[ sort[i] ].aveSalary ) );
            }


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
                        data:renderData[0]
                    },
                    {
                        name:'平均工资',
                        type:'line',
                        yAxisIndex: 1,
                        data:renderData[1]
                    }
                ]
            };

            var container = document.getElementById(id);

            var myChart = echarts.init(container);
            myChart.setOption(option);
        }, 
        
        renderEmploymentLabel :function (id, label) {


            // var label = data.employmentLabel;
            var renderData = [];

            for (var name in label) {
                var arr = [name, label[name]];
                renderData.push(arr);
            }


            renderData.sort(function (a, b) {
                return a[1] - b[1];
            });

            renderData.name = [];
            renderData.value = [];
            renderData.forEach(function (item, index) {
                renderData.name.push(item[0]);
                renderData.value.push(item[1]);
            })


            option = {
                title : {
                    text: '招聘关键词出现频率'

                },
                tooltip : {
                    trigger: 'axis'
                },
                legend: {
                    data:['出现频率']
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
                xAxis : [
                    {
                        type : 'value',
                        boundaryGap : [0, 0.01]
                    }
                ],
                yAxis : [
                    {
                        type : 'category',
                        data : renderData.name
                    }
                ],
                series : [
                    {
                        name:'出现频率',
                        type:'bar',
                        data:renderData.value
                    } 
                ]
            };

            var myChart = echarts.init(document.getElementById(id));
            myChart.setOption(option);

        },

        bindEvent: function () {
            var This = this;

            $('#company-size-city,#workYear-salary-city').on('change',function () {

                var data = JSON.parse( sessionStorage.getItem('data') );

                if (this.id == 'company-size-city') {
                    This.renderCompanySize('companySizeSalary',data.companySizeSalary,this.value);
                } else {
                    This.renderWorkYearSalary('workYearSalary',data.workYearSalary,this.value);
                }

            });

        }



    };


    chartModule.init();


})();
