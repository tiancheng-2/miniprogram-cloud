// utils/share/event-bus.js - 事件总线

class EventBus {
  constructor() {
    this.events = {};
  }

  /**
   * 订阅事件
   * @param {string} eventName - 事件名称
   * @param {function} callback - 回调函数
   */
  on(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
  }

  /**
   * 取消订阅
   * @param {string} eventName - 事件名称
   * @param {function} callback - 回调函数
   */
  off(eventName, callback) {
    if (!this.events[eventName]) return;
    
    this.events[eventName] = this.events[eventName].filter(
      cb => cb !== callback
    );
  }

  /**
   * 触发事件
   * @param {string} eventName - 事件名称
   * @param {any} data - 传递的数据
   */
  emit(eventName, data) {
    if (!this.events[eventName]) return;
    
    this.events[eventName].forEach(callback => {
      callback(data);
    });
  }

  /**
   * 只订阅一次
   * @param {string} eventName - 事件名称
   * @param {function} callback - 回调函数
   */
  once(eventName, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(eventName, onceCallback);
    };
    this.on(eventName, onceCallback);
  }
}

// 导出单例
const eventBus = new EventBus();
module.exports = eventBus;
