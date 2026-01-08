// pages/add-dishes/add-dishes.js
const validator = require('../../utils/validator');

Page({
  data: {
    restaurantId: '',
    restaurantName: '',
    dishes: [
      { name: '', rating: '', note: '', tags: '', photoUrl: '' },
      { name: '', rating: '', note: '', tags: '', photoUrl: '' },
      { name: '', rating: '', note: '', tags: '', photoUrl: '' }
    ]
  },

  onLoad(options) {
    const restaurantId = options.restaurantId || '';
    const restaurantName = decodeURIComponent(options.restaurantName || '');

    if (!restaurantId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({
      restaurantId: restaurantId,
      restaurantName: restaurantName
    });
  },

  // 菜品名称输入
  onDishNameInput(e) {
    const { index } = e.currentTarget.dataset;
    const value = validator.validateDishName(e.detail.value);
    this.setData({
      [`dishes[${index}].name`]: value
    });
  },

  // 菜品名称失焦 - 智能扩展
  onDishNameBlur(e) {
    const { index } = e.currentTarget.dataset;
    const dishes = this.data.dishes;
    
    // 如果是最后一个菜品，且已填写名称
    if (index === dishes.length - 1 && dishes[index].name.trim()) {
      // 自动添加新的空白菜品位置
      dishes.push({
        name: '',
        rating: '',
        note: '',
        tags: '',
        photoUrl: ''
      });
      
      this.setData({ dishes });
      
      // 自动滚动到新位置
      setTimeout(() => {
        wx.pageScrollTo({
          selector: `.dish-form-${dishes.length - 1}`,
          duration: 300
        });
      }, 100);
    }
  },

  // 选择评分
  onSelectRating(e) {
    const { index, rating } = e.currentTarget.dataset;
    this.setData({
      [`dishes[${index}].rating`]: rating
    });
  },

  // 菜品笔记输入
  onDishNoteInput(e) {
    const { index } = e.currentTarget.dataset;
    const value = validator.validateDishNote(e.detail.value);
    this.setData({
      [`dishes[${index}].note`]: value
    });
  },

  // 菜品标签输入
  onDishTagsInput(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({
      [`dishes[${index}].tags`]: e.detail.value
    });
  },

  // 选择图片 - 智能压缩版
onChooseImage(e) {
  const { index } = e.currentTarget.dataset;
  
  wx.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'],
    sizeType: ['compressed'],
    success: (res) => {
      const filePath = res.tempFilePaths[0];
      
      // 获取图片信息
      wx.getImageInfo({
        src: filePath,
        success: (info) => {
          const fileSizeMB = info.size / 1024 / 1024;
          
          // 如果小于3MB，直接上传
          if (fileSizeMB <= 2) {
            this.uploadImage(filePath, index);
            return;
          }
          
          // 如果大于2MB，先压缩
          wx.showLoading({ title: '处理中...' });
          wx.compressImage({
            src: filePath,
            quality: 70,
            success: (compressRes) => {
              wx.hideLoading();
              this.uploadImage(compressRes.tempFilePath, index);
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
        },
        fail: (err) => {
          console.error('获取图片信息失败', err);
        }
      });
    },
    fail: (err) => {
      console.error('选择图片失败', err);
      wx.showToast({
        title: '选择图片失败',
        icon: 'none'
      });
    }
  });
},

  // 上传图片到云存储
  uploadImage(filePath, index) {
    wx.showLoading({
      title: '上传中...',
      mask: true
    });
    
    const cloudPath = `dishes/${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`;
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: (res) => {
        this.setData({
          [`dishes[${index}].photoUrl`]: res.fileID
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

  // 删除照片 - 修复：添加数据有效性检查
  onDeletePhoto(e) {
    const { index } = e.currentTarget.dataset;
    const dish = this.data.dishes[index];
    
    // 修复：检查 dish 是否存在
    if (!dish) {
      console.error('菜品数据不存在', index);
      return;
    }
    
    const photoUrl = dish.photoUrl;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          // 删除云存储文件（失败不影响本地删除）
          if (photoUrl) {
            wx.cloud.deleteFile({
              fileList: [photoUrl],
              success: () => {
                console.log('云存储文件删除成功');
              },
              fail: (err) => {
                console.error('云存储文件删除失败', err);
              }
            });
          }
          
          // 清除本地数据
          this.setData({
            [`dishes[${index}].photoUrl`]: ''
          });
          
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 取消
  onCancel() {
    wx.navigateBack();
  },

  // 保存
  onSave() {
    const { restaurantId, dishes } = this.data;

    // 过滤有效菜品（名称不为空）
    const validDishes = dishes.filter(d => {
      if (!d.name.trim()) return false;
      
      // 验证菜品名称
      if (!validator.isLengthValid(d.name, 1, 20)) {
        wx.showToast({
          title: '菜品名称为1-20字',
          icon: 'none'
        });
        return false;
      }
      
      // 验证必须选择评分
      if (!d.rating || (d.rating !== 'must-try' && d.rating !== 'avoid')) {
        wx.showToast({
          title: '请选择必点或避坑',
          icon: 'none'
        });
        return false;
      }
      
      // 验证菜品笔记
      if (d.note && !validator.isEmpty(d.note)) {
        if (!validator.isLengthValid(d.note, 0, 50)) {
          wx.showToast({
            title: '菜品笔记不超过50字',
            icon: 'none'
          });
          return false;
        }
      }
      
      return true;
    });

    // 至少要添加一个菜品
    if (validDishes.length === 0) {
      wx.showToast({
        title: '请至少添加一道菜品',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    const db = wx.cloud.database();
    const _ = db.command;

    // 批量保存菜品
    const dishPromises = validDishes.map(dish => {
      // 处理菜品标签
      const dishTags = dish.tags
        .split(/\s+/)
        .filter(tag => tag.trim().length > 0)
        .slice(0, 5);  // 最多5个标签

      return db.collection('dishes').add({
        data: {
          dishName: dish.name.trim(),
          rating: dish.rating,
          note: dish.note.trim() || '',
          tags: dishTags,  // 保存菜品标签
          photoUrl: dish.photoUrl || '',  // 添加这行
          restaurantId: restaurantId,
          createTime: db.serverDate()
        }
      });
    });

    Promise.all(dishPromises)
      .then(results => {
        // 更新餐厅统计
        const mustTryCount = validDishes.filter(d => d.rating === 'must-try').length;
        const avoidCount = validDishes.filter(d => d.rating === 'avoid').length;
        
        return db.collection('restaurants')
          .doc(restaurantId)
          .update({
            data: {
              mustTryCount: _.inc(mustTryCount),
              avoidCount: _.inc(avoidCount)
            }
          });
      })
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1000
        });

        // 返回餐厅详情页
        setTimeout(() => {
          wx.navigateBack();
        }, 1000);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('保存失败', err);
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
      });
  }
});
