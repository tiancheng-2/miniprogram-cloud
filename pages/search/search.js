// pages/search/search.js
const { debounce } = require('../../utils/debounce');

Page({
  data: {
    searchKeyword: '',
    restaurantResults: [],
    dishResults: [],
    hasResults: false,
    isSearching: false,  // 搜索中状态
    hasSearched: false   // 是否已搜索过
  },

  onLoad() {
    // 创建防抖搜索函数
    this.debouncedSearch = debounce(this.performSearch.bind(this), 500);
  },

  /**
   * 搜索输入（防抖处理）
   */
  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({
      searchKeyword: keyword
    });

    if (keyword) {
      // 显示搜索中状态
      this.setData({ isSearching: true });
      // 防抖执行搜索
      this.debouncedSearch(keyword);
    } else {
      // 清空结果
      this.setData({
        restaurantResults: [],
        dishResults: [],
        hasResults: false,
        isSearching: false,
        hasSearched: false
      });
    }
  },

  /**
   * 执行搜索
   */
  performSearch(keyword) {
    const db = wx.cloud.database();

    Promise.all([
      // 搜索餐厅名称
      db.collection('restaurants')
        .where({
          name: db.RegExp({
            regexp: keyword,
            options: 'i'
          })
        })
        .limit(20)  // 限制结果数量
        .get(),
      
      // 搜索餐厅地址
      db.collection('restaurants')
        .where({
          address: db.RegExp({
            regexp: keyword,
            options: 'i'
          })
        })
        .limit(20)
        .get(),
      
      // 搜索菜品
      db.collection('dishes')
        .where({
          dishName: db.RegExp({
            regexp: keyword,
            options: 'i'
          })
        })
        .limit(20)
        .get()
    ])
    .then(results => {
      const [restaurantNameRes, restaurantAddressRes, dishRes] = results;

      // 合并餐厅结果（去重）
      const restaurantMap = {};
      
      restaurantNameRes.data.forEach(item => {
        restaurantMap[item._id] = {
          type: 'restaurant',
          id: item._id,
          name: item.name,
          address: item.address || ''
        };
      });
      
      restaurantAddressRes.data.forEach(item => {
        restaurantMap[item._id] = {
          type: 'restaurant',
          id: item._id,
          name: item.name,
          address: item.address || ''
        };
      });

      const restaurants = Object.values(restaurantMap);

      // 处理菜品结果
      const dishIds = dishRes.data.map(d => d.restaurantId);
      
      if (dishIds.length > 0) {
        // 获取餐厅信息
        const _ = db.command;
        return db.collection('restaurants')
          .where({
            _id: _.in(dishIds)
          })
          .get()
          .then(restaurantRes => {
            const restaurantNameMap = {};
            restaurantRes.data.forEach(r => {
              restaurantNameMap[r._id] = r.name;
            });

            const dishes = dishRes.data.map(item => ({
              type: 'dish',
              id: item._id,
              name: item.dishName,
              rating: item.rating,
              photoUrl: item.photoUrl || '',
              note: item.note || '',
              restaurantId: item.restaurantId,
              restaurantName: restaurantNameMap[item.restaurantId] || '未知餐厅'
            }));

            return { restaurants, dishes };
          });
      } else {
        return { restaurants, dishes: [] };
      }
    })
    .then(data => {
      this.setData({
        restaurantResults: data.restaurants,
        dishResults: data.dishes,
        hasResults: data.restaurants.length > 0 || data.dishes.length > 0,
        isSearching: false,
        hasSearched: true
      });
    })
    .catch(err => {
      console.error('搜索失败', err);
      this.setData({
        isSearching: false,
        hasSearched: true
      });
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      });
    });
  },

  /**
   * 选择结果
   */
  onSelectResult(e) {
    const { type, id, name, rating, photo, note, restaurantId, restaurantName } = e.currentTarget.dataset;

    if (type === 'restaurant') {
      // 跳转到餐厅详情页
      wx.navigateTo({
        url: `/pages/restaurant/restaurant?id=${id}&name=${encodeURIComponent(name)}`
      });
    } else if (type === 'dish') {
      // 跳转到菜品详情页
      wx.navigateTo({
        url: `/pages/dish/dish?id=${id}&name=${encodeURIComponent(name)}&rating=${rating}&photos=${encodeURIComponent(photo || '')}&note=${encodeURIComponent(note || '')}&restaurantId=${restaurantId}&restaurantName=${encodeURIComponent(restaurantName)}`
      });
    }
  }
});
