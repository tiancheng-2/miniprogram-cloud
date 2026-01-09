// pages/index/index.js
// 首页 - 餐厅列表

const api = require('../../utils/api')

Page({
  data: {
    restaurants: [],
    loading: false,
    refreshing: false,
    // 统计数据
    totalRestaurants: 0,
    totalDishes: 0,
    totalMustTry: 0,
    totalAvoid: 0
  },

  onLoad() {
    this.loadRestaurants()
  },

  onShow() {
    // 从其他页面返回时刷新
    this.loadRestaurants()
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.loadRestaurants()
    setTimeout(() => {
      wx.stopPullDownRefresh()
      this.setData({ refreshing: false })
    }, 1000)
  },

  /**
   * 加载餐厅列表
   */
  async loadRestaurants() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const res = await api.getRestaurantList()
      const restaurants = res.data.list || []
      
      // 添加封面字符
      const processedRestaurants = restaurants.map(item => ({
        ...item,
        coverChar: this.getCoverChar(item.name)
      }))
      
      // 计算统计数据
      const stats = this.calculateStats(restaurants)
      
      this.setData({
        restaurants: processedRestaurants,
        ...stats,
        loading: false
      })
    } catch (error) {
      console.error('加载餐厅失败:', error)
      this.setData({ loading: false })
    }
  },

  /**
   * 计算统计数据
   */
  calculateStats(restaurants) {
    let totalMustTry = 0
    let totalAvoid = 0
    let totalDishes = 0
    
    restaurants.forEach(r => {
      totalMustTry += r.mustTryCount || 0
      totalAvoid += r.avoidCount || 0
      totalDishes += (r.mustTryCount || 0) + (r.avoidCount || 0)
    })
    
    return {
      totalRestaurants: restaurants.length,
      totalDishes,
      totalMustTry,
      totalAvoid
    }
  },

  /**
   * 生成封面字符
   */
  getCoverChar(name) {
    if (!name) return '食'
    return name.charAt(0)
  },

  /**
   * 跳转到新增餐厅页面
   */
  goToAddRestaurant() {
    wx.navigateTo({
      url: '/pages/add-restaurant/add-restaurant'
    })
  },

  /**
   * 跳转到搜索页面
   */
  goToSearch() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  /**
   * 前往餐厅详情
   */
  goToRestaurant(e) {
    const { id, name } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/restaurant/restaurant?id=${id}&name=${encodeURIComponent(name)}`
    })
  }
})
