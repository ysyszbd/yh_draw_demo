<template>
  <div class="my_page">
    <div class="page_title">
      <div class="title_box title_time">{{ now_time }}</div>
      <div class="title_text">
        <div class="big">易航智能-丹灵®BEV感知</div>
        <div class="little">W W W . Y I H A N G . A I</div>
      </div>
      <div class="title_box title_logo">
        <img src="@/assets/images/logo.png" alt="" class="logo" />
      </div>
    </div>
    <div class="bottom_box" id="bottom_box">
      <div class="left">
        <div class="v_title" id="v_title">前</div>
        <videoYH
          ref="foresight"
          id="foresight"
          :video_id="'foresight'"
          :class="[`v_1`, 'v_box']"
          @updataVideoStatus="updataVideoStatus"
        />
        <div class="v_title">左前</div>
        <videoYH
          ref="left_front"
          id="left_front"
          :video_id="'left_front'"
          :class="[`v_1`, 'v_box']"
          @updataVideoStatus="updataVideoStatus"
        />
        <div class="v_title">左后</div>
        <videoYH
          ref="left_back"
          id="left_back"
          :video_id="'left_back'"
          :class="[`v_1`, 'v_box']"
          @updataVideoStatus="updataVideoStatus"
        />
      </div>
      <div class="b_center_box">
        <Bev ref="BEV" />
        <div class="echarts_box">
          <div class="echart"></div>
          <div class="echart"></div>
        </div>
      </div>
      <div class="right">
        <div class="v_title">后</div>
        <videoYH
          ref="rearview"
          id="rearview"
          :video_id="'rearview'"
          :class="[`v_1`, 'v_box']"
          @updataVideoStatus="updataVideoStatus"
        />
        <div class="v_title">右前</div>
        <videoYH
          ref="right_front"
          id="right_front"
          :video_id="'right_front'"
          :class="[`v_1`, 'v_box']"
          @updataVideoStatus="updataVideoStatus"
        />
        <div class="v_title">右后</div>
        <videoYH
          ref="right_back"
          id="right_back"
          :video_id="'right_back'"
          :class="[`v_1`, 'v_box']"
          @updataVideoStatus="updataVideoStatus"
        />
      </div>
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
  provide,
} from "vue";
import { ObserverInstance } from "@/controls/event/observer";
import Ws from "@/controls/ws.js";
import { decode } from "@msgpack/msgpack";
import { formaData, handleObjsPoints } from "@/controls/box2img.js";
import memoryPool from "@/controls/memoryPool.js";

let foresight = ref(),
  rearview = ref(),
  right_front = ref(),
  right_back = ref(),
  left_back = ref(),
  left_front = ref(),
  BEV = ref(),
  MemoryPool = new memoryPool(),
  videoWorker = new Worker(
    new URL("../../controls/video/video_worker.js", import.meta.url),
    {
      type: "module",
    }
  ),
  time = ref(),
  videos_db = ref(null),
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
  v_height = ref(0),
  now_time = ref(formaData(new Date())),
  monthTime = ref(null),
  timeChange = ref(null),
  animationFrameId = ref(null),
  object = null,
  key = null,
  k = null,
  startTime = ref(0),
  timerId = ref(null),
  mmm = ref(new Map());
provide("MemoryPool", MemoryPool);
const videoInit = inject("videoInit");
// console.log(cv.initUndistortRectifyMap(), "-------------");
videoWorker.postMessage({ sign: "init" });
// 视频worker
videoWorker.onmessage = async (e) => {
  // console.log(e.data);
  // console.log(e.data.key, "e.data.key", mmm.value.size);
  // if (mmm.value.size < 3000) {
  //   if (e.data.key >= 1693337749691) {
  //     mmm.value.set(e.data.key, [e.data.bev, e.data.objs, e.data.bp]);
  //   }
  // } else {
  //   const obj = Object.fromEntries(mmm.value);
  //   console.log(obj, "obj");
  //   // return;
  // }
  // return;
  if (e.data.sign === "video") {
    // console.log("video111", e.data.key, video_ok_key.value);
    if (video_ok_key.value < 0) {
      Promise.all([
        await foresight.value.postVideo(
          e.data.f_buffer,
          e.data.key,
          "foresight"
        ),
        await right_front.value.postVideo(
          e.data.rf_buffer,
          e.data.key,
          "right_front"
        ),
        await left_front.value.postVideo(
          e.data.lf_buffer,
          e.data.key,
          "left_front"
        ),
        await rearview.value.postVideo(e.data.r_buffer, e.data.key, "rearview"),
        await left_back.value.postVideo(
          e.data.lb_buffer,
          e.data.key,
          "left_back"
        ),
        await right_back.value.postVideo(
          e.data.rb_buffer,
          e.data.key,
          "right_back"
        ),
      ]);
      return;
    }
    if (video_ok_key.value > 0) {
      let k = MemoryPool.keys.find((item) => {
        return item === e.data.key;
      });
      if (!k) {
        MemoryPool.keys.push(e.data.key);
        MemoryPool.setInitVideo(e.data.key, e.data.f_buffer, "foresight");
        MemoryPool.setInitVideo(e.data.key, e.data.r_buffer, "rearview");
        MemoryPool.setInitVideo(e.data.key, e.data.rf_buffer, "right_front");
        MemoryPool.setInitVideo(e.data.key, e.data.rb_buffer, "right_back");
        MemoryPool.setInitVideo(e.data.key, e.data.lb_buffer, "left_back");
        MemoryPool.setInitVideo(e.data.key, e.data.lf_buffer, "left_front");
      }
      if (MemoryPool.videosMap["foresight"].size > 0) {
        await updateVideo();
      }
      animate();
    } else {
      console.error("时间戳", e.data.key, video_ok_key.value);
    }
  }
  if (e.data.sign === "bev") {
    MemoryPool.bpMap.set(e.data.key, e.data.bp);
    MemoryPool.objsMap.set(e.data.key, e.data.objs);
    MemoryPool.v_o.set(e.data.key, e.data.v_objs);
    // MemoryPool.objs8Map.set(e.data.key, e.data.objs_8);
    // MemoryPool.besicMap.set(e.data.key, e.data.basic);
    // MemoryPool.vObjsMap.set(e.data.key, a);
    // MemoryPool.bevMap.set(e.data.key, e.data.bev);
  }
};
const props = defineProps(["videoStart"]);

animate();
async function animate() {
  now_time.value = formaData(new Date());
  // console.log("animate", Date.now());
  // console.log(MemoryPool.keys.length, "-------keys.length");
  if (MemoryPool.keys.length > 0) {
    let key = MemoryPool.keys.shift();
    MemoryPool.startK.push(key);
    if (MemoryPool.videosMap["foresight"].has(key)) {
      Promise.all([
        await foresight.value.postVideo(
          MemoryPool.getInitVideo(key, "foresight"),
          key,
          "foresight"
        ),
        await right_front.value.postVideo(
          MemoryPool.getInitVideo(key, "right_front"),
          key,
          "right_front"
        ),
        await left_front.value.postVideo(
          MemoryPool.getInitVideo(key, "left_front"),
          key,
          "left_front"
        ),
        await rearview.value.postVideo(
          MemoryPool.getInitVideo(key, "rearview"),
          key,
          "rearview"
        ),
        await left_back.value.postVideo(
          MemoryPool.getInitVideo(key, "left_back"),
          key,
          "left_back"
        ),
        await right_back.value.postVideo(
          MemoryPool.getInitVideo(key, "right_back"),
          key,
          "right_back"
        ),
      ]);
    }
  }
  // console.log(Date.now(), "ppppp");
  animationFrameId.value = requestAnimationFrame(() => {
    animate();
  });
}

// 更新视频--按照视频帧
async function updateVideo() {
  return new Promise(async (resolve, reject) => {
    if (!props.videoStart) videoInit();
    let key = MemoryPool.startK[0];
    // console.log(MemoryPool.objsMap.size, "objsMap.size");
    let objs = MemoryPool.objsMap.get(key),
      bevs_point = MemoryPool.bpMap.get(key);
    // basic = MemoryPool.besicMap.get(key),
    // objs8s = MemoryPool.objs8Map.get(key);
    // let v_objs = MemoryPool.vObjsMap.get(key);
    let v_o = MemoryPool.v_o.get(key);
    if (MemoryPool.hasVideo(key)) {
      Promise.all([
        await BEV.value.drawBev({
          objs: objs ? objs : null,
          bevs_point: bevs_point ? bevs_point : null,
        }),
        await foresight.value.drawVideo({
          bg: MemoryPool.getInitVideo(key, "foresight"),
          key: key,
          v_o: v_o,
        }),
        await right_front.value.drawVideo({
          bg: MemoryPool.getInitVideo(key, "right_front"),
          key: key,
          v_o: v_o,
        }),
        await left_front.value.drawVideo({
          bg: MemoryPool.getInitVideo(key, "left_front"),
          key: key,
          v_o: v_o,
        }),
        await rearview.value.drawVideo({
          bg: MemoryPool.getInitVideo(key, "rearview"),
          key: key,
          v_o: v_o,
        }),
        await left_back.value.drawVideo({
          bg: MemoryPool.getInitVideo(key, "left_back"),
          key: key,
          v_o: v_o,
        }),
        await right_back.value.drawVideo({
          bg: MemoryPool.getInitVideo(key, "right_back"),
          key: key,
          v_o: v_o,
        }),
      ]);
      await MemoryPool.delInitVideo(key);
      MemoryPool.startK.shift();
      MemoryPool.bpMap.delete(key);
      MemoryPool.objsMap.delete(key);
      MemoryPool.v_o.delete(key);
      MemoryPool.clearMaps(key);
      key = null;
    }
    resolve("");
  });
}
// 接受视频解码的数据，通知去离屏渲染
async function updataVideoStatus(message) {
  if (
    video_status_ok.value["foresight"] &&
    video_status_ok.value["rearview"] &&
    video_status_ok.value["right_front"] &&
    video_status_ok.value["right_back"] &&
    video_status_ok.value["left_back"] &&
    video_status_ok.value["left_front"]
  ) {
    MemoryPool.videosMap[message.view].set(message.key, null);
    MemoryPool.videosMap[message.view].set(message.key, message.info);
  } else {
    video_status_ok.value[message.view] = true;
    if (
      video_status_ok.value["foresight"] &&
      video_status_ok.value["rearview"] &&
      video_status_ok.value["right_front"] &&
      video_status_ok.value["right_back"] &&
      video_status_ok.value["left_back"] &&
      video_status_ok.value["left_front"]
    ) {
      video_ok_key.value = message.key;
    }
  }
}

onUnmounted(() => {
  MemoryPool.clear();
  videoWorker.terminate();
  ObserverInstance.removeAll();
  console.error("00000000000--onUnmounted");
  // cancelAnimationFrame(animationFrameId.value);
});
</script>

<style lang="scss" scoped>
.my_page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0a439a;
  background-image: url("@/assets/images/bg.png");
  background-repeat: no-repeat;
  background-size: 100% 100%;
  position: relative;
  box-sizing: border-box;
  padding: 0 10px 10px 10px;
  // padding: 0 35px 35px 35px;
}
.page_title {
  width: 100%;
  height: 100px;
  background: url("@/assets/images/title_bg.png") no-repeat;
  background-size: 90% 100%;
  background-position: center;
  position: relative;
  flex-shrink: 0;
  .title_box {
    width: 150px;
    height: 27px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .title_time {
    background: url("@/assets/images/time_bg.png") no-repeat;
    background-size: 100% 100%;
    width: 150px;
    height: 25px;
    position: absolute;
    top: 20px;
    left: 30px;
    color: #fff;
    font-size: 10px;
  }
  .title_text {
    height: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    box-sizing: border-box;
    padding-top: 23px;
    .big {
      display: inline-block;
      font-weight: 400;
      font-size: 23px;
      color: #ffffff;
      // line-height: 70px;
      background: linear-gradient(0deg, #9df5ff 0%, #ffffff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .little {
      width: 158px;
      height: 8px;
      font-family: SourceHanSansSC;
      font-weight: 400;
      font-size: 9px;
      color: #447baf;
    }
  }
  .title_logo {
    position: absolute;
    top: 20px;
    right: 67px;
    .logo {
      width: 88px;
    }
  }
}
.bottom_box {
  width: 100%;
  height: 100%;
  display: flex;
  // align-items: center;
  justify-content: center;
}
.left {
  width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.right {
  width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.v_title {
  width: 280px;
  height: 22px;
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding-left: 10px;
  background: linear-gradient(
    92deg,
    rgba(8, 37, 183, 0.6),
    rgba(1, 180, 255, 0.04)
  );
  color: #fff;
  flex-shrink: 0;
}
.v_box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 5px 0;
}
.b_center_box {
  width: 352px;
  height: 100%;
  margin: 0 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  .echarts_box {
    width: 100%;
    height: 102px;
    margin-top: 27px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    .echart {
      width: 162px;
      height: 104px;
      background: url("@/assets/images/echart_bg.png") no-repeat;
      background-size: 100% 100%;
    }
  }
}
</style>
