/**
 * Created by Administrator on 2016/8/24.
 */

(function () {

    var module = {
        init: function () {
            var This = this;
            this.getData(This.render)
        },
        getData: function (render) {
            $.get('/analysis',function (data) {
                var pieData =[];
                for ( var name in data) {
                    var obj = {};
                    obj.name = name;
                    obj.value = data[name];
                    pieData.push(obj);
                }
                

                render(pieData);
            })
        },

        render: renderPie
        
    };

     module.init();



function renderPie(pieData) {
    //初始化dom元素为 echarts容器
    var myChart = echarts.init(document.getElementById('cityEmployment'));
//配置
    cityEmploymentNumOption = {
        title : {
            text: '城市-前端招聘数',

            x:'center'
        },
        tooltip : {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        legend: {
            orient : 'vertical',
            x : 'left',
            data:['北京','上海','杭州','广州','深圳']
        },
        toolbox: {
            show : true,
            feature : {
                mark : {show: true},
                dataView : {show: true, readOnly: false},
                magicType : {
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
                restore : {show: true},
                saveAsImage : {show: true}
            }
        },
        calculable : true,
        series : [
            {
                name:'前端招聘数',
                type:'pie',
                radius : '55%',
                center: ['50%', '60%'],
                data:pieData
            }
        ]
    };
//加载数据
    myChart.setOption(cityEmploymentNumOption);
}




})();
