const cloud = require('wx-server-sdk')

cloud.init()

exports.main = async (event, context) => {
  const { scene, page } = event

  try {
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: scene || 'test',
      page: page || 'pages/index/index',
      width: 430
    })

    return {
      success: true,
      buffer: result.buffer
    }
  } catch (err) {
    return {
      success: false,
      error: err
    }
  }
}
