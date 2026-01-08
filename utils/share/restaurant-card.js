// utils/share/restaurant-card.js - 餐厅卡片生成器

const CanvasRenderer = require('./canvas-renderer');

class RestaurantCard {
  /**
   * 生成餐厅卡片
   * @param {CanvasContext} ctx - Canvas上下文
   * @param {Object} data - 卡片数据
   */
  static async generate(ctx, data) {
    const { 
      restaurantName, 
      address = '', 
      tags = [], 
      dishes = [],
      totalDishCount = 0,
      qrCodePath = ''
    } = data;
    
    const renderer = new CanvasRenderer(ctx, 375, 600);
    
    // 1. 绘制背景渐变
    renderer.drawGradientBg(['#f5f7fa', '#c3cfe2'], 'diagonal');
    
    // 2. 绘制顶部logo
    renderer.drawText('🌟 味觉空间推荐', 187.5, 30, {
      fontSize: 14,
      color: '#666',
      align: 'center',
      baseline: 'top'
    });
    
    // 3. 绘制白色玻璃卡片（模拟）
    renderer.setShadow(0, 4, 16, 'rgba(0, 0, 0, 0.1)');
    renderer.drawRoundRect(30, 80, 315, 420, 16, 'rgba(255, 255, 255, 0.95)');
    renderer.clearShadow();
    
    // 4. 绘制餐厅名称（最多2行）
    const nameLines = renderer.drawMultilineText(
      restaurantName, 
      50, 
      110, 
      275, 
      32, 
      2, 
      {
        fontSize: 28,
        color: '#1a1a1a',
        bold: true
      }
    );
    
    let currentY = 110 + nameLines * 32 + 12;
    
    // 5. 绘制地址（最多2行）
    if (address) {
      const addressLines = renderer.drawMultilineText(
        address,
        50,
        currentY,
        275,
        24,
        2,
        {
          fontSize: 14,
          color: '#666'
        }
      );
      currentY += addressLines * 24 + 16;
    }
    
    // 6. 绘制标签
    if (tags.length > 0) {
      let tagX = 50;
      const tagY = currentY;
      
      tags.slice(0, 5).forEach(tag => {
        const tagWidth = tag.length * 12 + 20;
        
        // 检查是否需要换行
        if (tagX + tagWidth > 325) {
          tagX = 50;
          currentY += 34;
        }
        
        renderer.drawRoundRect(tagX, currentY, tagWidth, 26, 13, 'rgba(0, 0, 0, 0.04)');
        renderer.drawText(tag, tagX + 10, currentY + 6, {
          fontSize: 12,
          color: '#666',
          baseline: 'top'
        });
        
        tagX += tagWidth + 8;
      });
      
      currentY += 34;
    }
    
    // 7. 绘制分割线
    const lineY = currentY + 16;
    const grd = ctx.createLinearGradient(50, lineY, 325, lineY);
    grd.addColorStop(0, 'transparent');
    grd.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
    grd.addColorStop(1, 'transparent');
    ctx.setFillStyle(grd);
    ctx.fillRect(50, lineY, 275, 1);
    
    currentY = lineY + 24;
    
    // 8. 绘制"必点推荐"标题
    renderer.drawText('✨ 必点推荐', 50, currentY, {
      fontSize: 16,
      color: '#1a1a1a',
      bold: true,
      baseline: 'top'
    });
    
    currentY += 32;
    
    // 9. 绘制菜品列表（前3道必点）
    const mustTryDishes = dishes.filter(d => d.rating === 'must-try').slice(0, 3);
    
    if (mustTryDishes.length > 0) {
      mustTryDishes.forEach(dish => {
        renderer.drawText(`• ${dish.dishName}`, 50, currentY, {
          fontSize: 14,
          color: '#333',
          baseline: 'top'
        });
        currentY += 28;
      });
    } else {
      renderer.drawText('暂无必点菜品', 50, currentY, {
        fontSize: 14,
        color: '#999',
        baseline: 'top'
      });
      currentY += 28;
    }
    
    // 10. 绘制统计文字
    currentY = 460;
    renderer.drawText(`已记录 ${totalDishCount} 道美食`, 187.5, currentY, {
      fontSize: 13,
      color: '#999',
      align: 'center',
      baseline: 'top'
    });
    
    // 11. 绘制底部区域
    renderer.setShadow(0, 2, 8, 'rgba(0, 0, 0, 0.04)');
    renderer.drawRoundRect(30, 520, 315, 60, 12, 'rgba(255, 255, 255, 0.9)');
    renderer.clearShadow();
    
    // 12. 绘制小程序码
    if (qrCodePath) {
      await renderer.drawImage(qrCodePath, 45, 530, 60, 60, 8);
    } else {
      // 占位符
      renderer.drawRoundRect(45, 530, 60, 60, 8, '#E0E0E0');
      renderer.drawText('小程序码', 75, 560, {
        fontSize: 10,
        color: '#999',
        align: 'center',
        baseline: 'middle'
      });
    }
    
    // 13. 绘制底部文字
    const today = new Date().toISOString().split('T')[0];
    renderer.drawText('来自味觉空间', 305, 538, {
      fontSize: 12,
      color: '#333',
      align: 'right',
      bold: true,
      baseline: 'top'
    });
    renderer.drawText(today, 305, 558, {
      fontSize: 11,
      color: '#666',
      align: 'right',
      baseline: 'top'
    });
  }
}

module.exports = RestaurantCard;
