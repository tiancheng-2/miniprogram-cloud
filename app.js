// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
<<<<<<< HEAD
        // TODO: 请替换为您的云开发环境ID
        env: 'cloud1-7gvrjj1p6b9df8ee',
=======
        env: 'cloud1-7gv阿达阿达是的1水电费水电费水电费fe',
>>>>>>> d55432a5c2bdeda1ce3fd51ee14be57d4ec85d42
        traceUser: true,
      });
    }

    console.log('味觉空间启动 - 云开发模式');
  },

  globalData: {
    shareType: '',
    shareData: null,
    // 缓存配置
    cache: {
      restaurants: null,
      statistics: null,
      cacheTime: null,
      expireTime: 5 * 60 * 1000 // 5分钟缓存过期
    }
  },

  /**
   * 检查缓存是否有效
   */
  isCacheValid() {
    const { cacheTime, expireTime } = this.globalData.cache;
    if (!cacheTime) return false;
    return (Date.now() - cacheTime) < expireTime;
  },

  /**
   * 设置缓存
   */
  setCache(key, data) {
    this.globalData.cache[key] = data;
    this.globalData.cache.cacheTime = Date.now();
  },

  /**
   * 清除缓存
   */
  clearCache() {
    this.globalData.cache = {
      restaurants: null,
      statistics: null,
      cacheTime: null,
      expireTime: 5 * 60 * 1000
    };
  }
});
