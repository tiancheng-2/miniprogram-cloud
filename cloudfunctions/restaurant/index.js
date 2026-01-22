// cloudfunctions/restaurant/index.js
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

  console.log('[Restaurant] Called:', { action, params, openid })

  try {
    switch (action) {
      case 'list':
        return await getRestaurantList(openid, params)
      case 'detail':
        return await getRestaurantDetail(openid, params)
      case 'add':
        return await addRestaurant(openid, params)
      case 'update':
        return await updateRestaurant(openid, params)
      case 'delete':
        return await deleteRestaurant(openid, params)
      default:
        return { code: 400, msg: '未知操作', data: null }
    }
  } catch (error) {
    console.error('[Restaurant] Error:', error)
    return { code: 500, msg: error.message, data: null }
  }
}

/**
 * 获取餐厅列表
 */
async function getRestaurantList(openid, params) {
  const { keyword = '', limit = 20, skip = 0 } = params

  let query = db.collection('restaurants').where({ _openid: openid })

  // 如果有关键词，添加模糊查询
  if (keyword) {
    query = query.where({
      name: db.RegExp({
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
 * 获取餐厅详情
 */
async function getRestaurantDetail(openid, params) {
  const { id } = params

  if (!id) {
    return { code: 400, msg: '缺少餐厅ID', data: null }
  }

  const result = await db.collection('restaurants')
    .where({
      _id: id,
      _openid: openid
    })
    .get()

  if (!result.data || result.data.length === 0) {
    return { code: 404, msg: '餐厅不存在', data: null }
  }

  return {
    code: 0,
    msg: '获取成功',
    data: result.data[0]
  }
}

/**
 * 添加餐厅
 */
async function addRestaurant(openid, params) {
  const { name, address = '', tags = [], location = null, coverImage = '' } = params

  // 数据验证
  if (!name || name.trim().length === 0) {
    return { code: 400, msg: '餐厅名称不能为空', data: null }
  }

  if (name.length > 15) {
    return { code: 400, msg: '餐厅名称不能超过15字', data: null }
  }

  if (address && address.length > 30) {
    return { code: 400, msg: '地址不能超过30字', data: null }
  }

  if (tags && tags.length > 5) {
    return { code: 400, msg: '标签最多5个', data: null }
  }

  // 添加餐厅
  const result = await db.collection('restaurants').add({
    data: {
      name: name.trim(),
      address: address.trim(),
      tags,
      location,
      coverImage,
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
 * 更新餐厅
 */
async function updateRestaurant(openid, params) {
  const { id, ...updateData } = params

  if (!id) {
    return { code: 400, msg: '缺少餐厅ID', data: null }
  }

  // 移除不需要更新的字段
  delete updateData._id
  delete updateData._openid
  delete updateData.createTime

  // 添加更新时间
  updateData.updateTime = db.serverDate()

  const result = await db.collection('restaurants')
    .where({
      _id: id,
      _openid: openid
    })
    .update({
      data: updateData
    })

  if (result.stats.updated === 0) {
    return { code: 404, msg: '餐厅不存在或无权限', data: null }
  }

  return {
    code: 0,
    msg: '更新成功',
    data: null
  }
}

/**
 * 删除餐厅（级联删除所有菜品）
 */
async function deleteRestaurant(openid, params) {
  const { id } = params

  if (!id) {
    return { code: 400, msg: '缺少餐厅ID', data: null }
  }

  // 1. 先删除所有相关菜品
  await db.collection('dishes')
    .where({
      restaurantId: id,
      _openid: openid
    })
    .remove()

  // 2. 删除餐厅
  const result = await db.collection('restaurants')
    .where({
      _id: id,
      _openid: openid
    })
    .remove()

  if (result.stats.removed === 0) {
    return { code: 404, msg: '餐厅不存在或无权限', data: null }
  }

  return {
    code: 0,
    msg: '删除成功',
    data: null
  }
}
