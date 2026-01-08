// pages/add-restaurant/add-restaurant.js
const validator = require('../../utils/validator');

Page({
  data: {
    restaurantName: '',
    restaurantAddress: '',
    restaurantTags: '',  // 餐厅标签输入字符串
    dishes: [
      { name: '', rating: '', note: '', tags: '' },  // 默认不选中，增加tags字段
      { name: '', rating: '', note: '', tags: '' },
      { name: '', rating: '', note: '', tags: '' }
    ]
  },

  // 餐厅名称输入
  onNameInput(e) {
    const value = validator.validateRestaurantName(e.detail.value);
    this.setData({
      restaurantName: value
    });
  },

  // 餐厅地址输入
  onAddressInput(e) {
    const value = validator.validateRestaurantAddress(e.detail.value);
    this.setData({
      restaurantAddress: value
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
    
    // 如果是最后一个菜品，且已填写名称
    if (index === dishes.length - 1 && dishes[index].name.trim()) {
      // 自动添加新的空白菜品位置
      dishes.push({
        name: '',
        rating: '',  // 默认不选中
        note: '',
        tags: ''
      });
      
      this.setData({ dishes });
      
      // 自动滚动到新位置
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

  // 取消
  onCancel() {
    wx.navigateBack();
  },

  // 保存
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
      .slice(0, 5);  // 最多5个标签

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
          tags: processedRestaurantTags,  // 保存餐厅标签
          mustTryCount: 0,
          avoidCount: 0,
          createTime: db.serverDate()
        }
      })
      .then(res => {
        restaurantId = res._id;
        
        // 2. 如果有菜品，批量保存
        if (validDishes.length > 0) {
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
                photoUrl: '',
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
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1000
        });

        // 跳转到餐厅详情页
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
