// pages/dish/dish.js
const validator = require('../../utils/validator');
const ImageHelper = require('../../utils/image-helper');

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
    isEditing: false,
    editingName: '',
    editingRating: '',
    editingNote: '',
    editingTags: '',
    editingPhotoUrl: ''
  },

  onLoad(options) {
    const dishId = options.id || '';
    const dishName = decodeURIComponent(options.name || '');
    const rating = options.rating || '';
    const photoUrl = decodeURIComponent(options.photos || '');
    const note = decodeURIComponent(options.note || '');
    const restaurantId = options.restaurantId || '';
    const restaurantName = decodeURIComponent(options.restaurantName || '');

    if (!dishId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    // 加载完整数据
    this.loadDishData(dishId, {
      dishName,
      rating,
      photoUrl,
      note,
      restaurantId,
      restaurantName
    });
  },

  /**
   * 加载菜品完整数据
   */
  loadDishData(dishId, initialData) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    const db = wx.cloud.database();

    db.collection('dishes')
      .doc(dishId)
      .get()
      .then(res => {
        wx.hideLoading();

        if (res.data) {
          this.setData({
            dishId: dishId,
            dishName: res.data.dishName || initialData.dishName,
            rating: res.data.rating || initialData.rating,
            note: res.data.note || initialData.note,
            tags: res.data.tags || [],
            photoUrl: res.data.photoUrl || initialData.photoUrl,
            restaurantId: res.data.restaurantId || initialData.restaurantId,
            restaurantName: initialData.restaurantName
          });
        } else {
          // 使用初始数据
          this.setData({
            dishId: dishId,
            dishName: initialData.dishName,
            rating: initialData.rating,
            note: initialData.note,
            tags: [],
            photoUrl: initialData.photoUrl,
            restaurantId: initialData.restaurantId,
            restaurantName: initialData.restaurantName
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('加载菜品数据失败', err);
        
        // 使用初始数据
        this.setData({
          dishId: dishId,
          dishName: initialData.dishName,
          rating: initialData.rating,
          note: initialData.note,
          tags: [],
          photoUrl: initialData.photoUrl,
          restaurantId: initialData.restaurantId,
          restaurantName: initialData.restaurantName
        });
      });
  },

  /**
   * 预览照片
   */
  onPreviewPhoto() {
    if (this.data.photoUrl) {
      ImageHelper.preview([this.data.photoUrl]);
    }
  },

  /**
   * 预览编辑照片
   */
  onPreviewEditPhoto() {
    if (this.data.editingPhotoUrl) {
      ImageHelper.preview([this.data.editingPhotoUrl]);
    }
  },

  /**
   * 前往餐厅详情
   */
  goToRestaurant() {
    const { restaurantId, restaurantName } = this.data;
    if (restaurantId) {
      wx.navigateTo({
        url: `/pages/restaurant/restaurant?id=${restaurantId}&name=${encodeURIComponent(restaurantName)}`
      });
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
    });
  },

  /**
   * 取消编辑
   */
  onCancelEdit() {
    // 如果编辑中的照片与原照片不同，删除编辑中的照片
    if (this.data.editingPhotoUrl && 
        this.data.editingPhotoUrl !== this.data.photoUrl) {
      ImageHelper.deleteFile(this.data.editingPhotoUrl);
    }

    this.setData({
      isEditing: false,
      editingName: '',
      editingRating: '',
      editingNote: '',
      editingTags: '',
      editingPhotoUrl: ''
    });
  },

  /**
   * 编辑菜品名称
   */
  onEditNameInput(e) {
    const value = validator.validateDishName(e.detail.value);
    this.setData({
      editingName: value
    });
  },

  /**
   * 选择编辑评分
   */
  onSelectEditRating(e) {
    const { rating } = e.currentTarget.dataset;
    this.setData({
      editingRating: rating
    });
  },

  /**
   * 编辑笔记
   */
  onEditNoteInput(e) {
    const value = validator.validateDishNote(e.detail.value);
    this.setData({
      editingNote: value
    });
  },

  /**
   * 编辑标签
   */
  onEditTagsInput(e) {
    this.setData({
      editingTags: e.detail.value
    });
  },

  /**
   * 选择编辑图片 - 使用统一工具类
   */
  onChooseEditImage() {
    ImageHelper.chooseAndUpload({
      count: 1,
      onSuccess: (fileID) => {
        // 删除旧图片
        if (this.data.editingPhotoUrl && 
            this.data.editingPhotoUrl !== this.data.photoUrl) {
          ImageHelper.deleteFile(this.data.editingPhotoUrl);
        }
        
        this.setData({
          editingPhotoUrl: fileID
        });
      }
    });
  },

  /**
   * 删除编辑照片 - 使用统一工具类
   */
  onDeleteEditPhoto() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          // 只在编辑照片不等于原照片时删除云存储
          if (this.data.editingPhotoUrl !== this.data.photoUrl) {
            ImageHelper.deleteFile(this.data.editingPhotoUrl);
          }
          
          this.setData({
            editingPhotoUrl: ''
          });
          
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  /**
   * 保存编辑
   */
  onSaveEdit() {
    const { dishId, editingName, editingRating, editingNote, editingTags, editingPhotoUrl, photoUrl, rating } = this.data;

    // 验证
    if (validator.isEmpty(editingName)) {
      wx.showToast({
        title: '请输入菜品名称',
        icon: 'none'
      });
      return;
    }

    if (!validator.isLengthValid(editingName, 1, 20)) {
      wx.showToast({
        title: '菜品名称为1-20字',
        icon: 'none'
      });
      return;
    }

    if (!editingRating || (editingRating !== 'must-try' && editingRating !== 'avoid')) {
      wx.showToast({
        title: '请选择必点或避坑',
        icon: 'none'
      });
      return;
    }

    if (editingNote && !validator.isEmpty(editingNote)) {
      if (!validator.isLengthValid(editingNote, 0, 50)) {
        wx.showToast({
          title: '笔记不超过50字',
          icon: 'none'
        });
        return;
      }
    }

    // 处理标签
    const processedTags = editingTags
      .split(/\s+/)
      .filter(tag => tag.trim().length > 0)
      .slice(0, 5);

    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    const db = wx.cloud.database();
    const _ = db.command;

    // 更新菜品数据
    db.collection('dishes')
      .doc(dishId)
      .update({
        data: {
          dishName: editingName.trim(),
          rating: editingRating,
          note: editingNote.trim() || '',
          tags: processedTags,
          photoUrl: editingPhotoUrl || ''
        }
      })
      .then(res => {
        // 如果评分改变了，需要更新餐厅统计
        if (rating !== editingRating) {
          const mustTryChange = (editingRating === 'must-try' ? 1 : -1);
          const avoidChange = (editingRating === 'avoid' ? 1 : -1);

          return db.collection('restaurants')
            .doc(this.data.restaurantId)
            .update({
              data: {
                mustTryCount: _.inc(mustTryChange),
                avoidCount: _.inc(avoidChange)
              }
            });
        }
        return Promise.resolve();
      })
      .then(res => {
        // 删除旧照片（如果照片改变了）
        if (photoUrl && editingPhotoUrl !== photoUrl) {
          ImageHelper.deleteFile(photoUrl);
        }

        wx.hideLoading();
        
        // 清除缓存
        const app = getApp();
        app.clearCache();

        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1500
        });

        // 更新页面数据
        this.setData({
          dishName: editingName.trim(),
          rating: editingRating,
          note: editingNote.trim() || '',
          tags: processedTags,
          photoUrl: editingPhotoUrl || '',
          isEditing: false,
          editingName: '',
          editingRating: '',
          editingNote: '',
          editingTags: '',
          editingPhotoUrl: ''
        });
      })
      .catch(err => {
        wx.hideLoading();
        console.error('保存失败', err);
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 删除菜品
   */
  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这道菜品吗？',
      confirmText: '删除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          this.confirmDelete();
        }
      }
    });
  },

  /**
   * 确认删除
   */
  confirmDelete() {
    const { dishId, photoUrl, rating, restaurantId } = this.data;

    wx.showLoading({
      title: '删除中...',
      mask: true
    });

    const db = wx.cloud.database();
    const _ = db.command;

    // 删除菜品
    db.collection('dishes')
      .doc(dishId)
      .remove()
      .then(res => {
        // 更新餐厅统计
        const updateData = {};
        if (rating === 'must-try') {
          updateData.mustTryCount = _.inc(-1);
        } else if (rating === 'avoid') {
          updateData.avoidCount = _.inc(-1);
        }

        if (Object.keys(updateData).length > 0) {
          return db.collection('restaurants')
            .doc(restaurantId)
            .update({
              data: updateData
            });
        }
        return Promise.resolve();
      })
      .then(res => {
        // 删除照片
        if (photoUrl) {
          ImageHelper.deleteFile(photoUrl);
        }

        wx.hideLoading();
        
        // 清除缓存
        const app = getApp();
        app.clearCache();

        wx.showToast({
          title: '删除成功',
          icon: 'success',
          duration: 1500
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('删除失败', err);
        wx.showToast({
          title: '删除失败，请重试',
          icon: 'none'
        });
      });
  },

  /**
   * 分享菜品
   */
  onShareDish() {
    const app = getApp();
    const { dishId, dishName, rating, photoUrl, note, restaurantName } = this.data;

    app.globalData.shareType = 'dish';
    app.globalData.shareData = {
      dishId: dishId,
      dishName: dishName,
      rating: rating,
      photoUrl: photoUrl,
      note: note,
      restaurantName: restaurantName
    };

    wx.navigateTo({
      url: '/pages/share-preview/share-preview'
    });
  }
});
