// utils/debounce.js - 防抖工具

/**
 * 防抖函数
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait = 500) {
  let timer = null;
  
  return function(...args) {
    if (timer) clearTimeout(timer);
    
    timer = setTimeout(() => {
      func.apply(this, args);
      timer = null;
    }, wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 需要节流的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, wait = 500) {
  let timer = null;
  let lastTime = 0;
  
  return function(...args) {
    const now = Date.now();
    
    if (now - lastTime >= wait) {
      func.apply(this, args);
      lastTime = now;
    } else {
      if (timer) clearTimeout(timer);
      
      timer = setTimeout(() => {
        func.apply(this, args);
        lastTime = Date.now();
        timer = null;
      }, wait - (now - lastTime));
    }
  };
}

module.exports = {
  debounce,
  throttle
};
