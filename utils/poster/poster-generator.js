// utils/poster/poster-generator.js - 海报生成器
class PosterGenerator {
  /**
   * 生成海报
   * @param {Object} data - 数据
   * @param {string} data.restaurantName - 餐厅名称
   * @param {Array} data.mustTryDishes - 必点菜品（最多6道）
   * @param {Array} data.avoidDishes - 避坑菜品（最多4道）
   * @param {number} data.styleId - 风格ID (1-6)
   */
  static async generate(data) {
    const { restaurantName, mustTryDishes = [], avoidDishes = [], styleId = 1 } = data;
    
    return new Promise((resolve, reject) => {
      try {
        // 创建Canvas上下文
        const ctx = wx.createCanvasContext('posterCanvas');
        
        // 加载模板背景图
        const bgPath = `/images/poster-templates/style${styleId}.png`;
        
        // 绘制背景
        ctx.drawImage(bgPath, 0, 0, 750, 1200);
        
        // 绘制餐厅名称
        ctx.setFontSize(54);
        ctx.setFillStyle(this.getHeaderColor(styleId));
        ctx.setTextAlign('center');
        ctx.fillText(this.truncateText(ctx, restaurantName, 500), 375, 185);
        
        // 绘制必点菜品
        ctx.setFontSize(32);
        ctx.setFillStyle('#333');
        ctx.setTextAlign('left');
        
        // 左列（前3道）
        mustTryDishes.slice(0, 3).forEach((dish, i) => {
          const text = this.truncateText(ctx, dish.dishName, 250);
          ctx.fillText(`•  ${text}`, 120, 420 + i * 85);
        });
        
        // 右列（后3道）
        mustTryDishes.slice(3, 6).forEach((dish, i) => {
          const text = this.truncateText(ctx, dish.dishName, 250);
          ctx.fillText(`•  ${text}`, 410, 420 + i * 85);
        });
        
        // 绘制避坑菜品
        ctx.setFillStyle('#666');
        
        // 左列（前2道）
        avoidDishes.slice(0, 2).forEach((dish, i) => {
          const text = this.truncateText(ctx, dish.dishName, 250);
          ctx.fillText(`•  ${text}`, 120, 920 + i * 75);
        });
        
        // 右列（后2道）
        avoidDishes.slice(2, 4).forEach((dish, i) => {
          const text = this.truncateText(ctx, dish.dishName, 250);
          ctx.fillText(`•  ${text}`, 410, 920 + i * 75);
        });
        
        // 绘制完成，导出图片
        ctx.draw(false, () => {
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvasId: 'posterCanvas',
              destWidth: 750,
              destHeight: 1200,
              success: (res) => resolve(res.tempFilePath),
              fail: reject
            });
          }, 500); // 等待绘制完成
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // 获取不同风格的标题颜色
  static getHeaderColor(styleId) {
    const colors = {
      1: '#667eea',  // 活力紫
      2: '#ff6b6b',  // 温暖橙
      3: '#4facfe',  // 清新绿
      4: '#ff6b6b',  // 热情红
      5: '#4facfe',  // 典雅蓝
      6: '#34495e'   // 简约灰
    };
    return colors[styleId] || '#667eea';
  }
  
  // 文字截断（防止超出）
  static truncateText(ctx, text, maxWidth) {
    const metrics = ctx.measureText(text);
    if (metrics.width <= maxWidth) {
      return text;
    }
    
    // 逐字截断
    let truncated = text;
    while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  }
}

module.exports = PosterGenerator;
