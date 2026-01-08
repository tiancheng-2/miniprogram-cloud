// pages/edit-restaurant/edit-restaurant.js
const validator = require('../../utils/validator');

Page({
  data: {
    restaurantId: '',
    restaurantName: '',
    restaurantAddress: '',
    restaurantTags: '',  // 标签输入字符串
    showDeleteModal: false
  },

  onLoad(options) {
    const { id, name, address } = options;

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

    this.setData({
      restaurantId: id,
      restaurantName: decodeURIComponent(name || ''),
      restaurantAddress: address ? decodeURIComponent(address) : ''
    });

    // 从数据库加载完整信息（包括标签）
    this.loadRestaurantDetail();
  },

  // 加载餐厅完整信息
  loadRestaurantDetail() {
    const db = wx.cloud.database();
    db.collection('restaurants')
      .doc(this.data.restaurantId)
      .get()
      .then(res => {
        const tags = res.data.tags || [];
        this.setData({
          restaurantTags: tags.join(' ')  // 标签数组转为字符串
        });
      })
      .catch(err => {
        console.error('加载餐厅详情失败', err);
      });
  },

  // 餐厅名称输入（实时验证）
  onNameInput(e) {
    const value = validator.validateRestaurantName(e.detail.value);
    this.setData({
      restaurantName: value
    });
  },

  // 餐厅地址输入（实时验证）
  onAddressInput(e) {
    const value = validator.validateRestaurantAddress(e.detail.value);
    this.setData({
      restaurantAddress: value
    });
  },

  // 标签输入
  onTagsInput(e) {
    this.setData({
      restaurantTags: e.detail.value
    });
  },

  // 取消
  onCancel() {
    wx.navigateBack();
  },

  // 保存
  onSave() {
    const { restaurantId, restaurantName, restaurantAddress, restaurantTags } = this.data;

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

    // 处理标签
    const processedTags = restaurantTags
      .split(/\s+/)
      .filter(tag => tag.trim().length > 0)
      .slice(0, 5);  // 最多5个标签

    wx.showLoading({
      title: '保存中...',
      mask: true
    });

    const db = wx.cloud.database();

    db.collection('restaurants')
      .doc(restaurantId)
      .update({
        data: {
          name: restaurantName.trim(),
          address: restaurantAddress.trim() || '',
          tags: processedTags
        }
      })
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1500
        });

        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
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

  // 显示删除确认弹窗
  onShowDeleteModal() {
    this.setData({
      showDeleteModal: true
    });
  },

  // 隐藏删除确认弹窗
  onHideDeleteModal() {
    this.setData({
      showDeleteModal: false
    });
  },

  // 防止点击穿透
  doNothing() {},

  // 确认删除
  onConfirmDelete() {
    const { restaurantId } = this.data;

    wx.showLoading({
      title: '删除中...',
      mask: true
    });

    const db = wx.cloud.database();

    // 先删除该餐厅的所有菜品
    db.collection('dishes')
      .where({
        restaurantId: restaurantId
      })
      .remove()
      .then(res => {
        // 再删除餐厅
        return db.collection('restaurants')
          .doc(restaurantId)
          .remove();
      })
      .then(res => {
        wx.hideLoading();
        wx.showToast({
          title: '删除成功',
          icon: 'success',
          duration: 1500
        });

        setTimeout(() => {
          wx.navigateBack({ delta: 2 }); // 返回两级到首页
        }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('删除失败', err);
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        });
        this.setData({
          showDeleteModal: false
        });
      });
  }
});
