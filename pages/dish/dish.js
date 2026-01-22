// pages/dish/dish.js
const restaurantService = require('../../services/restaurantService');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 菜品ID
    dishId: '',

    // 餐厅ID
    restaurantId: '',

    // 餐厅名称
    restaurantName: '',

    // 菜品详情
    dish: {},

    // 加载状态
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('[Dish] Page loaded with options:', options);

    const { id, restaurantId, restaurantName } = options;

    if (!id) {
      wx.showToast({
        title: '缺少菜品ID',
        icon: 'none',
        duration: 2000
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 2000);

      return;
    }

    this.setData({
      dishId: id,
      restaurantId: restaurantId || '',
      restaurantName: decodeURIComponent(restaurantName || '餐厅')
    });

    this.loadDishData(id);
  },

  /**
   * 加载菜品数据
   */
  async loadDishData(id) {
    try {
      this.setData({ loading: true });

      // 获取菜品详情
      const dish = await restaurantService.getDishDetail(id);

      console.log('[Dish] Dish loaded:', dish);

      this.setData({
        dish,
        loading: false
      });

    } catch (error) {
      console.error('[Dish] Load failed:', error);

      this.setData({ loading: false });

      wx.showToast({
        title: '加载失败',
        icon: 'none',
        duration: 2000
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('[Dish] Page show');
  },

  /**
   * 跳转到餐厅详情
   */
  onNavigateToRestaurant() {
    const { restaurantId, restaurantName } = this.data;

    if (!restaurantId) {
      return;
    }

    console.log('[Dish] Navigate to restaurant:', restaurantId);

    wx.vibrateShort({ type: 'light' });

    wx.navigateTo({
      url: `/pages/detail/index?id=${restaurantId}&name=${encodeURIComponent(restaurantName)}`
    });
  },

  /**
   * 编辑菜品
   */
  onEdit() {
    console.log('[Dish] Edit dish');

    wx.vibrateShort({ type: 'light' });

    wx.showToast({
      title: '编辑功能开发中',
      icon: 'none',
      duration: 1500
    });

    // TODO: 实现编辑功能
    // wx.navigateTo({
    //   url: `/pages/edit-dish/edit-dish?id=${this.data.dishId}`
    // });
  },

  /**
   * 删除菜品
   */
  onDelete() {
    const { dishId, dish } = this.data;

    console.log('[Dish] Delete dish:', dishId);

    wx.vibrateShort({ type: 'medium' });

    wx.showModal({
      title: '确认删除',
      content: `确定要删除菜品"${dish.dishName || dish.name}"吗？`,
      confirmText: '删除',
      confirmColor: '#FF3B30',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          await this.deleteDish(dishId);
        }
      }
    });
  },

  /**
   * 执行删除操作
   */
  async deleteDish(id) {
    try {
      wx.showLoading({
        title: '删除中...',
        mask: true
      });

      await restaurantService.deleteDish(id);

      wx.hideLoading();

      console.log('[Dish] Deleted successfully');

      wx.vibrateShort({ type: 'heavy' });

      wx.showToast({
        title: '删除成功',
        icon: 'success',
        duration: 1500
      });

      setTimeout(() => {
        wx.navigateBack({
          delta: 1
        });
      }, 1500);

    } catch (error) {
      console.error('[Dish] Delete failed:', error);

      wx.hideLoading();

      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  /**
   * 下拉刷新
   */
  async onPullDownRefresh() {
    console.log('[Dish] Pull down refresh');

    await this.loadDishData(this.data.dishId);

    wx.stopPullDownRefresh();

    wx.showToast({
      title: '刷新成功',
      icon: 'success',
      duration: 1500
    });
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    const { dish } = this.data;

    return {
      title: `${dish.dishName || dish.name} - 味觉空间`,
      path: `/pages/dish/dish?id=${this.data.dishId}`,
      imageUrl: dish.photoUrl || 'https://placehold.co/400x400/FDFCFB/2C3E50?text=Taste+Space'
    };
  }
});
