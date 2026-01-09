// pages/dish/dish.js
// 菜品详情页

const api = require('../../utils/api')

Page({
  data: {
    dishId: '',
    dishName: '',
    rating: '',
    note: '',
    tags: [],
    photoUrl: '',
    restaurantId: '',
    restaurantName: '',
    
    // 编辑模式
    isEditing: false,
    editingName: '',
    editingRating: '',
    editingNote: '',
    editingTags: '',
    editingPhotoUrl: ''
  },

  onLoad(options) {
    const { id, name, rating, restaurantId, restaurantName } = options
    
    if (!id) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    
    this.setData({
      dishId: id,
      dishName: decodeURIComponent(name || ''),
      rating: rating || '',
      restaurantId: restaurantId || '',
      restaurantName: decodeURIComponent(restaurantName || '')
    })
    
    this.loadDishDetail()
  },

  /**
   * 加载菜品详情
   */
  async loadDishDetail() {
    try {
      const res = await api.getDishDetail(this.data.dishId)
      const dish = res.data
      
      this.setData({
        dishName: dish.dishName,
        rating: dish.rating,
        note: dish.note || '',
        tags: dish.tags || [],
        photoUrl: dish.photoUrl || '',
        restaurantId: dish.restaurantId
      })
    } catch (error) {
      console.error('加载菜品详情失败:', error)
    }
  },

  /**
   * 预览照片
   */
  onPreviewPhoto() {
    if (this.data.photoUrl) {
      wx.previewImage({
        urls: [this.data.photoUrl],
        current: this.data.photoUrl
      })
    }
  },

  /**
   * 前往餐厅详情
   */
  goToRestaurant() {
    if (this.data.restaurantId) {
      wx.navigateTo({
        url: `/pages/restaurant/restaurant?id=${this.data.restaurantId}&name=${encodeURIComponent(this.data.restaurantName)}`
      })
    }
  },

  /**
   * 开始编辑
   */
  onEdit() {
    this.setData({
      isEditing: true,
      editingName: this.data.dishName,
      editingRating: this.data.rating,
      editingNote: this.data.note,
      editingTags: this.data.tags.join(' '),
      editingPhotoUrl: this.data.photoUrl
    })
  },

  /**
   * 取消编辑
   */
  onCancelEdit() {
    this.setData({
      isEditing: false,
      editingName: '',
      editingRating: '',
      editingNote: '',
      editingTags: '',
      editingPhotoUrl: ''
    })
  },

  /**
   * 编辑输入
   */
  onEditNameInput(e) {
    this.setData({ editingName: e.detail.value })
  },

  onSelectEditRating(e) {
    const { rating } = e.currentTarget.dataset
    this.setData({ editingRating: rating })
  },

  onEditNoteInput(e) {
    this.setData({ editingNote: e.detail.value })
  },

  onEditTagsInput(e) {
    this.setData({ editingTags: e.detail.value })
  },

  /**
   * 选择编辑照片
   */
  onChooseEditImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.uploadEditImage(tempFilePath)
      }
    })
  },

  /**
   * 上传编辑照片
   */
  uploadEditImage(filePath) {
    wx.showLoading({ title: '上传中...', mask: true })
    
    const cloudPath = `dishes/${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`
    
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => {
        wx.hideLoading()
        wx.showToast({ title: '上传成功', icon: 'success' })
        this.setData({ editingPhotoUrl: res.fileID })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('上传失败', err)
        wx.showToast({ title: '上传失败', icon: 'none' })
      }
    })
  },

  /**
   * 删除编辑照片
   */
  onDeleteEditPhoto() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ editingPhotoUrl: '' })
        }
      }
    })
  },

  /**
   * 保存编辑
   */
  async onSaveEdit() {
    const { editingName, editingRating, editingNote, editingTags, editingPhotoUrl } = this.data
    
    if (!editingName.trim()) {
      wx.showToast({ title: '请输入菜品名称', icon: 'none' })
      return
    }
    
    if (!editingRating) {
      wx.showToast({ title: '请选择评分', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '保存中...', mask: true })
    
    try {
      const tags = editingTags.split(/\s+/).filter(t => t.trim()).slice(0, 5)
      
      await api.updateDish(this.data.dishId, {
        dishName: editingName.trim(),
        rating: editingRating,
        note: editingNote.trim(),
        tags,
        photoUrl: editingPhotoUrl
      })
      
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
      
      // 更新页面数据
      this.setData({
        dishName: editingName.trim(),
        rating: editingRating,
        note: editingNote.trim(),
        tags,
        photoUrl: editingPhotoUrl,
        isEditing: false
      })
    } catch (error) {
      wx.hideLoading()
      console.error('保存失败:', error)
    }
  },

  /**
   * 删除菜品
   */
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这道菜品吗？',
      confirmText: '删除',
      confirmColor: '#EF5350',
      success: async (res) => {
        if (res.confirm) {
          await this.confirmDelete()
        }
      }
    })
  },

  /**
   * 确认删除
   */
  async confirmDelete() {
    wx.showLoading({ title: '删除中...', mask: true })
    
    try {
      await api.deleteDish(this.data.dishId)
      
      wx.hideLoading()
      wx.showToast({ title: '删除成功', icon: 'success' })
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      wx.hideLoading()
      console.error('删除失败:', error)
    }
  }
})
