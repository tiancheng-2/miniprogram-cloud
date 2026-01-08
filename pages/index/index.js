// pages/index/index.js
const app = getApp();

Page({
  data: {
    restaurants: [],
    loading: false,
    // 统计数据
    totalRestaurants: 0,
    totalDishes: 0,
    totalMustTry: 0,
    totalAvoid: 0
  },

  onLoad() {
    // 首次加载
    this.loadData(false);
  },

  onShow() {
    // 从其他页面返回时，检查是否需要刷新
    // 如果缓存失效，才重新加载
    if (!app.isCacheValid()) {
      this.loadData(false);
    } else {
      // 使用缓存数据
      this.loadFromCache();
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.loadData(true);
  },

  /**
   * 从缓存加载数据
   */
  loadFromCache() {
    const { restaurants, statistics } = app.globalData.cache;
    
    if (restaurants) {
      this.setData({
        restaurants: restaurants.map(item => ({
          ...item,
          coverChar: this.getCoverChar(item.name)
        }))
      });
    }

    if (statistics) {
      this.setData({
        totalRestaurants: statistics.totalRestaurants || 0,
        totalDishes: statistics.totalDishes || 0,
        totalMustTry: statistics.totalMustTry || 0,
        totalAvoid: statistics.totalAvoid || 0
      });
    }
  },

  /**
   * 加载所有数据（优化：合并请求）
   */
  loadData(isPullDown = false) {
    if (this.data.loading) return;

    this.setData({ loading: true });

    if (!isPullDown) {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    }

    const db = wx.cloud.database();

    // 合并所有请求为一次性执行
    Promise.all([
      // 1. 获取餐厅列表
      db.collection('restaurants')
        .orderBy('createTime', 'desc')
        .get(),
      
      // 2-5. 获取统计数据（改用聚合查询）
      this.getStatistics()
    ])
    .then(([restaurantsRes, statistics]) => {
      // 处理餐厅数据
      const restaurants = restaurantsRes.data.map(item => ({
        ...item,
        coverChar: this.getCoverChar(item.name)
      }));

      // 更新数据
      this.setData({
        restaurants: restaurants,
        totalRestaurants: statistics.totalRestaurants,
        totalDishes: statistics.totalDishes,
        totalMustTry: statistics.totalMustTry,
        totalAvoid: statistics.totalAvoid,
        loading: false
      });

      // 缓存数据
      app.setCache('restaurants', restaurantsRes.data);
      app.setCache('statistics', statistics);

      if (!isPullDown) {
        wx.hideLoading();
      }
    })
    .catch(err => {
      console.error('加载数据失败', err);
      this.setData({ loading: false });

      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });

      if (!isPullDown) {
        wx.hideLoading();
      }
    })
    .finally(() => {
      if (isPullDown) {
        wx.stopPullDownRefresh();
      }
    });
  },

  /**
   * 获取统计数据（优化：减少查询次数）
   */
  getStatistics() {
    const db = wx.cloud.database();

    return Promise.all([
      db.collection('restaurants').count(),
      db.collection('dishes').count(),
      db.collection('dishes').where({ rating: 'must-try' }).count(),
      db.collection('dishes').where({ rating: 'avoid' }).count()
    ])
    .then(([restaurantsCount, dishesCount, mustTryCount, avoidCount]) => {
      return {
        totalRestaurants: restaurantsCount.total || 0,
        totalDishes: dishesCount.total || 0,
        totalMustTry: mustTryCount.total || 0,
        totalAvoid: avoidCount.total || 0
      };
    });
  },

  /**
   * 生成封面字符
   */
  getCoverChar(name) {
    if (!name) return '食';
    return name.charAt(0);
  },

  /**
   * 跳转到新增餐厅页面
   */
  goToAddRestaurant() {
    wx.navigateTo({
      url: '/pages/add-restaurant/add-restaurant'
    });
  },

  /**
   * 跳转到搜索页面
   */
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  /**
   * 前往餐厅详情
   */
  goToRestaurant(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/restaurant/restaurant?id=${id}&name=${encodeURIComponent(name)}`
    });
  },

  /**
   * 编辑餐厅
   */
  onEditRestaurant(e) {
    const { id, name, address } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/edit-restaurant/edit-restaurant?id=${id}&name=${encodeURIComponent(name)}&address=${encodeURIComponent(address || '')}`
    });
  }
});
