// utils/share/share-manager.js - 简化版分享管理器（无小程序码）

class ShareManager {
  /**
   * 统一分享入口 - 直接生成卡片，无需等待
   * @param {string} type - 'restaurant' | 'dish'
   * @param {object} data - 卡片数据
   */
  static async share(type, data) {
    try {
      // 显示提示
      wx.showToast({
        title: '请点击右上角分享',
        icon: 'none',
        duration: 2000
      });
      
      // 将分享数据保存到全局
      const app = getApp();
      app.globalData.shareType = type;
      app.globalData.shareData = data;
      
    } catch (error) {
      console.error('准备分享失败', error);
      wx.showToast({
        title: '分享失败，请重试',
        icon: 'none'
      });
    }
  }
  
  /**
   * 生成分享标题
   */
  static generateShareTitle(type, data) {
    if (type === 'restaurant') {
      const { restaurantName, totalDishCount } = data;
      return `推荐${restaurantName}（已记录${totalDishCount}道美食）`;
    } else if (type === 'dish') {
      const { dishName, restaurantName, rating } = data;
      const ratingText = rating === 'must-try' ? '必点' : '避坑';
      return `推荐${restaurantName}的${dishName}（${ratingText}）`;
    }
    return '来自味觉空间的推荐';
  }
  
  /**
   * 生成分享图片URL（使用默认图或占位图）
   */
  static generateShareImage(type, data) {
    // 如果有菜品照片，优先使用
    if (type === 'dish' && data.photoUrl) {
      return data.photoUrl;
    }
    
    // 否则返回null，使用小程序默认截图
    return null;
  }
}

module.exports = ShareManager;
