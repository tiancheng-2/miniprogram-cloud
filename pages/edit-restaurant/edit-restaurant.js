// pages/edit-restaurant/edit-restaurant.js
// 编辑餐厅页面

const api = require('../../utils/api')

Page({
  data: {
    restaurantId: '',
    restaurantName: '',
    restaurantAddress: '',
    restaurantTags: '',
    showDeleteModal: false
  },

  onLoad(options) {
    const { id } = options
    
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    
    this.setData({ restaurantId: id })
    this.loadRestaurantDetail()
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
        restaurantTags: (restaurant.tags || []).join(' ')
      })
    } catch (error) {
      console.error('加载餐厅详情失败:', error)
    }
  },

  /**
   * 输入处理
   */
  onNameInput(e) {
    this.setData({ restaurantName: e.detail.value })
  },

  onAddressInput(e) {
    this.setData({ restaurantAddress: e.detail.value })
  },

  onTagsInput(e) {
    this.setData({ restaurantTags: e.detail.value })
  },

  /**
   * 取消
   */
  onCancel() {
    wx.navigateBack()
  },

  /**
   * 保存
   */
  async onSave() {
    const { restaurantId, restaurantName, restaurantAddress, restaurantTags } = this.data
    
    if (!restaurantName.trim()) {
      wx.showToast({ title: '请输入餐厅名称', icon: 'none' })
      return
    }
    
    if (restaurantName.trim().length > 15) {
      wx.showToast({ title: '餐厅名称不能超过15字', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '保存中...', mask: true })
    
    try {
      const tags = restaurantTags.split(/\s+/).filter(t => t.trim()).slice(0, 5)
      
      await api.updateRestaurant(restaurantId, {
        name: restaurantName.trim(),
        address: restaurantAddress.trim(),
        tags
      })
      
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      wx.hideLoading()
      console.error('保存失败:', error)
    }
  },

  /**
   * 显示删除确认
   */
  onShowDeleteModal() {
    this.setData({ showDeleteModal: true })
  },

  /**
   * 隐藏删除确认
   */
  onHideDeleteModal() {
    this.setData({ showDeleteModal: false })
  },

  /**
   * 防止点击穿透
   */
  doNothing() {},

  /**
   * 确认删除
   */
  async onConfirmDelete() {
    wx.showLoading({ title: '删除中...', mask: true })
    
    try {
      await api.deleteRestaurant(this.data.restaurantId)
      
      wx.hideLoading()
      wx.showToast({ title: '删除成功', icon: 'success' })
      
      setTimeout(() => {
        wx.navigateBack({ delta: 2 }) // 返回两级到首页
      }, 1500)
    } catch (error) {
      wx.hideLoading()
      console.error('删除失败:', error)
      this.setData({ showDeleteModal: false })
    }
  }
})
