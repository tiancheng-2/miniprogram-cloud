// cloudfunctions/updateStats/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action = 'update' } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  console.log('[UpdateStats] Called:', { action, openid })

  try {
    switch (action) {
      case 'get':
        return await getUserStats(openid)
      case 'update':
        return await updateUserStats(openid)
      default:
        return { code: 400, msg: '未知操作', data: null }
    }
  } catch (error) {
    console.error('[UpdateStats] Error:', error)
    return { code: 500, msg: error.message, data: null }
  }
}

async function getUserStats(openid) {
  try {
    const res = await db
      .collection('user_stats')
      .doc(openid)
      .get()

    return {
      code: 0,
      msg: '获取成功',
      data: res.data
    }
  } catch (error) {
    console.error('[getUserStats] Error:', error); // 增加错误日志
    if (error.errCode === -502005) {
      console.log('[getUserStats] Collection not found. Initializing...'); // 日志提示
      await initUserStats(openid);
      return await getUserStats(openid);
    }
    throw error;
  }
}

async function initUserStats(openid) {
  const stats = {
    totalRestaurants: 0,
    totalDishes: 0,
    mustTryCount: 0,
    avoidCount: 0,
    lastUpdated: db.serverDate()
  }

  await db.collection('user_stats').add({
    data: {
      _id: openid, // 用 openid 作为 docId
      ...stats
    }
  });

  console.log(`[initUserStats] Created user stats for ${openid}`); // 日志提示已创建用户统计
}

async function updateUserStats(openid) {
  const [restaurantCount, dishCount, mustTryCount] = await Promise.all([
    db.collection('restaurants').where({ _openid: openid }).count(),
    db.collection('dishes').where({ _openid: openid }).count(),
    db.collection('dishes').where({ _openid: openid, rating: 'must-try' }).count()
  ])

  const stats = {
    totalRestaurants: restaurantCount.total || 0,
    totalDishes: dishCount.total || 0,
    mustTryCount: mustTryCount.total || 0,
    avoidCount: (dishCount.total || 0) - (mustTryCount.total || 0),
    lastUpdated: db.serverDate()
  }

  await db
    .collection('user_stats')
    .doc(openid)
    .update({ data: stats })

  return {
    code: 0,
    msg: '更新成功',
    data: stats
  }
}