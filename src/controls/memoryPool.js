// 内存池
export default class MemoryPool {
  constructor() {
    this.v_buffer = new SharedArrayBuffer(300000);
    this.v_uni8 = new Uint8Array(this.v_buffer);
    this.keys = [];
    this.startK = [];
    // 原始video数据
    this.videosMap = {
      foresight: new Map(),
      rearview: new Map(),
      right_front: new Map(),
      right_back: new Map(),
      left_back: new Map(),
      left_front: new Map(),
    };
    // 解码渲染后的video离屏
    this.vMap = {
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
    this.bevsMap = new Map(); // 原始bev数据
    this.bevsBgMap = new Map(); // 渲染后bev数据
    this.objsMap = new Map(); // 原始obj数据
    this.bpMap = new Map();
    this.besicMap = new Map();
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
  setVmap(key, block, view) {
    this.vMap[view].set(key, block);
  }
  getVmap(key, view) {
    return this.vMap[view].get(key);
  }
  delVmap(key) {
    this.vMap["foresight"].delete(key);
    this.vMap["rearview"].delete(key);
    this.vMap["right_front"].delete(key);
    this.vMap["right_back"].delete(key);
    this.vMap["left_back"].delete(key);
    this.vMap["left_front"].delete(key);
  }
  // 判断video对应视角中是否已有解码后的视频数据了
  hasVideo(key) {
    return (
      this.vMap["foresight"].has(key) &&
      this.vMap["rearview"].has(key) &&
      this.vMap["right_front"].has(key) &&
      this.vMap["right_back"].has(key) &&
      this.vMap["left_back"].has(key) &&
      this.vMap["left_front"].has(key)
    );
  }
}
