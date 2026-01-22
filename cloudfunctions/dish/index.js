// cloudfunctions/dish/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, params = {} } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  console.log('[Dish] Called:', { action, params, openid })

  try {
    switch (action) {
      case 'list':
        return await getDishList(openid, params)
      case 'detail':
        return await getDishDetail(openid, params)
      case 'add':
        return await addDish(openid, params)
      case 'batchAdd':
        return await batchAddDishes(openid, params)
      case 'update':
        return await updateDish(openid, params)
      case 'delete':
        return await deleteDish(openid, params)
      default:
        return { code: 400, msg: '未知操作', data: null }
    }
  } catch (error) {
    console.error('[Dish] Error:', error)
    return { code: 500, msg: error.message, data: null }
  }
}

/**
 * 获取菜品列表
 */
async function getDishList(openid, params) {
  const { restaurantId, rating = '', keyword = '', limit = 20, skip = 0 } = params

  let whereCondition = { _openid: openid }

  // 如果指定了餐厅ID
  if (restaurantId) {
    whereCondition.restaurantId = restaurantId
  }

  // 如果指定了评分筛选
  if (rating && ['must-try', 'avoid'].includes(rating)) {
    whereCondition.rating = rating
  }

  let query = db.collection('dishes').where(whereCondition)

  // 如果有关键词，添加模糊查询
  if (keyword) {
    query = query.where({
      dishName: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    })
  }

  const result = await query
    .orderBy('createTime', 'desc')
    .skip(skip)
    .limit(limit)
    .get()

  return {
    code: 0,
    msg: '获取成功',
    data: {
      list: result.data,
      total: result.data.length
    }
  }
}

/**
 * 获取菜品详情
 */
async function getDishDetail(openid, params) {
  const { id } = params

  if (!id) {
    return { code: 400, msg: '缺少菜品ID', data: null }
  }

  const result = await db.collection('dishes')
    .where({
      _id: id,
      _openid: openid
    })
    .get()

  if (!result.data || result.data.length === 0) {
    return { code: 404, msg: '菜品不存在', data: null }
  }

  return {
    code: 0,
    msg: '获取成功',
    data: result.data[0]
  }
}

/**
 * 添加菜品
 */
async function addDish(openid, params) {
  const {
    restaurantId,
    dishName,
    rating,
    note = '',
    tags = [],
    photoUrl = ''
  } = params

  // 数据验证
  if (!restaurantId) {
    return { code: 400, msg: '缺少餐厅ID', data: null }
  }

  if (!dishName || dishName.trim().length === 0) {
    return { code: 400, msg: '菜品名称不能为空', data: null }
  }

  if (dishName.length > 20) {
    return { code: 400, msg: '菜品名称不能超过20字', data: null }
  }

  if (!rating || !['must-try', 'avoid'].includes(rating)) {
    return { code: 400, msg: '评分必须是 must-try 或 avoid', data: null }
  }

  if (note && note.length > 25) {
    return { code: 400, msg: '笔记不能超过25字', data: null }
  }

  if (tags && tags.length > 5) {
    return { code: 400, msg: '标签最多5个', data: null }
  }

  // 验证餐厅是否存在且属于当前用户
  const restaurantCheck = await db.collection('restaurants')
    .where({
      _id: restaurantId,
      _openid: openid
    })
    .count()

  if (restaurantCheck.total === 0) {
    return { code: 404, msg: '餐厅不存在或无权限', data: null }
  }

  // 添加菜品
  const result = await db.collection('dishes').add({
    data: {
      restaurantId,
      dishName: dishName.trim(),
      rating,
      note: note.trim(),
      tags,
      photoUrl,
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
      _openid: openid
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

/**
 * 批量添加菜品
 */
async function batchAddDishes(openid, params) {
  const { restaurantId, dishes = [] } = params

  // 数据验证
  if (!restaurantId) {
    return { code: 400, msg: '缺少餐厅ID', data: null }
  }

  if (!Array.isArray(dishes) || dishes.length === 0) {
    return { code: 400, msg: '菜品列表不能为空', data: null }
  }

  // 验证餐厅是否存在且属于当前用户
  const restaurantCheck = await db.collection('restaurants')
    .where({
      _id: restaurantId,
      _openid: openid
    })
    .count()

  if (restaurantCheck.total === 0) {
    return { code: 404, msg: '餐厅不存在或无权限', data: null }
  }

  // 准备批量添加的数据
  const dishesData = dishes.map(dish => ({
    restaurantId,
    dishName: dish.dishName?.trim() || '',
    rating: dish.rating || 'must-try',
    note: dish.note?.trim() || '',
    tags: dish.tags || [],
    photoUrl: dish.photoUrl || '',
    createTime: db.serverDate(),
    updateTime: db.serverDate(),
    _openid: openid
  }))

  // 过滤掉无效数据
  const validDishes = dishesData.filter(dish =>
    dish.dishName.length > 0 &&
    dish.dishName.length <= 20 &&
    ['must-try', 'avoid'].includes(dish.rating)
  )

  if (validDishes.length === 0) {
    return { code: 400, msg: '没有有效的菜品数据', data: null }
  }

  // 批量添加（一次最多20条）
  const batchSize = 20
  let addedCount = 0

  for (let i = 0; i < validDishes.length; i += batchSize) {
    const batch = validDishes.slice(i, i + batchSize)

    await Promise.all(
      batch.map(dish => db.collection('dishes').add({ data: dish }))
    )

    addedCount += batch.length
  }

  return {
    code: 0,
    msg: '批量添加成功',
    data: {
      added: addedCount,
      total: dishes.length
    }
  }
}

/**
 * 更新菜品
 */
async function updateDish(openid, params) {
  const { id, ...updateData } = params

  if (!id) {
    return { code: 400, msg: '缺少菜品ID', data: null }
  }

  // 移除不需要更新的字段
  delete updateData._id
  delete updateData._openid
  delete updateData.createTime
  delete updateData.restaurantId

  // 添加更新时间
  updateData.updateTime = db.serverDate()

  // 数据验证
  if (updateData.dishName && updateData.dishName.length > 20) {
    return { code: 400, msg: '菜品名称不能超过20字', data: null }
  }

  if (updateData.note && updateData.note.length > 25) {
    return { code: 400, msg: '笔记不能超过25字', data: null }
  }

  if (updateData.rating && !['must-try', 'avoid'].includes(updateData.rating)) {
    return { code: 400, msg: '评分必须是 must-try 或 avoid', data: null }
  }

  const result = await db.collection('dishes')
    .where({
      _id: id,
      _openid: openid
    })
    .update({
      data: updateData
    })

  if (result.stats.updated === 0) {
    return { code: 404, msg: '菜品不存在或无权限', data: null }
  }

  return {
    code: 0,
    msg: '更新成功',
    data: null
  }
}

/**
 * 删除菜品
 */
async function deleteDish(openid, params) {
  const { id } = params

  if (!id) {
    return { code: 400, msg: '缺少菜品ID', data: null }
  }

  const result = await db.collection('dishes')
    .where({
      _id: id,
      _openid: openid
    })
    .remove()

  if (result.stats.removed === 0) {
    return { code: 404, msg: '菜品不存在或无权限', data: null }
  }

  return {
    code: 0,
    msg: '删除成功',
    data: null
  }
}
