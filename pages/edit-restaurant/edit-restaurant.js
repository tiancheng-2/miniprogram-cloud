// pages/edit-restaurant/edit-restaurant.js
const restaurantService = require('../../services/restaurantService');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 餐厅ID
    restaurantId: '',

    // 餐厅名称
    name: '',

    // 标签（预设 + 选中状态）
    tags: [
      { label: 'Lunch', selected: false },
      { label: 'Dinner', selected: false },
      { label: 'Cafe', selected: false },
      { label: 'Date', selected: false },
      { label: 'Cheap', selected: false },
      { label: 'Fancy', selected: false }
    ],

    // 加载状态
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('[EditRestaurant] Page loaded with options:', options);

    const { id } = options;

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

    this.setData({ restaurantId: id });
    this.loadRestaurantData(id);
  },

  /**
   * 加载餐厅数据
   */
  async loadRestaurantData(id) {
    try {
      this.setData({ loading: true });

      // 获取餐厅详情
      const restaurant = await restaurantService.getRestaurantDetail(id);

      console.log('[EditRestaurant] Restaurant loaded:', restaurant);

      // 更新标签选中状态
      const tags = this.data.tags.map(tag => ({
        ...tag,
        selected: restaurant.tags && restaurant.tags.includes(tag.label)
      }));

      this.setData({
        name: restaurant.name || '',
        tags,
        loading: false
      });

    } catch (error) {
      console.error('[EditRestaurant] Load failed:', error);

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
    console.log('[EditRestaurant] Page show');
  },

  // ==================== Tag Interactions ====================

  /**
   * 切换标签选中状态
   */
  onToggleTag(e) {
    const { index } = e.currentTarget.dataset;
    const tags = this.data.tags;

    // 切换选中状态
    tags[index].selected = !tags[index].selected;

    this.setData({ tags });

    // 震动反馈
    wx.vibrateShort({
      type: 'light'
    });

    console.log('[EditRestaurant] Toggle tag:', tags[index].label, tags[index].selected);
  },

  // ==================== Save ====================

  /**
   * 保存数据
   */
  async onSave() {
    const { restaurantId, name, tags } = this.data;

    // 验证餐厅名称
    if (!name || name.trim().length === 0) {
      wx.showToast({
        title: '请输入餐厅名称',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 提取选中的标签
    const selectedTags = tags
      .filter(tag => tag.selected)
      .map(tag => tag.label);

    // 构建更新数据
    const updateData = {
      name: name.trim(),
      tags: selectedTags
    };

    console.log('[EditRestaurant] Updating restaurant:', restaurantId, updateData);

    try {
      // 显示加载提示
      wx.showLoading({
        title: '保存中...',
        mask: true
      });

      // 调用服务更新餐厅
      await restaurantService.updateRestaurant(restaurantId, updateData);

      wx.hideLoading();

      // 震动反馈
      wx.vibrateShort({
        type: 'heavy'
      });

      // 显示成功提示
      wx.showToast({
        title: '保存成功',
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
      console.error('[EditRestaurant] Save failed:', error);

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
      title: '编辑餐厅 - 味觉空间',
      path: '/pages/edit-restaurant/edit-restaurant'
    };
  }
});
