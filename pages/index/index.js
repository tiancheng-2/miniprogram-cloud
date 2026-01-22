// pages/index/index.js
const restaurantService = require('../../services/restaurantService');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户头像
    userAvatar: '',

    // 统计数据
    stats: {
      totalRestaurants: 0,
      totalDishes: 0
    },

    // 餐厅列表
    restaurants: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('[Index] Page loaded');
    this.loadUserAvatar();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('[Index] Page ready');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('[Index] Page show');
    this.loadPageData();
  },

  /**
   * 加载用户头像
   */
  loadUserAvatar() {
    // 尝试从缓存获取用户信息
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.avatarUrl) {
      this.setData({
        userAvatar: userInfo.avatarUrl
      });
    }
  },

  /**
   * 加载页面数据
   */
  async loadPageData() {
    try {
      console.log('[Index] Loading page data');

      // 获取统计数据
      const stats = await restaurantService.getHomeStats();

      // 获取最近的餐厅列表
      const restaurants = await restaurantService.getRestaurants(0, 4);

      console.log('[Index] Stats:', stats);
      console.log('[Index] Restaurants:', restaurants);

      this.setData({
        stats: {
          totalRestaurants: stats.totalRestaurants || 0,
          totalDishes: stats.totalDishes || 0
        },
        restaurants: restaurants
      });

    } catch (error) {
      console.error('[Index] Load page data failed:', error);

      // 加载失败时使用默认值
      this.setData({
        stats: {
          totalRestaurants: 0,
          totalDishes: 0
        },
        restaurants: []
      });

      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 查看全部
   */
  onViewAll() {
    console.log('[Index] View all tapped');
    wx.vibrateShort({
      type: 'light'
    });
    
    // TODO: 跳转到餐厅列表页
    wx.showToast({
      title: '功能开发中',
      icon: 'none',
      duration: 1500
    });
  },

  /**
   * 点击卡片
   */
  onCardTap(e) {
    const { id } = e.currentTarget.dataset;
    console.log('[Index] Card tapped:', id);

    wx.vibrateShort({
      type: 'light'
    });

    // 跳转到餐厅详情页
    wx.navigateTo({
      url: `/pages/detail/index?id=${id}`
    });
  },

  /**
   * 点击 FAB 添加按钮
   */
  onAddTap() {
    console.log('[Index] FAB tapped');
    
    wx.vibrateShort({
      type: 'medium'
    });
    
    // 跳转到添加餐厅页面
    wx.navigateTo({
      url: '/pages/add/index'
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    console.log('[Index] Pull down refresh');
    
    this.loadPageData().then(() => {
      wx.stopPullDownRefresh();
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      });
    }).catch(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底
   */
  onReachBottom() {
    console.log('[Index] Reach bottom');
    
    // TODO: 实现分页加载
    wx.showToast({
      title: '加载更多',
      icon: 'none',
      duration: 1000
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '味觉空间 - 记录每一次美食体验',
      path: '/pages/index/index',
      imageUrl: 'https://placehold.co/400x400/FDFCFB/2C3E50?text=Taste+Space'
    };
  }
});