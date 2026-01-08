// utils/share/dish-card.js - 菜品卡片生成器

const CanvasRenderer = require('./canvas-renderer');

class DishCard {
  /**
   * 生成菜品卡片
   * @param {CanvasContext} ctx - Canvas上下文
   * @param {Object} data - 卡片数据
   */
  static async generate(ctx, data) {
    const { 
      dishName, 
      rating,         // 'must-try' | 'avoid'
      note = '',
      tags = [],
      photoUrl = '',
      restaurantName,
      qrCodePath = ''
    } = data;
    
    const renderer = new CanvasRenderer(ctx, 375, 600);
    
    // 1. 绘制背景
    if (photoUrl) {
      // 有照片：照片作为背景
      await renderer.drawImage(photoUrl, 0, 0, 375, 600);
      
      // 绘制渐变遮罩
      const grd = ctx.createLinearGradient(0, 0, 0, 600);
      grd.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      grd.addColorStop(0.5, 'rgba(0, 0, 0, 0.5)');
      grd.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
      ctx.setFillStyle(grd);
      ctx.fillRect(0, 0, 375, 600);
    } else {
      // 无照片：渐变背景 + 首字装饰
      const bgColors = rating === 'must-try' 
        ? ['#667eea', '#764ba2']
        : ['#e5e5e5', '#999999'];
      renderer.drawGradientBg(bgColors, 'diagonal');
      
      // 绘制首字装饰
      const firstChar = dishName.charAt(0);
      renderer.drawText(firstChar, 187.5, 300, {
        fontSize: 180,
        color: 'rgba(255, 255, 255, 0.2)',
        align: 'center',
        baseline: 'middle',
        bold: true
      });
    }
    
    // 2. 绘制属性标签
    const badgeText = rating === 'must-try' ? '👑 必点推荐' : '⚠️ 避坑提醒';
    const badgeColor = rating === 'must-try' ? '#fff' : '#333';
    
    // 标签背景渐变
    const badgeGrd = rating === 'must-try'
      ? ctx.createLinearGradient(30, 40, 150, 76)
      : ctx.createLinearGradient(30, 40, 150, 76);
    
    if (rating === 'must-try') {
      badgeGrd.addColorStop(0, '#f6d365');
      badgeGrd.addColorStop(1, '#fda085');
    } else {
      badgeGrd.addColorStop(0, '#e5e5e5');
      badgeGrd.addColorStop(1, '#d4d4d4');
    }
    
    renderer.setShadow(0, 4, 12, 'rgba(0, 0, 0, 0.2)');
    ctx.setFillStyle(badgeGrd);
    ctx.beginPath();
    ctx.arc(30 + 18, 40 + 18, 18, Math.PI, Math.PI * 1.5);
    ctx.arc(150 - 18, 40 + 18, 18, Math.PI * 1.5, Math.PI * 2);
    ctx.arc(150 - 18, 76 - 18, 18, 0, Math.PI * 0.5);
    ctx.arc(30 + 18, 76 - 18, 18, Math.PI * 0.5, Math.PI);
    ctx.closePath();
    ctx.fill();
    renderer.clearShadow();
    
    renderer.drawText(badgeText, 90, 58, {
      fontSize: 14,
      color: badgeColor,
      align: 'center',
      baseline: 'middle',
      bold: true
    });
    
    // 3. 设置文字阴影（增强可读性）
    renderer.setShadow(0, 2, 10, 'rgba(0, 0, 0, 0.3)');
    
    // 4. 绘制菜品名称（最多2行）
    const nameLines = renderer.drawMultilineText(
      dishName,
      30,
      240,
      315,
      52,
      2,
      {
        fontSize: 42,
        color: '#fff',
        align: 'center',
        bold: true
      }
    );
    
    let currentY = 240 + nameLines * 52 + 16;
    
    // 5. 绘制餐厅名称
    renderer.drawText(`@ ${restaurantName}`, 187.5, currentY, {
      fontSize: 16,
      color: 'rgba(255, 255, 255, 0.9)',
      align: 'center',
      baseline: 'top'
    });
    
    currentY += 32;
    
    renderer.clearShadow();
    
    // 6. 绘制笔记卡片（如有）
    if (note) {
      const noteCardY = currentY;
      const noteCardHeight = 100;
      
      // 半透明背景
      ctx.setFillStyle('rgba(255, 255, 255, 0.15)');
      ctx.beginPath();
      ctx.arc(40 + 12, noteCardY + 12, 12, Math.PI, Math.PI * 1.5);
      ctx.arc(335 - 12, noteCardY + 12, 12, Math.PI * 1.5, Math.PI * 2);
      ctx.arc(335 - 12, noteCardY + noteCardHeight - 12, 12, 0, Math.PI * 0.5);
      ctx.arc(40 + 12, noteCardY + noteCardHeight - 12, 12, Math.PI * 0.5, Math.PI);
      ctx.closePath();
      ctx.fill();
      
      // 绘制笔记内容（最多3行）
      renderer.setShadow(0, 1, 6, 'rgba(0, 0, 0, 0.2)');
      const noteLines = renderer.drawMultilineText(
        `"${note}"`,
        60,
        noteCardY + 20,
        255,
        26,
        3,
        {
          fontSize: 15,
          color: '#fff',
          align: 'center'
        }
      );
      renderer.clearShadow();
      
      currentY += noteCardHeight + 20;
    }
    
    // 7. 绘制标签（如有）
    if (tags.length > 0) {
      let tagX = 40;
      const tagY = currentY;
      
      renderer.setShadow(0, 2, 8, 'rgba(0, 0, 0, 0.2)');
      
      tags.slice(0, 5).forEach(tag => {
        const tagText = `🏷️ ${tag}`;
        const tagWidth = tagText.length * 13 + 20;
        
        // 检查是否需要换行
        if (tagX + tagWidth > 335) {
          tagX = 40;
          currentY += 38;
        }
        
        ctx.setFillStyle('rgba(255, 255, 255, 0.2)');
        ctx.beginPath();
        ctx.arc(tagX + 15, currentY + 15, 15, Math.PI, Math.PI * 1.5);
        ctx.arc(tagX + tagWidth - 15, currentY + 15, 15, Math.PI * 1.5, Math.PI * 2);
        ctx.arc(tagX + tagWidth - 15, currentY + 30 - 15, 15, 0, Math.PI * 0.5);
        ctx.arc(tagX + 15, currentY + 30 - 15, 15, Math.PI * 0.5, Math.PI);
        ctx.closePath();
        ctx.fill();
        
        renderer.drawText(tagText, tagX + 10, currentY + 8, {
          fontSize: 13,
          color: '#fff',
          baseline: 'top'
        });
        
        tagX += tagWidth + 10;
      });
      
      renderer.clearShadow();
    }
    
    // 8. 绘制底部区域
    const footerY = 520;
    
    // 文字阴影
    renderer.setShadow(0, 1, 6, 'rgba(0, 0, 0, 0.3)');
    
    const today = new Date().toISOString().split('T')[0];
    renderer.drawText('🌟 来自味觉空间', 40, footerY + 10, {
      fontSize: 12,
      color: 'rgba(255, 255, 255, 0.9)',
      bold: true,
      baseline: 'top'
    });
    renderer.drawText(today, 40, footerY + 30, {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.8)',
      baseline: 'top'
    });
    
    renderer.clearShadow();
    
    // 9. 绘制小程序码
    if (qrCodePath) {
      renderer.setShadow(0, 2, 8, 'rgba(0, 0, 0, 0.3)');
      await renderer.drawImage(qrCodePath, 285, footerY, 60, 60, 8);
      renderer.clearShadow();
    } else {
      // 占位符
      renderer.setShadow(0, 2, 8, 'rgba(0, 0, 0, 0.2)');
      renderer.drawRoundRect(285, footerY, 60, 60, 8, 'rgba(255, 255, 255, 0.95)');
      renderer.clearShadow();
      renderer.drawText('小程序码', 315, footerY + 30, {
        fontSize: 10,
        color: '#666',
        align: 'center',
        baseline: 'middle'
      });
    }
  }
}

module.exports = DishCard;
