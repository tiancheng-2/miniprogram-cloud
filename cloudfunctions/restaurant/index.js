// cloudfunctions/restaurant/index.js
// 餐厅管理云函数

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

// ==================== 主入口 ====================
exports.main = async (event, context) => {
  const { action, params = {} } = event
  const wxContext = cloud.getWXContext()
  
  try {
    switch (action) {
      case 'add':
        return await addRestaurant(params, wxContext)
      case 'update':
        return await updateRestaurant(params, wxContext)
      case 'delete':
        return await deleteRestaurant(params, wxContext)
      case 'list':
        return await listRestaurants(params, wxContext)
      case 'detail':
        return await getRestaurantDetail(params, wxContext)
      default:
        return { code: 400, msg: '未知操作', data: null }
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return { code: 500, msg: error.message || '服务器错误', data: null }
  }
}

// ==================== 新增餐厅 ====================
async function addRestaurant(params, wxContext) {
  const { name, address = '', tags = [] } = params
  
  // 参数校验
  if (!name || name.trim().length === 0) {
    return { code: 400, msg: '餐厅名称不能为空', data: null }
  }
  
  if (name.trim().length > 15) {
    return { code: 400, msg: '餐厅名称不能超过15字', data: null }
  }
  
  if (address && address.trim().length > 30) {
    return { code: 400, msg: '餐厅地址不能超过30字', data: null }
  }
  
  // 处理标签（最多5个）
  const processedTags = Array.isArray(tags) 
    ? tags.filter(t => t && t.trim()).slice(0, 5)
    : []
  
  // 插入数据
  const result = await db.collection('restaurants').add({
    data: {
      name: name.trim(),
      address: address.trim(),
      tags: processedTags,
      coverImage: '',
      mustTryCount: 0,
      avoidCount: 0,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })
  
  return {
    code: 0,
    msg: '添加成功',
    data: {
      _id: result._id
    }
  }
}

// ==================== 更新餐厅 ====================
async function updateRestaurant(params, wxContext) {
  const { id, name, address, tags } = params
  
  if (!id) {
    return { code: 400, msg: '餐厅ID不能为空', data: null }
  }
  
  // 构建更新数据
  const updateData = { updateTime: db.serverDate() }
  
  if (name !== undefined) {
    if (!name.trim()) {
      return { code: 400, msg: '餐厅名称不能为空', data: null }
    }
    if (name.trim().length > 15) {
      return { code: 400, msg: '餐厅名称不能超过15字', data: null }
    }
    updateData.name = name.trim()
  }
  
  if (address !== undefined) {
    if (address.trim().length > 30) {
      return { code: 400, msg: '餐厅地址不能超过30字', data: null }
    }
    updateData.address = address.trim()
  }
  
  if (tags !== undefined) {
    updateData.tags = Array.isArray(tags) 
      ? tags.filter(t => t && t.trim()).slice(0, 5)
      : []
  }
  
  // 更新数据
  const result = await db.collection('restaurants')
    .doc(id)
    .update({
      data: updateData
    })
  
  if (result.stats.updated === 0) {
    return { code: 404, msg: '餐厅不存在或无权限', data: null }
  }
  
  return {
    code: 0,
    msg: '更新成功',
    data: { updated: result.stats.updated }
  }
}

// ==================== 删除餐厅 ====================
async function deleteRestaurant(params, wxContext) {
  const { id } = params
  
  if (!id) {
    return { code: 400, msg: '餐厅ID不能为空', data: null }
  }
  
  // 1. 先删除该餐厅下的所有菜品
  await db.collection('dishes')
    .where({ restaurantId: id })
    .remove()
  
  // 2. 删除餐厅
  const result = await db.collection('restaurants')
    .doc(id)
    .remove()
  
  if (result.stats.removed === 0) {
    return { code: 404, msg: '餐厅不存在或无权限', data: null }
  }
  
  return {
    code: 0,
    msg: '删除成功',
    data: { removed: result.stats.removed }
  }
}

// ==================== 获取餐厅列表 ====================
async function listRestaurants(params, wxContext) {
  const { keyword = '', limit = 100 } = params
  
  let query = db.collection('restaurants')
  
  // 搜索功能
  if (keyword && keyword.trim()) {
    query = query.where(
      _.or([
        { name: db.RegExp({ regexp: keyword.trim(), options: 'i' }) },
        { address: db.RegExp({ regexp: keyword.trim(), options: 'i' }) }
      ])
    )
  }
  
  // 查询
  const result = await query
    .orderBy('createTime', 'desc')
    .limit(Math.min(limit, 100))
    .get()
  
  return {
    code: 0,
    msg: '查询成功',
    data: {
      list: result.data,
      total: result.data.length
    }
  }
}

// ==================== 获取餐厅详情 ====================
async function getRestaurantDetail(params, wxContext) {
  const { id } = params
  
  if (!id) {
    return { code: 400, msg: '餐厅ID不能为空', data: null }
  }
  
  const result = await db.collection('restaurants')
    .doc(id)
    .get()
  
  if (!result.data) {
    return { code: 404, msg: '餐厅不存在', data: null }
  }
  
  return {
    code: 0,
    msg: '查询成功',
    data: result.data
  }
}
