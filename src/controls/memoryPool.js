// 内存池
import { ObserverInstance } from "@/controls/event/observer";

export default class MemoryPool {
  observerListenerList = [
    {
      eventName: "SET_DATA",
      fn: this.setData.bind(this),
    },
  ];
  constructor() {
    ObserverInstance.selfAddListenerList(this.observerListenerList, "yh_init");
    // 视频的障碍物canvas
    this.video_objs = {
      foresight: new WeakMap(),
      rearview: new WeakMap(),
      right_front: new WeakMap(),
      right_back: new WeakMap(),
      left_back: new WeakMap(),
      left_front: new WeakMap(),
    };
    this.v_bgs = {
      foresight: new WeakMap(),
      rearview: new WeakMap(),
      right_front: new WeakMap(),
      right_back: new WeakMap(),
      left_back: new WeakMap(),
      left_front: new WeakMap(),
    };
    this.objs = new WeakMap(); // 给分割图使用的障碍物数据
    this.v_objs = new WeakMap(); // 给分割图使用的障碍物数据
    this.bevs = new WeakMap();
    this.bevs_point = new WeakMap();
    this.weakKeys = [];
    this.startKey = [];
    this.objects = new WeakMap();
  }
  setDateObject(key, block) {
    this.objects.set(key, block);
  }
  getDateObject(key) {
    this.objects.get(key);
    this.objects.delete(key);
  }

  // 从内存池中获取内存块
  allocate(key, sign, view) {
    let res;
    if (sign === "obj") {
      res = this.objs.get(key);
      this.objs.delete(key);
    } else if (sign === "bev") {
      res = this.bevs.get(key);
      this.bevs.delete(key);
    } else if (sign === "video_objs") {
      res = this.video_objs[view].get(key);
      this.video_objs[view].delete(key);
    } else if (sign === "v_bgs") {
      res = this.v_bgs[view].get(key);
      this.v_bgs[view].delete(key);
    } else if (sign === "bevs_point") {
      res = this.bevs_point.get(key);
      this.bevs_point.delete(key);
    } else if (sign === "v_objs") {
      res = this.v_objs.get(key);
      // this.v_objs.delete(key);
    }
    return res;
  }
  delObjsValue(key) {
    this.objs.delete(key);
    this.bevs.delete(key);
  }
  // 将内存块放入内存池
  setData(key, block, sign, view) {
    if (sign === "obj") {
      this.objs.set(key, block);
    } else if (sign === "bev") {
      // console.log(key, block, "this.bevs==");
      this.bevs.set(key, block);
    } else if (sign === "video_objs") {
      this.video_objs[view].set(key, block);
    } else if (sign === "v_bgs") {
      this.v_bgs[view].set(key, block);
    } else if (sign === "bevs_point") {
      // console.log(key, block, "key, block");
      this.bevs_point.set(key, block);
    } else if (sign === "v_objs") {
      this.v_objs.set(key, block);
    }
  }
  setWeakKeys(key) {
    this.weakKeys.push(key);
  }
  getWeakKeys() {
    return this.weakKeys.shift();
  }
  // 判断video对应视角中是否已有解码后的视频数据了
  hasVideo(key) {
    return (
      this.v_bgs["foresight"].has(key) &&
      this.v_bgs["rearview"].has(key) &&
      this.v_bgs["right_front"].has(key) &&
      this.v_bgs["right_back"].has(key) &&
      this.v_bgs["left_back"].has(key) &&
      this.v_bgs["left_front"].has(key)
    );
  }
  hasVideoObjs(key) {
    return (
      this.video_objs["foresight"].has(key) &&
      this.video_objs["rearview"].has(key) &&
      this.video_objs["right_front"].has(key) &&
      this.video_objs["right_back"].has(key) &&
      this.video_objs["left_back"].has(key) &&
      this.video_objs["left_front"].has(key)
    );
  }
  clear() {
    // 视频的障碍物canvas
    // this.video_objs.clear();
    this.v_bgs = {
      foresight: new WeakMap(),
      rearview: new WeakMap(),
      right_front: new WeakMap(),
      right_back: new WeakMap(),
      left_back: new WeakMap(),
      left_front: new WeakMap(),
    };
    this.objs.clear();
    this.bevs.clear();
  }
}
