<template>
  <div class="my_page">
    <div class="bg_box"></div>
    <div class="page_title" id="page_title">
      <div class="logo_box">
        <img src="@/assets/images/logo.png" class="logo_img" />
      </div>
    </div>
    <div class="page_main">
      <div class="data_box">
        <div class="top_box">
          <videoYH
            ref="foresight"
            id="foresight"
            :video_id="'foresight'"
            :class="[`v_1`, 'v_box']"
            @updataVideoStatus="updataVideoStatus"
          />
          <videoYH
            ref="rearview"
            id="rearview"
            :video_id="'rearview'"
            :class="[`v_1`, 'v_box']"
            @updataVideoStatus="updataVideoStatus"
          />
        </div>
        <div class="bottom_box">
          <div class="left_box">
            <videoYH
              ref="left_back"
              id="left_back"
              :video_id="'left_back'"
              :class="[`v_3`, 'v_box']"
              @updataVideoStatus="updataVideoStatus"
            />
            <videoYH
              ref="left_front"
              id="left_front"
              :video_id="'left_front'"
              :class="[`v_4`, 'v_box']"
              @updataVideoStatus="updataVideoStatus"
            />
          </div>
          <div class="center_box">
            <Bev ref="BEV" />
          </div>
          <div class="right_box">
            <videoYH
              ref="right_front"
              id="right_front"
              :video_id="'right_front'"
              :class="[`v_1`, 'v_box']"
              @updataVideoStatus="updataVideoStatus"
            />
            <videoYH
              ref="right_back"
              id="right_back"
              :video_id="'right_back'"
              :class="[`v_2`, 'v_box']"
              @updataVideoStatus="updataVideoStatus"
            />
          </div>
        </div>
      </div>
      <!-- <div class="echarts_demos" id="e_demos">
        <echartsYH id="echarts_box" />
        <echartAxis />
      </div> -->
    </div>
  </div>
</template>

<script setup>
import videoYH from "@/components/bevShow/view_video.vue";
import Bev from "@/components/bevShow/bev.vue";
import echartsYH from "@/components/bevShow/echarts.vue";
import echartAxis from "@/components/bevShow/echartAxis.vue";
import {
  ref,
  inject,
  defineProps,
  onUnmounted,
  onBeforeMount,
  onMounted,
} from "vue";
import { ObserverInstance } from "@/controls/event/observer";
import Ws from "@/controls/ws.js";
import { decode } from "@msgpack/msgpack";
import memoryPool from "@/controls/memoryPool.js";

let foresight = ref(),
  rearview = ref(),
  right_front = ref(),
  right_back = ref(),
  left_back = ref(),
  left_front = ref(),
  BEV = ref(),
  MemoryPool = new memoryPool(),
  drawWorker = new Worker(
    new URL("../../controls/draw_worker.js", import.meta.url, {
      type: "module",
    })
  ),
  stop = ref(false),
  video_ok_key = ref(-1),
  video_start = ref(false),
  video_status_ok = ref({
    foresight: false,
    rearview: false,
    right_front: false,
    right_back: false,
    left_back: false,
    left_front: false,
  }),
  animationFrameId = ref(null);
drawWorker.onmessage = (e) => {
  if (e.data.sign === "draw_bev&objs") {
    // 这里要拿取原始地址的键对象
    // let weak_id = e.data.key;
    let weak_key_res = MemoryPool.startKey.find((item) => {
      return item.id === e.data.key.id;
    });
    // console.log(weak_key_res, "weak_key_res==========1", e.data.key.id);
    if (!weak_key_res) {
      weak_key_res = e.data.key;
    }
    MemoryPool.setData(weak_key_res, e.data.imageBitmap, "bev");

    MemoryPool.setData(weak_key_res, e.data.objs, "obj");
    MemoryPool.setData(
      weak_key_res,
      e.data.objs_imageBitmap["foresight"],
      "video_objs",
      "foresight"
    );
    MemoryPool.setData(
      weak_key_res,
      e.data.objs_imageBitmap["rearview"],
      "video_objs",
      "rearview"
    );
    MemoryPool.setData(
      weak_key_res,
      e.data.objs_imageBitmap["right_front"],
      "video_objs",
      "right_front"
    );
    MemoryPool.setData(
      weak_key_res,
      e.data.objs_imageBitmap["right_back"],
      "video_objs",
      "right_back"
    );
    MemoryPool.setData(
      weak_key_res,
      e.data.objs_imageBitmap["left_back"],
      "video_objs",
      "left_back"
    );
    MemoryPool.setData(
      weak_key_res,
      e.data.objs_imageBitmap["left_front"],
      "video_objs",
      "left_front"
    );
  }
};
const props = defineProps(["initStatus"]);
const ws = new Ws("ws://192.168.1.161:1234", true, async (e) => {
  try {
    if (!props.initStatus) return;
    if (e.data instanceof ArrayBuffer) {
      let object = decode(e.data);

      if (video_ok_key.value < 0) {
        await foresight.value.postVideo(object[1][0], object[0], "foresight");
        await right_front.value.postVideo(
          object[1][1],
          object[0],
          "right_front"
        );
        await left_front.value.postVideo(object[1][2], object[0], "left_front");
        await rearview.value.postVideo(object[1][3], object[0], "rearview");
        await left_back.value.postVideo(object[1][4], object[0], "left_back");
        await right_back.value.postVideo(object[1][5], object[0], "right_back");
      } else {
        let weak_id = { id: object[0] }; // sign 0:只有视频、没有障碍物;1:障碍物和视频都有;2：只有障碍物没有视频
        let weak_key_res = MemoryPool.weakKeys.find((item) => {
          return item.id === object[0];
        });
        if (!weak_key_res) {
          MemoryPool.weakKeys.push(weak_id);
        } else {
          weak_id = weak_key_res;
        }
        if (MemoryPool.objects.has(weak_id)) {
          let o = MemoryPool.objects.get(weak_id);
          o = [...o.slice(0, 2), ...object.slice(2)];
          MemoryPool.objects.set(weak_id, o);
        } else {
          MemoryPool.setDateObject(weak_id, object);
        }
        if (MemoryPool.startKey.length > 30) {
          updateVideo();
        }
      }
    }
  } catch (err) {
    console.log(err, "err----WS");
  }
});
function a(object) {
  return new Promise(async (resolve, reject) => {
    let key = object[0];
    console.log(object, "object", Date.now());
    // return;
    if (video_ok_key.value > 0 && key > video_ok_key.value) {
      let weak_id = { id: key }; // sign 0:只有视频、没有障碍物;1:障碍物和视频都有;2：只有障碍物没有视频
      let weak_key_res = MemoryPool.weakKeys.find((item) => {
        return item.id === key;
      });
      // 这里要确保键对象地址一致
      if (!weak_key_res) {
        MemoryPool.weakKeys.push(weak_id);
      } else {
        weak_id = weak_key_res;
      }
      if (object[2][1] !== 0 && object[2][2] !== 0) {
        // console.log(weak_key_res, "weak_key_res=========== ===0", key);
        drawWorker.postMessage({
          sign: "draw_bev&objs",
          key: { id: key },
          bev_w: object[2][1],
          bev_h: object[2][2],
          bev: object[3],
          objs: object[4],
          basic_data: object[2],
        });
        MemoryPool.setData(weak_id, object[5], "bevs_point");
      }
    }
    if (object[1].length > 0) {
      await foresight.value.postVideo(object[1][0], key, "foresight");
      await right_front.value.postVideo(object[1][1], key, "right_front");
      await left_front.value.postVideo(object[1][2], key, "left_front");
      await rearview.value.postVideo(object[1][3], key, "rearview");
      await left_back.value.postVideo(object[1][4], key, "left_back");
      await right_back.value.postVideo(object[1][5], key, "right_back");
    }
    if (MemoryPool.weakKeys.length > 100) {
      updateVideo();
    }
    resolve(";;;");
  });
}
animate();
async function animate() {
  if (MemoryPool.weakKeys.length > 30) {
    let key = MemoryPool.weakKeys.shift();
    let object = MemoryPool.objects.get(key);
    // console.log(object, "object");
    MemoryPool.startKey.push(key);
    await foresight.value.postVideo(object[1][0], key.id, "foresight");
    await right_front.value.postVideo(object[1][1], key.id, "right_front");
    await left_front.value.postVideo(object[1][2], key.id, "left_front");
    await rearview.value.postVideo(object[1][3], key.id, "rearview");
    await left_back.value.postVideo(object[1][4], key.id, "left_back");
    await right_back.value.postVideo(object[1][5], key.id, "right_back");
    drawWorker.postMessage({
      sign: "draw_bev&objs",
      key: key,
      bev_w: object[2][1],
      bev_h: object[2][2],
      bev: object[3],
      objs: object[4],
      basic_data: object[2],
    });
    MemoryPool.setData(key, object[5], "bevs_point");
  }
  animationFrameId.value = requestAnimationFrame(() => animate());
}
// 更新视频--按照视频帧
async function updateVideo() {
  if (MemoryPool.startKey[0]?.id > video_ok_key.value) {
    let key = MemoryPool.startKey[0];
    // let key = MemoryPool.weakKeys[0];
    // console.log(key, "key");
    // console.log(MemoryPool.objs.has(key), "MemoryPool.objs------------");
    // console.log(MemoryPool.hasVideo(key), "hasVideo------------");

    let objs = MemoryPool.allocate(key, "obj"),
      bev = MemoryPool.allocate(key, "bev"),
      bevs_point = MemoryPool.allocate(key, "bevs_point");
    Promise.all([
      await foresight.value.drawVideo({
        bg: MemoryPool.allocate(key, "v_bgs", "foresight"),
        obj: MemoryPool.allocate(key, "video_objs", "foresight"),
      }),
      await right_front.value.drawVideo({
        bg: MemoryPool.allocate(key, "v_bgs", "right_front"),
        obj: MemoryPool.allocate(key, "video_objs", "right_front"),
      }),
      await left_front.value.drawVideo({
        bg: MemoryPool.allocate(key, "v_bgs", "left_front"),
        obj: MemoryPool.allocate(key, "video_objs", "left_front"),
      }),
      await rearview.value.drawVideo({
        bg: MemoryPool.allocate(key, "v_bgs", "rearview"),
        obj: MemoryPool.allocate(key, "video_objs", "rearview"),
      }),
      await left_back.value.drawVideo({
        bg: MemoryPool.allocate(key, "v_bgs", "left_back"),
        obj: MemoryPool.allocate(key, "video_objs", "left_back"),
      }),
      await right_back.value.drawVideo({
        bg: MemoryPool.allocate(key, "v_bgs", "right_back"),
        obj: MemoryPool.allocate(key, "video_objs", "right_back"),
      }),
      await BEV.value.drawBev({
        objs: objs ? objs : null,
        info: bev ? bev : null,
        bevs_point: bevs_point ? bevs_point : null,
      }),
    ]).then((res) => {
      MemoryPool.startKey.shift();
      key = null;
    });
    // }
  }
}
// 接受视频解码的数据，通知去离屏渲染
async function updataVideoStatus(message) {
  if (video_ok_key.value < 0) {
    
    let res = 0;
    for (const [key, value] of Object.entries(video_status_ok.value)) {
      if (!value) res++;
    }
    if (!video_status_ok.value[message.view]) {
      video_status_ok.value[message.view] = true;
    }
    if (res > 1) return;
    // 最后一个video也准备完毕了
    if (res === 1) {
      video_ok_key.value = message.key;
    }
    return;
  }
  // console.log(message, "message");
  let weak_key_res = MemoryPool.startKey.find((item) => {
    return item.id === message.key;
  });
  // 这里要确保键对象地址一致
  if (!weak_key_res) return;
  MemoryPool.setData(weak_key_res, message.info, "v_bgs", message.view);
}
// 通知bev分割图渲染
function noticeDraw(key) {
  return new Promise(async (resolve, reject) => {
    let info = MemoryPool.allocate(key, "bev");
    ObserverInstance.emit("DRAW_BEV", {
      objs: MemoryPool.allocate(key, "obj"),
      info: MemoryPool.allocate(key, "bev"),
      key: key,
    });
    resolve(`通知 bev 完毕`);
  });
}
onUnmounted(() => {
  MemoryPool.clear();
  drawWorker.terminate();
  ObserverInstance.removeAll();
  cancelAnimationFrame(animationFrameId.value);
});
</script>

<style lang="scss" scoped>
.my_page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0a439a;
  background-image: url("@/assets/images/bg_big.png");
  background-repeat: no-repeat;
  background-size: 100% 100%;
  position: relative;
  box-sizing: border-box;
  padding: 0 20px 20px;
  .bg_box {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url("@/assets/images/bg_color.png") no-repeat;
    background-size: 100% 100%;
  }
  .page_title {
    width: 100%;
    height: 57px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 8px;
    position: relative;
    z-index: 1;
    .logo_box {
      width: 286px;
      height: 100%;
      background: url("@/assets/images/logo_bg.png") no-repeat;
      background-size: 100% 100%;
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      padding-top: 10px;
      .logo_img {
        height: 26px;
      }
    }
  }
  .page_main {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    flex: 1;
    box-sizing: border-box;
    .data_box {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      margin-right: 20px;
      .top_box {
        height: 400px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        box-sizing: border-box;
        position: relative;
        flex-shrink: 0;
        margin-bottom: 20px;
        .v_box {
          height: 100%;
          width: 50%;
        }
        .v_box:first-child {
          margin-right: 12px;
        }
      }
      .bottom_box {
        flex: 1;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        position: relative;
        box-sizing: border-box;
        z-index: 1;
        .left_box,
        .right_box {
          width: 50%;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          .v_box {
            width: 100%;
            height: 50%;
          }
          .v_box:first-child {
            margin-bottom: 20px;
          }
        }
        .center_box {
          height: 100%;
          width: 480px;
          flex-shrink: 0;
        }
      }
    }
  }
}
.echarts_demos {
  width: 400px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-sizing: border-box;
  .echarts_box,
  .axis_box {
    width: 100%;
    height: 50%;
    border: 1px solid #278ff0;
    border-radius: 10px;
    background-color: rgba(13, 51, 118, 0.8);
    box-sizing: border-box;
  }
  .echarts_box {
    margin-bottom: 20px;
  }
}
.v_box {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #278ff0;
  border-radius: 10px;
  background-color: rgba(13, 51, 118, 0.8);
}
</style>
