// pages/add-restaurant/add-restaurant.js
const validator = require('../../utils/validator');
const ImageHelper = require('../../utils/image-helper');

Page({
  data: {
    restaurantName: '',
    restaurantAddress: '',
    restaurantTags: '',
    dishes: [
      { name: '', rating: '', note: '', tags: '', photoUrl: '' },
      { name: '', rating: '', note: '', tags: '', photoUrl: '' },
      { name: '', rating: '', note: '', tags: '', photoUrl: '' }
    ],
    // 表单验证状态
    validation: {
      restaurantNameError: '',
      restaurantAddressError: ''
    }
  },

  // 餐厅名称输入（实时验证）
  onNameInput(e) {
    const value = validator.validateRestaurantName(e.detail.value);
    let error = '';

    if (value.length === 0) {
      error = ''; // 空值不显示错误
    } else if (!validator.isLengthValid(value, 1, 15)) {
      error = '餐厅名称为1-15字';
    }

    this.setData({
      restaurantName: value,
      'validation.restaurantNameError': error
    });
  },

  // 餐厅地址输入（实时验证）
  onAddressInput(e) {
    const value = validator.validateRestaurantAddress(e.detail.value);
    let error = '';

    if (value.length > 0 && !validator.isLengthValid(value, 2, 30)) {
      error = '餐厅地址为2-30字';
    }

    this.setData({
      restaurantAddress: value,
      'validation.restaurantAddressError': error
    });
  },

  // 餐厅标签输入
  onRestaurantTagsInput(e) {
    this.setData({
      restaurantTags: e.detail.value
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
    
    if (index === dishes.length - 1 && dishes[index].name.trim()) {
      dishes.push({
        name: '',
        rating: '',
        note: '',
        tags: '',
        photoUrl: ''
      });
      
      this.setData({ dishes });
      
      setTimeout(() => {
        wx.pageScrollTo({
          selector: `.dish-item:last-child`,
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

  // 选择菜品图片（使用统一工具类）
  onChooseDishImage(e) {
    const { index } = e.currentTarget.dataset;
    
    ImageHelper.chooseAndUpload({
      count: 1,
      onSuccess: (fileID) => {
        this.setData({
          [`dishes[${index}].photoUrl`]: fileID
        });
      }
    });
  },

  // 删除菜品照片（使用统一工具类）
  onDeleteDishPhoto(e) {
    const { index } = e.currentTarget.dataset;
    const dish = this.data.dishes[index];
    
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
          ImageHelper.deleteFile(photoUrl);
          
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

  // 保存（最终验证）
  onSave() {
    const { restaurantName, restaurantAddress, restaurantTags, dishes } = this.data;

    // 验证餐厅名称
    if (validator.isEmpty(restaurantName)) {
      wx.showToast({
        title: '请输入餐厅名称',
        icon: 'none'
      });
      return;
    }

    if (!validator.isLengthValid(restaurantName, 1, 15)) {
      wx.showToast({
        title: '餐厅名称为1-15字',
        icon: 'none'
      });
      return;
    }

    // 验证餐厅地址（可选）
    if (restaurantAddress && !validator.isEmpty(restaurantAddress)) {
      if (!validator.isLengthValid(restaurantAddress, 2, 30)) {
        wx.showToast({
          title: '餐厅地址为2-30字',
          icon: 'none'
        });
        return;
      }
    }

    // 处理餐厅标签
    const processedRestaurantTags = restaurantTags
      .split(/\s+/)
      .filter(tag => tag.trim().length > 0)
      .slice(0, 5);

    // 过滤有效菜品
    const validDishes = [];
    for (let i = 0; i < dishes.length; i++) {
      const d = dishes[i];
      if (!d.name.trim()) continue;
      
      if (!validator.isLengthValid(d.name, 1, 20)) {
        wx.showToast({
          title: `菜品${i + 1}名称为1-20字`,
          icon: 'none'
        });
        return;
      }
      
      if (!d.rating || (d.rating !== 'must-try' && d.rating !== 'avoid')) {
        wx.showToast({
          title: `请为菜品${i + 1}选择必点或避坑`,
          icon: 'none'
        });
        return;
      }
      
      if (d.note && !validator.isEmpty(d.note)) {
        if (!validator.isLengthValid(d.note, 0, 50)) {
          wx.showToast({
            title: `菜品${i + 1}笔记不超过50字`,
            icon: 'none'
          });
          return;
        }
      }
      
      validDishes.push(d);
    }

    // 开始保存
    this.saveData(restaurantName, restaurantAddress, processedRestaurantTags, validDishes);
  },

  /**
   * 保存数据到数据库
   */
  saveData(restaurantName, restaurantAddress, restaurantTags, validDishes) {
    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    const db = wx.cloud.database();
    const _ = db.command;
    let restaurantId = '';

    // 1. 保存餐厅
    db.collection('restaurants')
      .add({
        data: {
          name: restaurantName.trim(),
          address: restaurantAddress.trim() || '',
          tags: restaurantTags,
          mustTryCount: 0,
          avoidCount: 0,
          createTime: db.serverDate()
        }
      })
      .then(res => {
        restaurantId = res._id;
        
        // 2. 批量保存菜品
        if (validDishes.length > 0) {
          const dishPromises = validDishes.map(dish => {
            const dishTags = dish.tags
              .split(/\s+/)
              .filter(tag => tag.trim().length > 0)
              .slice(0, 5);

            return db.collection('dishes').add({
              data: {
                dishName: dish.name.trim(),
                rating: dish.rating,
                note: dish.note.trim() || '',
                tags: dishTags,
                photoUrl: dish.photoUrl || '',
                restaurantId: restaurantId,
                createTime: db.serverDate()
              }
            });
          });
          
          return Promise.all(dishPromises);
        }
        
        return Promise.resolve([]);
      })
      .then(dishResults => {
        // 3. 更新餐厅统计
        if (validDishes.length > 0) {
          const mustTryCount = validDishes.filter(d => d.rating === 'must-try').length;
          const avoidCount = validDishes.filter(d => d.rating === 'avoid').length;
          
          return db.collection('restaurants')
            .doc(restaurantId)
            .update({
              data: {
                mustTryCount: mustTryCount,
                avoidCount: avoidCount
              }
            });
        }
        
        return Promise.resolve();
      })
      .then(res => {
        wx.hideLoading();
        
        // 清除缓存
        const app = getApp();
        app.clearCache();
        
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1000
        });

        setTimeout(() => {
          wx.redirectTo({
            url: `/pages/restaurant/restaurant?id=${restaurantId}&name=${encodeURIComponent(restaurantName.trim())}`
          });
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
