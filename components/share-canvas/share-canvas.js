// components/share-canvas/share-canvas.js

const eventBus = require('../../utils/share/event-bus');
const RestaurantCard = require('../../utils/share/restaurant-card');
const DishCard = require('../../utils/share/dish-card');

Component({
  data: {},

  lifetimes: {
    attached() {
      // 组件加载时，监听生成请求事件
      eventBus.on('generate-share-card', this.handleGenerateCard.bind(this));
    },

    detached() {
      // 组件卸载时，移除监听
      eventBus.off('generate-share-card', this.handleGenerateCard.bind(this));
    }
  },

  methods: {
    /**
     * 处理生成卡片请求
     */
    async handleGenerateCard(payload) {
      const { type, data } = payload;
      
      try {
        console.log('开始生成卡片:', type, data);
        
        // 获取Canvas上下文
        const ctx = wx.createCanvasContext('shareCanvas', this);
        
        // 根据类型生成卡片
        if (type === 'restaurant') {
          await RestaurantCard.generate(ctx, data);
        } else if (type === 'dish') {
          await DishCard.generate(ctx, data);
        }
        
        // 绘制到Canvas
        ctx.draw(false, () => {
          // 延迟一下，确保绘制完成
          setTimeout(() => {
            this.exportImage();
          }, 300);
        });
        
      } catch (error) {
        console.error('生成卡片失败', error);
        eventBus.emit('share-canvas-error', error);
      }
    },

    /**
     * 导出图片
     */
    exportImage() {
      wx.canvasToTempFilePath({
        canvasId: 'shareCanvas',
        quality: 1,
        fileType: 'jpg',
        success: (res) => {
          console.log('卡片生成成功:', res.tempFilePath);
          // 通知生成完成
          eventBus.emit('share-canvas-ready', res.tempFilePath);
        },
        fail: (err) => {
          console.error('导出图片失败', err);
          eventBus.emit('share-canvas-error', err);
        }
      }, this);
    }
  }
});
