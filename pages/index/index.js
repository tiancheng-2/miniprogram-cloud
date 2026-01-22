// pages/index/index.js
const restaurantService = require('../../services/restaurantService');
const cloudDB = require('../../utils/db');

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
    
    // 餐厅列表（Mock Data）
    restaurants: [
      {
        id: 1,
        name: 'Sushi Jiro',
        image: 'https://placehold.co/400x400/e8f5e9/2e7d32?text=Sushi',
        rating: '5.0',
        tags: ['日料', '寿司']
      },
      {
        id: 2,
        name: 'Pasta Bar',
        image: 'https://placehold.co/400x400/fff3e0/f57c00?text=Pasta',
        rating: '4.8',
        tags: ['意大利', '面食']
      },
      {
        id: 3,
        name: 'The Grill',
        image: 'https://placehold.co/400x400/fce4ec/c2185b?text=Grill',
        rating: '4.9',
        tags: ['牛排', '西餐']
      },
      {
        id: 4,
        name: 'Golden Dragon',
        image: 'https://placehold.co/400x400/fff9c4/f9a825?text=Dragon',
        rating: '4.7',
        tags: ['粤菜', '茶点']
      }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('[Index] Page loaded');
    
    // ⭐ 确保 cloudDB 已初始化
    if (!cloudDB.initialized) {
      console.warn('[Index] CloudDB not initialized, initializing now...');
      cloudDB.init('cloud1-7gvrjj1p6b9df8ee');
    }
    
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
      
      // ⭐ 再次检查初始化状态
      if (!cloudDB.initialized) {
        console.warn('[Index] CloudDB not initialized, using mock data');
        this.setMockData();
        return;
      }
      
      // 加载真实数据
      const stats = await restaurantService.getHomeStats();
      const restaurants = await restaurantService.getRestaurants(0, 4);
      
      this.setData({
        stats: {
          totalRestaurants: stats.totalRestaurants || 0,
          totalDishes: stats.totalDishes || 0
        },
        restaurants: restaurants || []
      });
      
      console.log('[Index] Real data loaded successfully');
      
    } catch (error) {
      console.error('[Index] Load page data failed:', error);
      
      // 加载失败时使用 Mock 数据
      console.log('[Index] Falling back to mock data');
      this.setMockData();
      
      wx.showToast({
        title: '加载失败，显示示例数据',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 设置 Mock 数据
   */
  setMockData() {
    this.setData({
      stats: {
        totalRestaurants: 32,
        totalDishes: 128
      }
    });
    console.log('[Index] Mock data set');
  },

  /**
   * 查看全部
   */
  onViewAll() {
    console.log('[Index] View all tapped');
    wx.vibrateShort({
      type: 'light'
    });
    
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
    
    // TODO: 跳转到餐厅详情页
    wx.showToast({
      title: '跳转到餐厅详情',
      icon: 'none',
      duration: 1500
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
      imageUrl: '/assets/share-cover.png'
    };
  }
});