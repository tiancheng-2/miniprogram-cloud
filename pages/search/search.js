// pages/search/search.js
// 搜索页面 - 防抖实现

const api = require('../../utils/api')

Page({
  data: {
    keyword: '',
    restaurantResults: [],
    dishResults: [],
    hasResults: false,
    searching: false,
    hasSearched: false,
    
    // 防抖timer
    searchTimer: null
  },

  /**
   * 搜索输入（防抖500ms）
   */
  onSearchInput(e) {
    const keyword = e.detail.value.trim()
    this.setData({ keyword })
    
    // 清空之前的timer
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer)
    }
    
    if (!keyword) {
      this.setData({
        restaurantResults: [],
        dishResults: [],
        hasResults: false,
        searching: false,
        hasSearched: false
      })
      return
    }
    
    // 显示搜索中状态
    this.setData({ searching: true })
    
    // 防抖：500ms后执行搜索
    const timer = setTimeout(() => {
      this.performSearch(keyword)
    }, 500)
    
    this.setData({ searchTimer: timer })
  },

  /**
   * 执行搜索
   */
  async performSearch(keyword) {
    if (!keyword) return
    
    try {
      // 并行搜索餐厅和菜品
      const [restaurantRes, dishRes] = await Promise.all([
        api.getRestaurantList({ keyword, limit: 20 }),
        api.getDishList({ keyword, limit: 20 })
      ])
      
      const restaurants = restaurantRes.data.list || []
      const dishes = dishRes.data.list || []
      
      // 为菜品获取餐厅名称
      const dishesWithRestaurant = await this.enrichDishesWithRestaurant(dishes)
      
      this.setData({
        restaurantResults: restaurants,
        dishResults: dishesWithRestaurant,
        hasResults: restaurants.length > 0 || dishes.length > 0,
        searching: false,
        hasSearched: true
      })
    } catch (error) {
      console.error('搜索失败:', error)
      this.setData({
        searching: false,
        hasSearched: true
      })
    }
  },

  /**
   * 为菜品补充餐厅名称
   */
  async enrichDishesWithRestaurant(dishes) {
    if (dishes.length === 0) return []
    
    // 获取所有唯一的餐厅ID
    const restaurantIds = [...new Set(dishes.map(d => d.restaurantId))]
    
    // 批量获取餐厅信息
    const restaurantMap = {}
    await Promise.all(
      restaurantIds.map(async (id) => {
        try {
          const res = await api.getRestaurantDetail(id)
          restaurantMap[id] = res.data.name
        } catch (error) {
          restaurantMap[id] = '未知餐厅'
        }
      })
    )
    
    // 补充餐厅名称
    return dishes.map(dish => ({
      ...dish,
      restaurantName: restaurantMap[dish.restaurantId] || '未知餐厅'
    }))
  },

  /**
   * 选择搜索结果
   */
  onSelectResult(e) {
    const { type, id, name } = e.currentTarget.dataset
    
    if (type === 'restaurant') {
      wx.navigateTo({
        url: `/pages/restaurant/restaurant?id=${id}&name=${encodeURIComponent(name)}`
      })
    } else if (type === 'dish') {
      const { rating, restaurantId, restaurantName } = e.currentTarget.dataset
      wx.navigateTo({
        url: `/pages/dish/dish?id=${id}&name=${encodeURIComponent(name)}&rating=${rating}&restaurantId=${restaurantId}&restaurantName=${encodeURIComponent(restaurantName)}`
      })
    }
  },

  /**
   * 页面卸载时清除timer
   */
  onUnload() {
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer)
    }
  }
})
