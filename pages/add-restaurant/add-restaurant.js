// pages/add-restaurant/add-restaurant.js
// 添加餐厅 - 智能扩展输入

const api = require('../../utils/api')

Page({
  data: {
    // 餐厅信息
    restaurantName: '',
    restaurantAddress: '',
    restaurantTags: '',
    
    // 菜品列表（智能扩展）
    dishes: [
      { dishName: '', rating: '', note: '', tags: '', photoUrl: '' },
      { dishName: '', rating: '', note: '', tags: '', photoUrl: '' },
      { dishName: '', rating: '', note: '', tags: '', photoUrl: '' }
    ],
    
    // 提交状态
    submitting: false
  },

  // ==================== 餐厅信息输入 ====================
  
  onNameInput(e) {
    this.setData({ restaurantName: e.detail.value })
  },

  onAddressInput(e) {
    this.setData({ restaurantAddress: e.detail.value })
  },

  onTagsInput(e) {
    this.setData({ restaurantTags: e.detail.value })
  },

  // ==================== 菜品输入 ====================
  
  /**
   * 菜品名称输入
   */
  onDishNameInput(e) {
    const { index } = e.currentTarget.dataset
    this.setData({
      [`dishes[${index}].dishName`]: e.detail.value
    })
  },

  /**
   * 菜品名称失焦 - 智能扩展
   */
  onDishNameBlur(e) {
    const { index } = e.currentTarget.dataset
    const dishes = this.data.dishes
    const currentDish = dishes[index]
    
    // 如果是最后一个菜品，且已填写名称，自动添加新行
    if (index === dishes.length - 1 && currentDish.dishName.trim()) {
      dishes.push({
        dishName: '',
        rating: '',
        note: '',
        tags: '',
        photoUrl: ''
      })
      
      this.setData({ dishes })
      
      // 自动滚动到新位置
      setTimeout(() => {
        wx.pageScrollTo({
          selector: `.dish-form:last-child`,
          duration: 300
        })
      }, 100)
    }
  },

  /**
   * 选择评分
   */
  onSelectRating(e) {
    const { index, rating } = e.currentTarget.dataset
    this.setData({
      [`dishes[${index}].rating`]: rating
    })
  },

  /**
   * 菜品笔记输入
   */
  onDishNoteInput(e) {
    const { index } = e.currentTarget.dataset
    this.setData({
      [`dishes[${index}].note`]: e.detail.value
    })
  },

  /**
   * 菜品标签输入
   */
  onDishTagsInput(e) {
    const { index } = e.currentTarget.dataset
    this.setData({
      [`dishes[${index}].tags`]: e.detail.value
    })
  },

  /**
   * 选择菜品图片
   */
  onChooseDishImage(e) {
    const { index } = e.currentTarget.dataset
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.uploadDishImage(tempFilePath, index)
      }
    })
  },

  /**
   * 上传菜品图片
   */
  uploadDishImage(filePath, index) {
    wx.showLoading({ title: '上传中...', mask: true })
    
    const cloudPath = `dishes/${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`
    
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => {
        wx.hideLoading()
        wx.showToast({ title: '上传成功', icon: 'success' })
        this.setData({
          [`dishes[${index}].photoUrl`]: res.fileID
        })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('上传失败', err)
        wx.showToast({ title: '上传失败', icon: 'none' })
      }
    })
  },

  /**
   * 删除菜品照片
   */
  onDeleteDishPhoto(e) {
    const { index } = e.currentTarget.dataset
    this.setData({
      [`dishes[${index}].photoUrl`]: ''
    })
  },

  // ==================== 表单提交 ====================
  
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
    if (this.data.submitting) return
    
    const { restaurantName, restaurantAddress, restaurantTags, dishes } = this.data
    
    // 校验餐厅名称
    if (!restaurantName.trim()) {
      wx.showToast({ title: '请输入餐厅名称', icon: 'none' })
      return
    }
    
    if (restaurantName.trim().length > 15) {
      wx.showToast({ title: '餐厅名称不能超过15字', icon: 'none' })
      return
    }
    
    // 处理餐厅标签
    const tags = restaurantTags
      .split(/\s+/)
      .filter(tag => tag.trim())
      .slice(0, 5)
    
    // 过滤有效菜品
    const validDishes = dishes.filter(d => {
      if (!d.dishName.trim()) return false
      
      if (d.dishName.trim().length > 20) {
        wx.showToast({ title: '菜品名称不能超过20字', icon: 'none' })
        return false
      }
      
      if (!d.rating || !['must-try', 'avoid'].includes(d.rating)) {
        wx.showToast({ title: '请为每道菜品选择必点或避坑', icon: 'none' })
        return false
      }
      
      return true
    })
    
    this.setData({ submitting: true })
    wx.showLoading({ title: '保存中...', mask: true })
    
    try {
      // 1. 添加餐厅
      const restaurantRes = await api.addRestaurant({
        name: restaurantName.trim(),
        address: restaurantAddress.trim(),
        tags
      })
      
      const restaurantId = restaurantRes.data._id
      
      // 2. 批量添加菜品
      if (validDishes.length > 0) {
        const dishesData = validDishes.map(d => ({
          dishName: d.dishName.trim(),
          rating: d.rating,
          note: d.note.trim(),
          tags: d.tags.split(/\s+/).filter(t => t.trim()).slice(0, 5),
          photoUrl: d.photoUrl || ''
        }))
        
        await api.batchAddDishes(restaurantId, dishesData)
      }
      
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success', duration: 1500 })
      
      // 跳转到餐厅详情页
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/restaurant/restaurant?id=${restaurantId}&name=${encodeURIComponent(restaurantName.trim())}`
        })
      }, 1500)
      
    } catch (error) {
      wx.hideLoading()
      console.error('保存失败:', error)
      this.setData({ submitting: false })
    }
  }
})
