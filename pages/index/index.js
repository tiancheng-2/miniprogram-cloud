// pages/index/index.js
Page({
  data: {
    restaurants: [],
    loading: true,
    // 统计数据
    totalRestaurants: 0,
    totalDishes: 0,
    totalMustTry: 0,
    totalAvoid: 0  // 新增避坑统计
  },

  onShow() {
    // 每次显示页面时加载餐厅列表
    this.loadRestaurants();
    this.loadStatistics();
  },

  // 加载餐厅列表
  loadRestaurants() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    const db = wx.cloud.database();
    db.collection('restaurants')
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        wx.hideLoading();
        
        // 为每个餐厅生成封面字符（取首字）
        const restaurants = res.data.map(item => {
          return {
            ...item,
            coverChar: this.getCoverChar(item.name)
          };
        });
        
        this.setData({
          restaurants: restaurants,
          loading: false
        });
      })
      .catch(err => {
        wx.hideLoading();
        
        console.error('加载餐厅列表失败', err);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
        
        this.setData({
          loading: false
        });
      });
  },

  // 加载统计数据
  loadStatistics() {
    const db = wx.cloud.database();
    
    Promise.all([
      // 统计餐厅总数
      db.collection('restaurants').count(),
      // 统计菜品总数
      db.collection('dishes').count(),
      // 统计必点菜品数
      db.collection('dishes').where({
        rating: 'must-try'
      }).count(),
      // 统计避坑菜品数
      db.collection('dishes').where({
        rating: 'avoid'
      }).count()
    ])
    .then(results => {
      this.setData({
        totalRestaurants: results[0].total || 0,
        totalDishes: results[1].total || 0,
        totalMustTry: results[2].total || 0,
        totalAvoid: results[3].total || 0
      });
    })
    .catch(err => {
      console.error('加载统计数据失败', err);
    });
  },

  // 生成封面字符（取餐厅名首字）
  getCoverChar(name) {
    if (!name) return '食';
    // 取第一个字符
    return name.charAt(0);
  },

  // 跳转到新增餐厅页面
  goToAddRestaurant() {
    wx.navigateTo({
      url: '/pages/add-restaurant/add-restaurant'
    });
  },

  // 跳转到搜索页面
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    });
  },

  // 前往餐厅详情
  goToRestaurant(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/restaurant/restaurant?id=${id}&name=${encodeURIComponent(name)}`
    });
  },

  // 编辑餐厅
  onEditRestaurant(e) {
    const { id, name, address } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/edit-restaurant/edit-restaurant?id=${id}&name=${encodeURIComponent(name)}&address=${encodeURIComponent(address || '')}`
    });
  }
});
