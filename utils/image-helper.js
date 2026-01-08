// utils/image-helper.js - 统一图片处理工具

const CONFIG = {
  MAX_SIZE_MB: 2,           // 最大文件大小（MB）
  COMPRESS_QUALITY: 70,     // 压缩质量
  MAX_WIDTH: 1280,          // 最大宽度
  MAX_HEIGHT: 1280          // 最大高度
};

class ImageHelper {
  /**
   * 选择并上传图片（统一入口）
   * @param {Object} options
   * @param {number} options.count - 图片数量
   * @param {Function} options.onSuccess - 成功回调
   * @param {Function} options.onFail - 失败回调
   */
  static chooseAndUpload(options = {}) {
    const {
      count = 1,
      onSuccess,
      onFail
    } = options;

    wx.chooseImage({
      count: count,
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const filePath = res.tempFilePaths[0];
        this._processAndUpload(filePath, onSuccess, onFail);
      },
      fail: (err) => {
        console.error('选择图片失败', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
        onFail && onFail(err);
      }
    });
  }

  /**
   * 处理并上传图片
   * @private
   */
  static _processAndUpload(filePath, onSuccess, onFail) {
    wx.getImageInfo({
      src: filePath,
      success: (info) => {
        const fileSizeMB = info.size / 1024 / 1024;

        // 判断是否需要压缩
        if (fileSizeMB <= CONFIG.MAX_SIZE_MB && 
            info.width <= CONFIG.MAX_WIDTH && 
            info.height <= CONFIG.MAX_HEIGHT) {
          // 直接上传
          this._upload(filePath, onSuccess, onFail);
        } else {
          // 需要压缩
          this._compress(filePath, onSuccess, onFail);
        }
      },
      fail: (err) => {
        console.error('获取图片信息失败', err);
        onFail && onFail(err);
      }
    });
  }

  /**
   * 压缩图片
   * @private
   */
  static _compress(filePath, onSuccess, onFail) {
    wx.showLoading({ title: '处理中...', mask: true });

    wx.compressImage({
      src: filePath,
      quality: CONFIG.COMPRESS_QUALITY,
      success: (compressRes) => {
        wx.hideLoading();
        this._upload(compressRes.tempFilePath, onSuccess, onFail);
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('压缩失败', err);
        wx.showModal({
          title: '图片处理失败',
          content: '图片文件过大且压缩失败，请选择较小的图片',
          showCancel: false
        });
        onFail && onFail(err);
      }
    });
  }

  /**
   * 上传到云存储
   * @private
   */
  static _upload(filePath, onSuccess, onFail) {
    wx.showLoading({
      title: '上传中...',
      mask: true
    });

    const cloudPath = `dishes/${Date.now()}-${Math.floor(Math.random() * 10000)}.jpg`;

    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: filePath,
      success: (res) => {
        wx.hideLoading();
        wx.showToast({
          title: '上传成功',
          icon: 'success',
          duration: 1500
        });
        onSuccess && onSuccess(res.fileID);
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('上传失败', err);
        wx.showToast({
          title: '上传失败，请重试',
          icon: 'none'
        });
        onFail && onFail(err);
      }
    });
  }

  /**
   * 删除云存储文件
   * @param {string} fileID - 文件ID
   * @param {Function} onSuccess - 成功回调
   * @param {Function} onFail - 失败回调
   */
  static deleteFile(fileID, onSuccess, onFail) {
    if (!fileID) {
      onSuccess && onSuccess();
      return;
    }

    wx.cloud.deleteFile({
      fileList: [fileID],
      success: (res) => {
        console.log('云存储文件删除成功', res);
        onSuccess && onSuccess(res);
      },
      fail: (err) => {
        console.error('云存储文件删除失败', err);
        onFail && onFail(err);
      }
    });
  }

  /**
   * 预览图片
   * @param {Array} urls - 图片地址数组
   * @param {number} current - 当前显示图片索引
   */
  static preview(urls, current = 0) {
    if (!urls || urls.length === 0) return;

    wx.previewImage({
      urls: urls,
      current: urls[current]
    });
  }
}

module.exports = ImageHelper;
