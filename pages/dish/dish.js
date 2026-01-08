// pages/dish/dish.js
const validator = require('../../utils/validator');

Page({
  data: {
    dishId: '',
    dishName: '',
    rating: 'must-try',
    photos: [],
    note: '',
    tags: [],  // 标签数组
    restaurantId: '',
    restaurantName: '',
    isEditing: false,
    // 编辑状态的数据
    editingName: '',
    editingRating: '',
    editingNote: '',
    editingTagsInput: '' , // 标签输入字符串
    editingPhotoUrl: ''  // 新增：编辑中的照片URL
  },

  onLoad(options) {
    const { id, name, rating, photos, note, restaurantId, restaurantName } = options;
    
    if (!id) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    // 处理照片
    let photoList = [];
    if (photos && photos !== 'undefined') {
      const photoUrl = decodeURIComponent(photos);
      if (photoUrl) {
        photoList = [photoUrl];
      }
    }

    this.setData({
      dishId: id,
      dishName: decodeURIComponent(name || ''),
      rating: rating || 'must-try',
      photos: photoList,
      note: note ? decodeURIComponent(note) : '',
      restaurantId: restaurantId || '',
      restaurantName: restaurantName ? decodeURIComponent(restaurantName) : ''
    });

    // 从数据库加载完整的菜品信息（包括标签）
    this.loadDishDetail();
  },

  // 加载菜品完整信息
  loadDishDetail() {
    const db = wx.cloud.database();
    db.collection('dishes')
      .doc(this.data.dishId)
      .get()
      .then(res => {
        this.setData({
          tags: res.data.tags || []
        });
      })
      .catch(err => {
        console.error('加载菜品详情失败', err);
      });
  },

  // 查看照片
  viewPhoto(e) {
    const { index } = e.currentTarget.dataset;
    wx.previewImage({
      urls: this.data.photos,
      current: this.data.photos[index]
    });
  },

  // 进入编辑模式
  onEdit() {
    this.setData({
      isEditing: true,
      editingName: this.data.dishName,
      editingRating: this.data.rating,
      editingNote: this.data.note,
      editingPhotoUrl: this.data.photos.length > 0 ? this.data.photos[0] : ''  // 新增
    });
  },

  // 编辑菜品名称（实时验证）
  onEditNameInput(e) {
    const value = validator.validateDishName(e.detail.value);
    this.setData({
      editingName: value
    });
  },

  // 编辑菜品笔记（实时验证）
  onEditNoteInput(e) {
    const value = validator.validateDishNote(e.detail.value);
    this.setData({
      editingNote: value
    });
  },

  // 编辑标签输入
  onEditTagsInput(e) {
    this.setData({
      editingTagsInput: e.detail.value
    });
  },

  // 选择编辑图片 - 智能压缩版
onChooseEditImage() {
  wx.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'],
    sizeType: ['compressed'],
    success: (res) => {
      const filePath = res.tempFilePaths[0];
      
      wx.getImageInfo({
        src: filePath,
        success: (info) => {
          const fileSizeMB = info.size / 1024 / 1024;
          
          if (fileSizeMB <= 2) {
            this.uploadEditImage(filePath);
            return;
          }
          
          wx.showLoading({ title: '处理中...' });
          wx.compressImage({
            src: filePath,
            quality: 70,
            success: (compressRes) => {
              wx.hideLoading();
              this.uploadEditImage(compressRes.tempFilePath);
            },
            fail: (err) => {
              wx.hideLoading();
              console.error('压缩失败', err);
              wx.showModal({
                title: '图片过大',
                content: '图片文件过大且压缩失败，请选择较小的图片',
                showCancel: false
              });
            }
          });
        }
      });
    }
  });
},

// 上传编辑图片 - 新增
uploadEditImage(filePath) {
  wx.showLoading({
    title: '上传中...',
    mask: true
  });
  
  const cloudPath = `dishes/${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`;
  
  wx.cloud.uploadFile({
    cloudPath: cloudPath,
    filePath: filePath,
    success: (res) => {
      // 删除旧图片（如果存在）
      if (this.data.editingPhotoUrl) {
        wx.cloud.deleteFile({
          fileList: [this.data.editingPhotoUrl],
          success: () => console.log('旧图片删除成功'),
          fail: (err) => console.error('旧图片删除失败', err)
        });
      }
      
      this.setData({
        editingPhotoUrl: res.fileID
      });
      wx.hideLoading();
      wx.showToast({
        title: '上传成功',
        icon: 'success',
        duration: 1500
      });
    },
    fail: (err) => {
      wx.hideLoading();
      console.error('上传失败', err);
      wx.showToast({
        title: '上传失败，请重试',
        icon: 'none'
      });
    }
  });
},

// 删除编辑照片 - 新增
onDeleteEditPhoto() {
  wx.showModal({
    title: '确认删除',
    content: '确定要删除这张照片吗？',
    success: (res) => {
      if (res.confirm) {
        const photoUrl = this.data.editingPhotoUrl;
        
        // 删除云存储文件
        if (photoUrl) {
          wx.cloud.deleteFile({
            fileList: [photoUrl],
            success: () => console.log('云存储文件删除成功'),
            fail: (err) => console.error('云存储文件删除失败', err)
          });
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

  // 选择编辑属性
  onEditRatingChange(e) {
    const { rating } = e.currentTarget.dataset;
    this.setData({
      editingRating: rating
    });
  },

  // 保存编辑
  onSave() {
    const { dishId, editingName, editingRating, editingNote, editingTagsInput, rating, restaurantId } = this.data;

    // 验证菜品名称
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

    // 验证菜品笔记（可选）
    if (editingNote && !validator.isEmpty(editingNote)) {
      if (!validator.isLengthValid(editingNote, 0, 50)) {
        wx.showToast({
          title: '菜品笔记不超过50字',
          icon: 'none'
        });
        return;
      }
    }

    // 处理标签（用空格分隔，过滤空标签）
    const editingTags = editingTagsInput
      .split(/\s+/)
      .filter(tag => tag.trim().length > 0)
      .slice(0, 5);  // 最多5个标签

    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    const db = wx.cloud.database();
    const _ = db.command;

    // 更新菜品
    db.collection('dishes')
      .doc(dishId)
      .update({
        data: {
          dishName: editingName.trim(),
          rating: editingRating,
          note: editingNote.trim(),
          tags: editingTags,
          photoUrl: this.data.editingPhotoUrl || ''  // 新增：保存照片URL
    }
  })

      .then(res => {
        // 如果属性改变了，需要更新餐厅统计
        if (rating !== editingRating) {
          const oldUpdate = rating === 'must-try' 
            ? { mustTryCount: _.inc(-1) }
            : { avoidCount: _.inc(-1) };
          const newUpdate = editingRating === 'must-try'
            ? { mustTryCount: _.inc(1) }
            : { avoidCount: _.inc(1) };

          return db.collection('restaurants')
            .doc(restaurantId)
            .update({
              data: {
                ...oldUpdate,
                ...newUpdate
              }
            });
        }
        return Promise.resolve();
      })
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1000
        });

        // 保存成功后自动返回餐厅详情页
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('保存失败', err);
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      });
  },

  // 取消编辑
  onCancel() {
    this.setData({
      isEditing: false,
      editingName: '',
      editingRating: '',
      editingNote: '',
      editingTagsInput: '',
      editingPhotoUrl: ''  // 新增
    });
  },

  // 删除菜品
  onDeleteDish() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这道菜吗？',
      confirmText: '删除',
      confirmColor: '#EF4444',
      success: res => {
        if (res.confirm) {
          this.performDelete();
        }
      }
    });
  },

  // 执行删除
  performDelete() {
    const { dishId, rating, restaurantId } = this.data;

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
        const updateData = rating === 'must-try' 
          ? { mustTryCount: _.inc(-1) }
          : { avoidCount: _.inc(-1) };

        return db.collection('restaurants')
          .doc(restaurantId)
          .update({
            data: updateData
          });
      })
      .then(res => {
        wx.hideLoading();
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
          title: '删除失败',
          icon: 'none'
        });
      });
  }
});
onShareDish()
onShareAppMessage()
