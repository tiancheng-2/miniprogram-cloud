// pages/profile/index.js
const restaurantService = require('../../services/restaurantService');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 用户信息
    userInfo: {
      avatarUrl: '',
      nickName: '美食探索者'
    },

    // 统计数据
    stats: {
      totalRestaurants: 0,
      totalDishes: 0,
      mustTryCount: 0,
      avoidCount: 0
    },

    // 加载状态
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('[Profile] Page loaded');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('[Profile] Page show');
    this.loadUserInfo();
    this.loadStats();
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    try {
      // 从缓存获取用户信息
      const userInfo = wx.getStorageSync('userInfo');

      if (userInfo && userInfo.avatarUrl) {
        this.setData({
          userInfo: {
            avatarUrl: userInfo.avatarUrl,
            nickName: userInfo.nickName || '美食探索者'
          }
        });
      } else {
        // 如果没有缓存，获取用户信息
        this.getUserProfile();
      }
    } catch (error) {
      console.error('[Profile] Load user info failed:', error);
    }
  },

  /**
   * 获取用户信息（需要用户授权）
   */
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善个人资料',
      success: (res) => {
        console.log('[Profile] Get user profile success:', res);

        const userInfo = {
          avatarUrl: res.userInfo.avatarUrl,
          nickName: res.userInfo.nickName
        };

        // 保存到缓存
        wx.setStorageSync('userInfo', userInfo);

        this.setData({ userInfo });
      },
      fail: (err) => {
        console.error('[Profile] Get user profile failed:', err);
      }
    });
  },

  /**
   * 加载统计数据
   */
  async loadStats() {
    try {
      this.setData({ loading: true });

      // 调用服务获取统计数据
      const stats = await restaurantService.getHomeStats();

      console.log('[Profile] Stats loaded:', stats);

      this.setData({
        stats,
        loading: false
      });

    } catch (error) {
      console.error('[Profile] Load stats failed:', error);

      this.setData({ loading: false });

      // 使用默认数据
      this.setData({
        stats: {
          totalRestaurants: 0,
          totalDishes: 0,
          mustTryCount: 0,
          avoidCount: 0
        }
      });
    }
  },

  /**
   * 导航到地图页面
   */
  onNavigateToMap() {
    console.log('[Profile] Navigate to map');

    wx.vibrateShort({ type: 'light' });

    wx.navigateTo({
      url: '/pages/map/index'
    });
  },

  /**
   * 关于我们
   */
  onAbout() {
    console.log('[Profile] About tapped');

    wx.vibrateShort({ type: 'light' });

    wx.showModal({
      title: '关于味觉空间',
      content: '味觉空间是一款美食手账小程序，帮助你记录每一次美食体验。\n\n版本：v1.0.0',
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#2C3E50'
    });
  },

  /**
   * 下拉刷新
   */
  async onPullDownRefresh() {
    console.log('[Profile] Pull down refresh');

    await this.loadStats();

    wx.stopPullDownRefresh();

    wx.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1500
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
