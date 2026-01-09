// utils/api.js
// 统一云函数接口调用封装

/**
 * 调用云函数
 * @param {string} name - 云函数名称 (restaurant/dish)
 * @param {string} action - 操作类型 (add/update/delete/list/detail)
 * @param {object} params - 参数对象
 * @returns {Promise} 返回 {code, msg, data}
 */
function callApi(name, action, params = {}) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data: { action, params },
      success: res => {
        const result = res.result || {}
        if (result.code === 0) {
          resolve(result)
        } else {
          wx.showToast({
            title: result.msg || '操作失败',
            icon: 'none'
          })
          reject(result)
        }
      },
      fail: err => {
        console.error(`云函数调用失败[${name}.${action}]:`, err)
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

// ==================== 餐厅相关接口 ====================

/**
 * 新增餐厅
 * @param {object} data - {name, address, tags}
 */
function addRestaurant(data) {
  return callApi('restaurant', 'add', data)
}

/**
 * 更新餐厅
 * @param {string} id - 餐厅ID
 * @param {object} data - {name, address, tags}
 */
function updateRestaurant(id, data) {
  return callApi('restaurant', 'update', { id, ...data })
}

/**
 * 删除餐厅
 * @param {string} id - 餐厅ID
 */
function deleteRestaurant(id) {
  return callApi('restaurant', 'delete', { id })
}

/**
 * 获取餐厅列表
 * @param {object} params - {keyword, limit}
 */
function getRestaurantList(params = {}) {
  return callApi('restaurant', 'list', params)
}

/**
 * 获取餐厅详情
 * @param {string} id - 餐厅ID
 */
function getRestaurantDetail(id) {
  return callApi('restaurant', 'detail', { id })
}

// ==================== 菜品相关接口 ====================

/**
 * 新增单个菜品
 * @param {object} data - {restaurantId, dishName, rating, note, tags, photoUrl}
 */
function addDish(data) {
  return callApi('dish', 'add', data)
}

/**
 * 批量新增菜品
 * @param {string} restaurantId - 餐厅ID
 * @param {array} dishes - 菜品数组
 */
function batchAddDishes(restaurantId, dishes) {
  return callApi('dish', 'batchAdd', { restaurantId, dishes })
}

/**
 * 更新菜品
 * @param {string} id - 菜品ID
 * @param {object} data - {dishName, rating, note, tags, photoUrl}
 */
function updateDish(id, data) {
  return callApi('dish', 'update', { id, ...data })
}

/**
 * 删除菜品
 * @param {string} id - 菜品ID
 */
function deleteDish(id) {
  return callApi('dish', 'delete', { id })
}

/**
 * 获取菜品列表
 * @param {object} params - {restaurantId, rating, keyword, limit}
 */
function getDishList(params = {}) {
  return callApi('dish', 'list', params)
}

/**
 * 获取菜品详情
 * @param {string} id - 菜品ID
 */
function getDishDetail(id) {
  return callApi('dish', 'detail', { id })
}

/**
 * 更新餐厅菜品统计
 * @param {string} restaurantId - 餐厅ID
 */
function updateRestaurantDishCount(restaurantId) {
  return callApi('dish', 'updateRestaurantCount', { restaurantId })
}

// ==================== 导出接口 ====================

module.exports = {
  // 通用
  callApi,
  
  // 餐厅
  addRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantList,
  getRestaurantDetail,
  
  // 菜品
  addDish,
  batchAddDishes,
  updateDish,
  deleteDish,
  getDishList,
  getDishDetail,
  updateRestaurantDishCount
}
