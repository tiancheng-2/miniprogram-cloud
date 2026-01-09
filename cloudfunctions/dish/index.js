// cloudfunctions/dish/index.js
// 菜品管理云函数

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
        return await addDish(params, wxContext)
      case 'batchAdd':
        return await batchAddDishes(params, wxContext)
      case 'update':
        return await updateDish(params, wxContext)
      case 'delete':
        return await deleteDish(params, wxContext)
      case 'list':
        return await listDishes(params, wxContext)
      case 'detail':
        return await getDishDetail(params, wxContext)
      case 'updateRestaurantCount':
        return await updateRestaurantDishCount(params, wxContext)
      default:
        return { code: 400, msg: '未知操作', data: null }
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return { code: 500, msg: error.message || '服务器错误', data: null }
  }
}

// ==================== 新增单个菜品 ====================
async function addDish(params, wxContext) {
  const { 
    restaurantId, 
    dishName, 
    rating, 
    note = '', 
    tags = [], 
    photoUrl = '' 
  } = params
  
  // 参数校验
  if (!restaurantId) {
    return { code: 400, msg: '餐厅ID不能为空', data: null }
  }
  
  if (!dishName || dishName.trim().length === 0) {
    return { code: 400, msg: '菜品名称不能为空', data: null }
  }
  
  if (dishName.trim().length > 20) {
    return { code: 400, msg: '菜品名称不能超过20字', data: null }
  }
  
  if (!rating || !['must-try', 'avoid'].includes(rating)) {
    return { code: 400, msg: '评分必须是 must-try 或 avoid', data: null }
  }
  
  if (note && note.trim().length > 25) {
    return { code: 400, msg: '菜品笔记不能超过25字', data: null }
  }
  
  // 处理标签
  const processedTags = Array.isArray(tags) 
    ? tags.filter(t => t && t.trim()).slice(0, 5)
    : []
  
  // 插入菜品
  const result = await db.collection('dishes').add({
    data: {
      restaurantId,
      dishName: dishName.trim(),
      rating,
      note: note.trim(),
      tags: processedTags,
      photoUrl: photoUrl || '',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }
  })
  
  // 更新餐厅统计
  const countField = rating === 'must-try' ? 'mustTryCount' : 'avoidCount'
  await db.collection('restaurants')
    .doc(restaurantId)
    .update({
      data: {
        [countField]: _.inc(1),
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

// ==================== 批量新增菜品 ====================
async function batchAddDishes(params, wxContext) {
  const { restaurantId, dishes = [] } = params
  
  if (!restaurantId) {
    return { code: 400, msg: '餐厅ID不能为空', data: null }
  }
  
  if (!Array.isArray(dishes) || dishes.length === 0) {
    return { code: 400, msg: '菜品列表不能为空', data: null }
  }
  
  // 校验每个菜品
  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i]
    
    if (!dish.dishName || dish.dishName.trim().length === 0) {
      return { code: 400, msg: `菜品${i+1}名称不能为空`, data: null }
    }
    
    if (dish.dishName.trim().length > 20) {
      return { code: 400, msg: `菜品${i+1}名称不能超过20字`, data: null }
    }
    
    if (!dish.rating || !['must-try', 'avoid'].includes(dish.rating)) {
      return { code: 400, msg: `菜品${i+1}评分必须是 must-try 或 avoid`, data: null }
    }
  }
  
  // 批量插入菜品
  const insertData = dishes.map(dish => ({
    restaurantId,
    dishName: dish.dishName.trim(),
    rating: dish.rating,
    note: (dish.note || '').trim().substring(0, 25),
    tags: Array.isArray(dish.tags) 
      ? dish.tags.filter(t => t && t.trim()).slice(0, 5)
      : [],
    photoUrl: dish.photoUrl || '',
    createTime: db.serverDate(),
    updateTime: db.serverDate()
  }))
  
  // 插入（分批，每批20条）
  const batchSize = 20
  const results = []
  
  for (let i = 0; i < insertData.length; i += batchSize) {
    const batch = insertData.slice(i, i + batchSize)
    const promises = batch.map(data => 
      db.collection('dishes').add({ data })
    )
    const batchResults = await Promise.all(promises)
    results.push(...batchResults)
  }
  
  // 统计必点和避坑数量
  const mustTryCount = dishes.filter(d => d.rating === 'must-try').length
  const avoidCount = dishes.filter(d => d.rating === 'avoid').length
  
  // 更新餐厅统计
  await db.collection('restaurants')
    .doc(restaurantId)
    .update({
      data: {
        mustTryCount: _.inc(mustTryCount),
        avoidCount: _.inc(avoidCount),
        updateTime: db.serverDate()
      }
    })
  
  return {
    code: 0,
    msg: '批量添加成功',
    data: {
      added: results.length,
      mustTryCount,
      avoidCount
    }
  }
}

// ==================== 更新菜品 ====================
async function updateDish(params, wxContext) {
  const { id, dishName, rating, note, tags, photoUrl } = params
  
  if (!id) {
    return { code: 400, msg: '菜品ID不能为空', data: null }
  }
  
  // 获取原菜品信息（用于更新餐厅统计）
  const oldDish = await db.collection('dishes').doc(id).get()
  if (!oldDish.data) {
    return { code: 404, msg: '菜品不存在', data: null }
  }
  
  // 构建更新数据
  const updateData = { updateTime: db.serverDate() }
  
  if (dishName !== undefined) {
    if (!dishName.trim()) {
      return { code: 400, msg: '菜品名称不能为空', data: null }
    }
    if (dishName.trim().length > 20) {
      return { code: 400, msg: '菜品名称不能超过20字', data: null }
    }
    updateData.dishName = dishName.trim()
  }
  
  if (rating !== undefined) {
    if (!['must-try', 'avoid'].includes(rating)) {
      return { code: 400, msg: '评分必须是 must-try 或 avoid', data: null }
    }
    updateData.rating = rating
  }
  
  if (note !== undefined) {
    if (note.trim().length > 25) {
      return { code: 400, msg: '菜品笔记不能超过25字', data: null }
    }
    updateData.note = note.trim()
  }
  
  if (tags !== undefined) {
    updateData.tags = Array.isArray(tags) 
      ? tags.filter(t => t && t.trim()).slice(0, 5)
      : []
  }
  
  if (photoUrl !== undefined) {
    updateData.photoUrl = photoUrl || ''
  }
  
  // 更新菜品
  const result = await db.collection('dishes')
    .doc(id)
    .update({
      data: updateData
    })
  
  // 如果评分改变，更新餐厅统计
  if (rating && rating !== oldDish.data.rating) {
    const restaurantId = oldDish.data.restaurantId
    
    // 旧评分 -1
    const oldField = oldDish.data.rating === 'must-try' ? 'mustTryCount' : 'avoidCount'
    // 新评分 +1
    const newField = rating === 'must-try' ? 'mustTryCount' : 'avoidCount'
    
    await db.collection('restaurants')
      .doc(restaurantId)
      .update({
        data: {
          [oldField]: _.inc(-1),
          [newField]: _.inc(1),
          updateTime: db.serverDate()
        }
      })
  }
  
  return {
    code: 0,
    msg: '更新成功',
    data: { updated: result.stats.updated }
  }
}

// ==================== 删除菜品 ====================
async function deleteDish(params, wxContext) {
  const { id } = params
  
  if (!id) {
    return { code: 400, msg: '菜品ID不能为空', data: null }
  }
  
  // 获取菜品信息（用于更新餐厅统计）
  const dish = await db.collection('dishes').doc(id).get()
  if (!dish.data) {
    return { code: 404, msg: '菜品不存在', data: null }
  }
  
  // 删除菜品
  const result = await db.collection('dishes')
    .doc(id)
    .remove()
  
  // 更新餐厅统计
  const countField = dish.data.rating === 'must-try' ? 'mustTryCount' : 'avoidCount'
  await db.collection('restaurants')
    .doc(dish.data.restaurantId)
    .update({
      data: {
        [countField]: _.inc(-1),
        updateTime: db.serverDate()
      }
    })
  
  return {
    code: 0,
    msg: '删除成功',
    data: { removed: result.stats.removed }
  }
}

// ==================== 获取菜品列表 ====================
async function listDishes(params, wxContext) {
  const { restaurantId, rating, keyword = '', limit = 100 } = params
  
  let whereConditions = {}
  
  // 按餐厅筛选
  if (restaurantId) {
    whereConditions.restaurantId = restaurantId
  }
  
  // 按评分筛选
  if (rating && ['must-try', 'avoid'].includes(rating)) {
    whereConditions.rating = rating
  }
  
  let query = db.collection('dishes').where(whereConditions)
  
  // 搜索功能
  if (keyword && keyword.trim()) {
    query = query.where({
      ...whereConditions,
      dishName: db.RegExp({ regexp: keyword.trim(), options: 'i' })
    })
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

// ==================== 获取菜品详情 ====================
async function getDishDetail(params, wxContext) {
  const { id } = params
  
  if (!id) {
    return { code: 400, msg: '菜品ID不能为空', data: null }
  }
  
  const result = await db.collection('dishes')
    .doc(id)
    .get()
  
  if (!result.data) {
    return { code: 404, msg: '菜品不存在', data: null }
  }
  
  return {
    code: 0,
    msg: '查询成功',
    data: result.data
  }
}

// ==================== 更新餐厅菜品统计 ====================
async function updateRestaurantDishCount(params, wxContext) {
  const { restaurantId } = params
  
  if (!restaurantId) {
    return { code: 400, msg: '餐厅ID不能为空', data: null }
  }
  
  // 统计该餐厅的菜品数量
  const mustTryResult = await db.collection('dishes')
    .where({ restaurantId, rating: 'must-try' })
    .count()
  
  const avoidResult = await db.collection('dishes')
    .where({ restaurantId, rating: 'avoid' })
    .count()
  
  // 更新餐厅统计
  await db.collection('restaurants')
    .doc(restaurantId)
    .update({
      data: {
        mustTryCount: mustTryResult.total,
        avoidCount: avoidResult.total,
        updateTime: db.serverDate()
      }
    })
  
  return {
    code: 0,
    msg: '统计更新成功',
    data: {
      mustTryCount: mustTryResult.total,
      avoidCount: avoidResult.total
    }
  }
}
