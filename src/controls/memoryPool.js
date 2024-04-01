// 内存池
export default class MemoryPool {
  constructor() {
    this.v_buffer = new SharedArrayBuffer(300000);
    this.v_uni8 = new Uint8Array(this.v_buffer);
    this.keys = [];
    this.startK = [];
    // 原始video数据,解码渲染后的video离屏--通过判断类型进行渲染
    this.videosMap = {
      foresight: new Map(),
      rearview: new Map(),
      right_front: new Map(),
      right_back: new Map(),
      left_back: new Map(),
      left_front: new Map(),
    };
    // video-obj的离屏
    this.ovMap = {
      foresight: new Map(),
      rearview: new Map(),
      right_front: new Map(),
      right_back: new Map(),
      left_back: new Map(),
      left_front: new Map(),
    };
    this.objsMap = new Map(); // 原始obj数据
    this.bpMap = new Map();
    this.besicMap = new Map();
  }
  handleVideo(block) {
    try {
      let buffer = this.v_uni8.slice(0, block.length);
      buffer.set(block);
      return buffer;
    } catch (err) {
      console.log(err, "err====handleVideo");
    }
  }
  // 存放原始video数据
  setInitVideo(key, block, view) {
    try {
      let buffer = this.v_uni8.slice(0, block.length);
      buffer.set(block);
      this.videosMap[view].set(key, buffer);
      buffer = null;
    } catch (err) {
      console.log(err, "err----setInitVideo");
    }
  }
  // 获取原始video数据
  getInitVideo(key, view) {
    return this.videosMap[view].get(key);
  }
  // 删除原始video数据
  delInitVideo(key) {
    this.videosMap["foresight"].delete(key);
    this.videosMap["rearview"].delete(key);
    this.videosMap["right_front"].delete(key);
    this.videosMap["right_back"].delete(key);
    this.videosMap["left_back"].delete(key);
    this.videosMap["left_front"].delete(key);
  }
  setOVimg(key, block, view) {
    this.ovMap[view].set(key, block);
  }
  getOVimg(key, view) {
    return this.ovMap[view].get(key);
  }
  delOVimg(key) {
    this.ovMap["foresight"].delete(key);
    this.ovMap["rearview"].delete(key);
    this.ovMap["right_front"].delete(key);
    this.ovMap["right_back"].delete(key);
    this.ovMap["left_back"].delete(key);
    this.ovMap["left_front"].delete(key);
  }
  // 判断video对应视角中是否已有解码后的视频数据了
  hasVideo(key) {
    return (
      this.videosMap["foresight"].get(key) instanceof ImageBitmap &&
      this.videosMap["rearview"].get(key) instanceof ImageBitmap &&
      this.videosMap["right_front"].get(key) instanceof ImageBitmap &&
      this.videosMap["right_back"].get(key) instanceof ImageBitmap &&
      this.videosMap["left_back"].get(key) instanceof ImageBitmap &&
      this.videosMap["left_front"].get(key) instanceof ImageBitmap 
    );
  }
}
