// 内存池
export default class MemoryPool {
  constructor() {
    this.v_buffer = new SharedArrayBuffer(200000);
    this.v_uni8 = new Uint8Array(this.v_buffer);
    this.keys = [];
    this.startK = [];
    this.videosMap = {
      // 原始video数据
      foresight: new Map(),
      rearview: new Map(),
      right_front: new Map(),
      right_back: new Map(),
      left_back: new Map(),
      left_front: new Map(),
    };
    this.vMap = {
      // 解码渲染后的video
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
    this.newObjsMap = new Map(); // 处理后的obj数据
    this.newOVMap = new Map(); // 处理后的obj数据
    this.bpMap = new Map();
    this.besicMap = new Map();
  }
  // 存放原始video数据
  setInitVideo(key, block, view) {
    let buffer = this.v_uni8.slice(0, block.length);
    buffer.set(block);
    this.videosMap[view].set(key, buffer);
    buffer = null;
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
