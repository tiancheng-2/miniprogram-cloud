// pages/add-dishes/add-dishes.js
const validator = require('../../utils/validator');
const ImageHelper = require('../../utils/image-helper');

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

  // 选择图片（使用统一工具类）
  onChooseImage(e) {
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

  // 删除照片（使用统一工具类）
  onDeletePhoto(e) {
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

  // 保存
  onSave() {
    const { restaurantId, dishes } = this.data;

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
        
        // 清除缓存
        const app = getApp();
        app.clearCache();
        
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1000
        });

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
