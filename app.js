// app.js
const cloudDB = require('./utils/db');

App({
  onLaunch: function () {
    wx.cloud.init({
      env: 'cloud1-7gvrjj1p6b9df8ee',
      traceUser: true,
    });
    
    // ⭐ 添加这一行
    cloudDB.init('cloud1-7gvrjj1p6b9df8ee');
    
    console.log('[App] Cloud initialized');
  },
  
  globalData: {
    theme: 'cyan'
  }
});