// pages/add-dishes/add-dishes.js
// 添加菜品到已有餐厅

const api = require('../../utils/api')

Page({
  data: {
    restaurantId: '',
    restaurantName: '',
    
    // 菜品列表（智能扩展）
    dishes: [
      { dishName: '', rating: '', note: '', tags: '', photoUrl: '' },
      { dishName: '', rating: '', note: '', tags: '', photoUrl: '' },
      { dishName: '', rating: '', note: '', tags: '', photoUrl: '' }
    ],
    
    submitting: false
  },

  onLoad(options) {
    const { restaurantId, restaurantName } = options
    
    if (!restaurantId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    
    this.setData({
      restaurantId,
      restaurantName: decodeURIComponent(restaurantName || '')
    })
  },

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
    
    // 如果是最后一个且已填写名称，自动添加新行
    if (index === dishes.length - 1 && currentDish.dishName.trim()) {
      dishes.push({
        dishName: '',
        rating: '',
        note: '',
        tags: '',
        photoUrl: ''
      })
      
      this.setData({ dishes })
      
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
  onChooseImage(e) {
    const { index } = e.currentTarget.dataset
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.uploadImage(tempFilePath, index)
      }
    })
  },

  /**
   * 上传图片
   */
  uploadImage(filePath, index) {
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
   * 删除照片
   */
  onDeletePhoto(e) {
    const { index } = e.currentTarget.dataset
    this.setData({
      [`dishes[${index}].photoUrl`]: ''
    })
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
    if (this.data.submitting) return
    
    const { restaurantId, dishes } = this.data
    
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
    
    if (validDishes.length === 0) {
      wx.showToast({ title: '请至少添加一道菜品', icon: 'none' })
      return
    }
    
    this.setData({ submitting: true })
    wx.showLoading({ title: '保存中...', mask: true })
    
    try {
      const dishesData = validDishes.map(d => ({
        dishName: d.dishName.trim(),
        rating: d.rating,
        note: d.note.trim(),
        tags: d.tags.split(/\s+/).filter(t => t.trim()).slice(0, 5),
        photoUrl: d.photoUrl || ''
      }))
      
      await api.batchAddDishes(restaurantId, dishesData)
      
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      wx.hideLoading()
      console.error('保存失败:', error)
      this.setData({ submitting: false })
    }
  }
})
