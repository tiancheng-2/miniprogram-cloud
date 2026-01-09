// pages/restaurant/restaurant.js
// 餐厅详情页

const api = require('../../utils/api')

Page({
  data: {
    restaurantId: '',
    restaurantName: '',
    restaurantAddress: '',
    restaurantTags: [],
    
    // 筛选
    currentFilter: 'all', // all | must-try | avoid
    
    // 菜品列表
    allDishes: [],
    mustTryDishes: [],
    avoidDishes: [],
    
    loading: false
  },

  onLoad(options) {
    const { id, name } = options
    
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    
    this.setData({
      restaurantId: id,
      restaurantName: decodeURIComponent(name || '')
    })
    
    this.loadRestaurantDetail()
    this.loadDishes()
  },

  onShow() {
    // 从其他页面返回时刷新菜品列表
    if (this.data.restaurantId) {
      this.loadDishes()
    }
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    Promise.all([
      this.loadRestaurantDetail(),
      this.loadDishes()
    ]).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 加载餐厅详情
   */
  async loadRestaurantDetail() {
    try {
      const res = await api.getRestaurantDetail(this.data.restaurantId)
      const restaurant = res.data
      
      this.setData({
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address || '',
        restaurantTags: restaurant.tags || []
      })
    } catch (error) {
      console.error('加载餐厅详情失败:', error)
    }
  },

  /**
   * 加载菜品列表
   */
  async loadDishes() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    try {
      const res = await api.getDishList({
        restaurantId: this.data.restaurantId,
        limit: 100
      })
      
      const dishes = res.data.list || []
      
      // 添加首字符
      const processedDishes = dishes.map(item => ({
        ...item,
        dishChar: this.getDishChar(item.dishName)
      }))
      
      // 按评分分类
      const mustTry = processedDishes.filter(d => d.rating === 'must-try')
      const avoid = processedDishes.filter(d => d.rating === 'avoid')
      
      this.setData({
        allDishes: processedDishes,
        mustTryDishes: mustTry,
        avoidDishes: avoid,
        loading: false
      })
    } catch (error) {
      console.error('加载菜品失败:', error)
      this.setData({ loading: false })
    }
  },

  /**
   * 生成菜品首字符
   */
  getDishChar(name) {
    if (!name) return '菜'
    return name.charAt(0)
  },

  /**
   * 切换筛选
   */
  onFilterChange(e) {
    const { filter } = e.currentTarget.dataset
    this.setData({ currentFilter: filter })
  },

  /**
   * 查看菜品详情
   */
  onViewDish(e) {
    const { id, name, rating } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/dish/dish?id=${id}&name=${encodeURIComponent(name)}&rating=${rating}&restaurantId=${this.data.restaurantId}&restaurantName=${encodeURIComponent(this.data.restaurantName)}`
    })
  },

  /**
   * 编辑餐厅
   */
  onEditRestaurant() {
    wx.navigateTo({
      url: `/pages/edit-restaurant/edit-restaurant?id=${this.data.restaurantId}`
    })
  },

  /**
   * 新增菜品
   */
  goToAddDishes() {
    wx.navigateTo({
      url: `/pages/add-dishes/add-dishes?restaurantId=${this.data.restaurantId}&restaurantName=${encodeURIComponent(this.data.restaurantName)}`
    })
  },

  /**
   * 返回
   */
  onBack() {
    wx.navigateBack()
  }
})
