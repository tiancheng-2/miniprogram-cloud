// utils/share/text-helper.js - 文字处理工具

/**
 * 计算文字宽度
 * @param {CanvasContext} ctx - Canvas上下文
 * @param {string} text - 文字内容
 * @returns {number} 文字宽度
 */
function measureText(ctx, text) {
  return ctx.measureText(text).width;
}

/**
 * 文字自动换行
 * @param {CanvasContext} ctx - Canvas上下文
 * @param {string} text - 文字内容
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxLines - 最大行数
 * @returns {Array<string>} 分行后的文字数组
 */
function wrapText(ctx, text, maxWidth, maxLines = 999) {
  if (!text) return [];
  
  const lines = [];
  const paragraphs = text.split('\n');
  
  for (let p = 0; p < paragraphs.length; p++) {
    let paragraph = paragraphs[p];
    let currentLine = '';
    
    for (let i = 0; i < paragraph.length; i++) {
      const char = paragraph[i];
      const testLine = currentLine + char;
      const testWidth = measureText(ctx, testLine);
      
      if (testWidth > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
        
        // 达到最大行数
        if (lines.length >= maxLines) {
          return lines;
        }
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
      
      // 达到最大行数
      if (lines.length >= maxLines) {
        return lines;
      }
    }
  }
  
  return lines;
}

/**
 * 文字自动换行（带省略号）
 * @param {CanvasContext} ctx - Canvas上下文
 * @param {string} text - 文字内容
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxLines - 最大行数
 * @returns {Array<string>} 分行后的文字数组
 */
function wrapTextWithEllipsis(ctx, text, maxWidth, maxLines) {
  const lines = wrapText(ctx, text, maxWidth, maxLines + 1);
  
  // 如果超过最大行数，最后一行加省略号
  if (lines.length > maxLines) {
    const lastLine = lines[maxLines - 1];
    let truncated = lastLine;
    
    // 逐字删除直到能放下省略号
    while (measureText(ctx, truncated + '...') > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    
    lines[maxLines - 1] = truncated + '...';
    return lines.slice(0, maxLines);
  }
  
  return lines;
}

/**
 * 绘制多行文字
 * @param {CanvasContext} ctx - Canvas上下文
 * @param {string} text - 文字内容
 * @param {number} x - X坐标
 * @param {number} y - Y坐标（第一行的基线位置）
 * @param {number} maxWidth - 最大宽度
 * @param {number} lineHeight - 行高
 * @param {number} maxLines - 最大行数
 * @param {string} align - 对齐方式 'left' | 'center' | 'right'
 * @returns {number} 实际绘制的行数
 */
function drawMultilineText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 999, align = 'left') {
  const lines = wrapTextWithEllipsis(ctx, text, maxWidth, maxLines);
  
  lines.forEach((line, index) => {
    let drawX = x;
    
    if (align === 'center') {
      const lineWidth = measureText(ctx, line);
      drawX = x + (maxWidth - lineWidth) / 2;
    } else if (align === 'right') {
      const lineWidth = measureText(ctx, line);
      drawX = x + maxWidth - lineWidth;
    }
    
    ctx.fillText(line, drawX, y + index * lineHeight);
  });
  
  return lines.length;
}

module.exports = {
  measureText,
  wrapText,
  wrapTextWithEllipsis,
  drawMultilineText
};
