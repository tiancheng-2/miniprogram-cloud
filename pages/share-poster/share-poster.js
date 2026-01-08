// pages/share-poster/share-poster.js - 分享海报页逻辑

Page({
  data: {
    restaurantId: '',
    restaurantName: '',
    mustTryDishes: [],
    avoidDishes: []
  },

  onLoad(options) {
    const id = options.id || '';
    
    if (!id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        // 跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      }, 1500);
      return;
    }

    this.setData({
      restaurantId: id
    });

    this.loadData();
  },

  /**
   * 加载餐厅和菜品数据
   */
  loadData() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    const db = wx.cloud.database();

    // 并行加载餐厅信息和菜品列表
    Promise.all([
      // 1. 加载餐厅信息
      db.collection('restaurants')
        .doc(this.data.restaurantId)
        .get(),
      
      // 2. 加载菜品列表
      db.collection('dishes')
        .where({
          restaurantId: this.data.restaurantId
        })
        .orderBy('createTime', 'desc')
        .get()
    ])
    .then(([restaurantRes, dishesRes]) => {
      // 餐厅名称
      const restaurantName = restaurantRes.data.name || '';
      
      // 筛选菜品
      const mustTryDishes = dishesRes.data
        .filter(dish => dish.rating === 'must-try')
        .slice(0, 3); // 最多3道
      
      const avoidDishes = dishesRes.data
        .filter(dish => dish.rating === 'avoid')
        .slice(0, 2); // 最多2道
      
      this.setData({
        restaurantName: restaurantName,
        mustTryDishes: mustTryDishes,
        avoidDishes: avoidDishes
      });

      wx.hideLoading();
    })
    .catch(err => {
      console.error('加载数据失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  /**
   * 分享配置
   */
  onShareAppMessage() {
    return {
      title: `推荐${this.data.restaurantName}，这些菜必点！`,
      path: `/pages/share-poster/share-poster?id=${this.data.restaurantId}`,
      imageUrl: '' // 使用默认截图
    };
  },

  /**
   * 分享到朋友圈（如果需要）
   */
  onShareTimeline() {
    return {
      title: `推荐${this.data.restaurantName}，这些菜必点！`,
      query: `id=${this.data.restaurantId}`,
      imageUrl: '' // 使用默认截图
    };
  }
});
