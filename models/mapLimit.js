/**
 * @params list {Array} - 要迭代的数组
 * @params limit {Number} - 并发数量控制数
 * @params asyncHandle {Function} - 对`list`的每一个项的处理函数，参数为当前处理项，必须 return 一个Promise来确定是否继续进行迭代
 * @return {Promise} - 返回一个 Promise 值来确认所有数据是否迭代完成
 */

const mapLimit = (list, limit, asyncHandle) => {
    let listCopy = [].concat(list);
    let asyncList = [];
    let recursion = (arr) => {
        return asyncHandle(arr.shift(), arr)
            .then(()=>{
                if (arr.length!==0) return recursion(arr)
                else return 'finish';
            })
    };
    
    
    while(limit--) {
        asyncList.push( recursion(listCopy) );
    }
    return Promise.all(asyncList);
}

module.exports = mapLimit;