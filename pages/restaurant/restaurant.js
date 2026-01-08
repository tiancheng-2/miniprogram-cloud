// pages/restaurant/restaurant.js - 添加分享功能

Page({
  data: {
    restaurantId: '',
    restaurantName: '',
    restaurantAddress: '',
    restaurantTags: [],
    currentFilter: 'all',
    mustTryDishes: [],
    avoidDishes: [],
  },

  onLoad(options) {
    const id = options.id || '';
    const name = decodeURIComponent(options.name || '');

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
      restaurantName: name
    });

    this.loadRestaurantDetail();
    this.loadDishes();
  },

  loadRestaurantDetail() {
    const db = wx.cloud.database();
    db.collection('restaurants')
      .doc(this.data.restaurantId)
      .get()
      .then(res => {
        this.setData({
          restaurantAddress: res.data.address || '',
          restaurantTags: res.data.tags || []
        });
      })
      .catch(err => {
        console.error('加载餐厅详情失败', err);
      });
  },

  loadDishes() {
    const db = wx.cloud.database();
    db.collection('dishes')
      .where({
        restaurantId: this.data.restaurantId
      })
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        const dishes = res.data.map(item => {
          return {
            ...item,
            dishChar: this.getDishChar(item.dishName)
          };
        });

        const mustTry = dishes.filter(dish => dish.rating === 'must-try');
        const avoid = dishes.filter(dish => dish.rating === 'avoid');

        this.setData({
          mustTryDishes: mustTry,
          avoidDishes: avoid
        });
      })
      .catch(err => {
        console.error('加载菜品失败', err);
      });
  },

  getDishChar(name) {
    if (!name) return '菜';
    return name.charAt(0);
  },

  onBack() {
    wx.navigateBack();
  },

  goToAddDishes() {
    const { restaurantId, restaurantName } = this.data;
    wx.navigateTo({
      url: `/pages/add-dishes/add-dishes?restaurantId=${restaurantId}&restaurantName=${encodeURIComponent(restaurantName)}`
    });
  },

  onFilterChange(e) {
    const { filter } = e.currentTarget.dataset;
    this.setData({
      currentFilter: filter
    });
  },

  onViewDish(e) {
    const { id, name, rating, photo, note } = e.currentTarget.dataset;
    const { restaurantId, restaurantName } = this.data;
    
    wx.navigateTo({
      url: `/pages/dish/dish?id=${id}&name=${encodeURIComponent(name)}&rating=${rating}&photos=${encodeURIComponent(photo || '')}&note=${encodeURIComponent(note || '')}&restaurantId=${restaurantId}&restaurantName=${encodeURIComponent(restaurantName)}`
    });
  },

  onEditRestaurant() {
    const { restaurantId, restaurantName, restaurantAddress } = this.data;
    wx.navigateTo({
      url: `/pages/edit-restaurant/edit-restaurant?id=${restaurantId}&name=${encodeURIComponent(restaurantName)}&address=${encodeURIComponent(restaurantAddress)}`
    });
  },

  onShow() {
    if (this.data.restaurantId) {
      this.loadDishes();
    }
  },

  /**
   * 分享功能 - 跳转到海报页
   */
  onShareAppMessage() {
    return {
      title: `推荐${this.data.restaurantName}，这些菜必点！`,
      path: `/pages/share-poster/share-poster?id=${this.data.restaurantId}`,
      imageUrl: '' // 使用页面截图
    };
  }
});
