// pages/add-dishes/add-dishes.js
const restaurantService = require('../../services/restaurantService');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 餐厅ID
    restaurantId: '',

    // 餐厅名称
    restaurantName: '',

    // 菜品列表（默认一个空菜品）
    dishes: [
      { name: '', isRecommended: false }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('[AddDishes] Page loaded with options:', options);

    const { id, name } = options;

    if (!id) {
      wx.showToast({
        title: '缺少餐厅ID',
        icon: 'none',
        duration: 2000
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 2000);

      return;
    }

    this.setData({
      restaurantId: id,
      restaurantName: decodeURIComponent(name || '餐厅')
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('[AddDishes] Page show');
  },

  // ==================== Dish Interactions ====================

  /**
   * 添加新菜品
   */
  onAddDish() {
    const dishes = this.data.dishes;

    // 添加新的空菜品
    dishes.push({
      name: '',
      isRecommended: false
    });

    this.setData({ dishes });

    // 震动反馈
    wx.vibrateShort({
      type: 'medium'
    });

    console.log('[AddDishes] Add dish, total:', dishes.length);
  },

  /**
   * 删除菜品
   */
  onDeleteDish(e) {
    const { index } = e.currentTarget.dataset;
    const dishes = this.data.dishes;

    // 确保至少保留一个菜品
    if (dishes.length <= 1) {
      wx.showToast({
        title: '至少保留一个菜品',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    // 删除指定索引的菜品
    dishes.splice(index, 1);

    this.setData({ dishes });

    // 震动反馈
    wx.vibrateShort({
      type: 'medium'
    });

    console.log('[AddDishes] Delete dish at index:', index, 'remaining:', dishes.length);
  },

  /**
   * 切换菜品推荐状态
   */
  onToggleRecommend(e) {
    const { index } = e.currentTarget.dataset;
    const { value } = e.detail;
    const dishes = this.data.dishes;

    dishes[index].isRecommended = value;

    this.setData({ dishes });

    console.log('[AddDishes] Toggle recommend:', index, value);
  },

  // ==================== Save ====================

  /**
   * 保存数据
   */
  async onSave() {
    const { restaurantId, dishes } = this.data;

    // 过滤掉空菜品
    const validDishes = dishes.filter(dish => dish.name && dish.name.trim().length > 0);

    if (validDishes.length === 0) {
      wx.showToast({
        title: '请至少添加一道菜品',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 构建提交数据
    const dishesData = validDishes.map(dish => ({
      dishName: dish.name.trim(),
      rating: dish.isRecommended ? 'must-try' : 'avoid'
    }));

    console.log('[AddDishes] Saving dishes:', restaurantId, dishesData);

    try {
      // 显示加载提示
      wx.showLoading({
        title: '保存中...',
        mask: true
      });

      // 调用服务批量添加菜品
      const addedCount = await restaurantService.batchCreateDishes(restaurantId, dishesData);

      wx.hideLoading();

      console.log('[AddDishes] Added count:', addedCount);

      // 震动反馈
      wx.vibrateShort({
        type: 'heavy'
      });

      // 显示成功提示
      wx.showToast({
        title: `成功添加 ${addedCount} 道菜品`,
        icon: 'success',
        duration: 1500
      });

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack({
          delta: 1
        });
      }, 1500);

    } catch (error) {
      console.error('[AddDishes] Save failed:', error);

      wx.hideLoading();

      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '添加菜品 - 味觉空间',
      path: '/pages/add-dishes/add-dishes'
    };
  }
});
