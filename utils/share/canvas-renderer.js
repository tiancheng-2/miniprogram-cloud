// utils/share/canvas-renderer.js - Canvas渲染引擎

const textHelper = require('./text-helper');

class CanvasRenderer {
  constructor(ctx, width, height) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  /**
   * 绘制圆角矩形
   */
  drawRoundRect(x, y, width, height, radius, fillStyle) {
    this.ctx.beginPath();
    this.ctx.arc(x + radius, y + radius, radius, Math.PI, Math.PI * 1.5);
    this.ctx.arc(x + width - radius, y + radius, radius, Math.PI * 1.5, Math.PI * 2);
    this.ctx.arc(x + width - radius, y + height - radius, radius, 0, Math.PI * 0.5);
    this.ctx.arc(x + radius, y + height - radius, radius, Math.PI * 0.5, Math.PI);
    this.ctx.closePath();
    this.ctx.setFillStyle(fillStyle);
    this.ctx.fill();
  }

  /**
   * 绘制渐变背景
   * @param {Array} colors - 颜色数组
   * @param {string} direction - 方向 'vertical' | 'horizontal' | 'diagonal'
   */
  drawGradientBg(colors, direction = 'vertical') {
    let grd;
    
    if (direction === 'vertical') {
      grd = this.ctx.createLinearGradient(0, 0, 0, this.height);
    } else if (direction === 'horizontal') {
      grd = this.ctx.createLinearGradient(0, 0, this.width, 0);
    } else if (direction === 'diagonal') {
      // 对角线渐变（左上到右下）
      grd = this.ctx.createLinearGradient(0, 0, this.width, this.height);
    }
    
    colors.forEach((color, index) => {
      grd.addColorStop(index / (colors.length - 1), color);
    });
    
    this.ctx.setFillStyle(grd);
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * 绘制单行文字
   */
  drawText(text, x, y, style = {}) {
    const { 
      fontSize = 14, 
      color = '#000', 
      align = 'left',
      bold = false,
      baseline = 'top'
    } = style;
    
    this.ctx.setFontSize(fontSize);
    this.ctx.setFillStyle(color);
    this.ctx.setTextAlign(align);
    this.ctx.setTextBaseline(baseline);
    
    if (bold) {
      // 微信小程序不支持 font-weight，用描边模拟加粗
      this.ctx.setLineWidth(0.5);
      this.ctx.setStrokeStyle(color);
      this.ctx.strokeText(text, x, y);
    }
    
    this.ctx.fillText(text, x, y);
  }

  /**
   * 绘制多行文字（自动换行）
   */
  drawMultilineText(text, x, y, maxWidth, lineHeight, maxLines, style = {}) {
    const { 
      fontSize = 14, 
      color = '#000', 
      align = 'left',
      bold = false
    } = style;
    
    this.ctx.setFontSize(fontSize);
    this.ctx.setFillStyle(color);
    this.ctx.setTextAlign('left');
    this.ctx.setTextBaseline('top');
    
    if (bold) {
      this.ctx.setLineWidth(0.5);
      this.ctx.setStrokeStyle(color);
    }
    
    const lines = textHelper.wrapTextWithEllipsis(this.ctx, text, maxWidth, maxLines);
    
    lines.forEach((line, index) => {
      let drawX = x;
      
      if (align === 'center') {
        const lineWidth = textHelper.measureText(this.ctx, line);
        drawX = x + (maxWidth - lineWidth) / 2;
      } else if (align === 'right') {
        const lineWidth = textHelper.measureText(this.ctx, line);
        drawX = x + maxWidth - lineWidth;
      }
      
      const drawY = y + index * lineHeight;
      
      if (bold) {
        this.ctx.strokeText(line, drawX, drawY);
      }
      this.ctx.fillText(line, drawX, drawY);
    });
    
    return lines.length;
  }

  /**
   * 绘制图片
   */
  async drawImage(imagePath, x, y, width, height, borderRadius = 0) {
    return new Promise((resolve, reject) => {
      if (borderRadius > 0) {
        this.ctx.save();
        
        // 绘制圆角裁剪路径
        this.ctx.beginPath();
        this.ctx.arc(x + borderRadius, y + borderRadius, borderRadius, Math.PI, Math.PI * 1.5);
        this.ctx.arc(x + width - borderRadius, y + borderRadius, borderRadius, Math.PI * 1.5, Math.PI * 2);
        this.ctx.arc(x + width - borderRadius, y + height - borderRadius, borderRadius, 0, Math.PI * 0.5);
        this.ctx.arc(x + borderRadius, y + height - borderRadius, borderRadius, Math.PI * 0.5, Math.PI);
        this.ctx.closePath();
        this.ctx.clip();
      }
      
      this.ctx.drawImage(imagePath, x, y, width, height);
      
      if (borderRadius > 0) {
        this.ctx.restore();
      }
      
      resolve();
    });
  }

  /**
   * 设置阴影
   */
  setShadow(offsetX, offsetY, blur, color) {
    this.ctx.setShadow(offsetX, offsetY, blur, color);
  }

  /**
   * 清除阴影
   */
  clearShadow() {
    this.ctx.setShadow(0, 0, 0, 'transparent');
  }

  /**
   * 保存上下文状态
   */
  save() {
    this.ctx.save();
  }

  /**
   * 恢复上下文状态
   */
  restore() {
    this.ctx.restore();
  }
}

module.exports = CanvasRenderer;
