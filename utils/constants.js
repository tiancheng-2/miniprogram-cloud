// utils/constants.js - 全局常量配置

module.exports = {
  // 输入长度限制
  INPUT_LENGTH: {
    RESTAURANT_NAME_MIN: 1,
    RESTAURANT_NAME_MAX: 15,
    RESTAURANT_ADDRESS_MIN: 2,
    RESTAURANT_ADDRESS_MAX: 30,
    DISH_NAME_MIN: 1,
    DISH_NAME_MAX: 20,
    DISH_NOTE_MAX: 25,
    TAG_MAX_COUNT: 5,
    TAG_INPUT_MAX: 30
  },

  // 图片配置
  IMAGE: {
    MAX_SIZE_MB: 2,
    COMPRESS_QUALITY: 70,
    MAX_WIDTH: 1280,
    MAX_HEIGHT: 1280
  },

  // 缓存配置
  CACHE: {
    EXPIRE_TIME: 5 * 60 * 1000 // 5分钟
  },

  // 搜索配置
  SEARCH: {
    DEBOUNCE_TIME: 500,  // 防抖时间
    RESULT_LIMIT: 20     // 结果数量限制
  },

  // 数据库集合名称
  COLLECTION: {
    RESTAURANTS: 'restaurants',
    DISHES: 'dishes'
  },

  // 菜品评分
  RATING: {
    MUST_TRY: 'must-try',
    AVOID: 'avoid'
  },

  // Toast 提示文字
  TOAST: {
    SAVE_SUCCESS: '保存成功',
    SAVE_FAIL: '保存失败，请重试',
    DELETE_SUCCESS: '删除成功',
    DELETE_FAIL: '删除失败',
    LOAD_FAIL: '加载失败',
    UPLOAD_SUCCESS: '上传成功',
    UPLOAD_FAIL: '上传失败，请重试',
    NETWORK_ERROR: '网络错误，请重试'
  }
};
