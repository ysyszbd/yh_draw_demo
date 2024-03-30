<template>
  <div class="my_page">
    <div class="page_title">
      <div class="title_box title_time">{{ getTime() }}</div>
      <div class="title_text">
        <div class="big">易航智能-丹灵®BEV感知</div>
        <div class="little">W W W . Y I H A N G . A I</div>
      </div>
      <div class="title_box title_logo">
        <img src="@/assets/images/logo.png" alt="" class="logo" />
      </div>
    </div>
    <div class="bottom_box">
      <div class="left">
        <div class="v_title">前</div>
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
} from "vue";
import { ObserverInstance } from "@/controls/event/observer";
import Ws from "@/controls/ws.js";
import { decode } from "@msgpack/msgpack";
import { handleObjs } from "@/controls/box2img.js";
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
  time = ref(),
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
    MemoryPool.bevsBgMap.set(e.data.key, e.data.imageBitmap);
    MemoryPool.setOVimg(e.data.key, e.data.v_obj["foresight"], "foresight");
    MemoryPool.setOVimg(e.data.key, e.data.v_obj["rearview"], "rearview");
    MemoryPool.setOVimg(e.data.key, e.data.v_obj["right_front"], "right_front");
    MemoryPool.setOVimg(e.data.key, e.data.v_obj["right_back"], "right_back");
    MemoryPool.setOVimg(e.data.key, e.data.v_obj["left_back"], "left_back");
    MemoryPool.setOVimg(e.data.key, e.data.v_obj["left_front"], "left_front");
  }
};
const props = defineProps(["initStatus"]);

const ws = new Ws("ws://192.168.1.161:1234", true, async (e) => {
  try {
    if (!props.initStatus) return;
    if (e.data instanceof ArrayBuffer) {
      let object = decode(e.data);

      if (video_ok_key.value < 0) {
        // 唤醒解码器
        if (object[1].length > 0) {
          Promise.all([
            await foresight.value.postVideo(
              object[1][0],
              object[0],
              "foresight"
            ),
            await right_front.value.postVideo(
              object[1][1],
              object[0],
              "right_front"
            ),
            await left_front.value.postVideo(
              object[1][2],
              object[0],
              "left_front"
            ),
            await rearview.value.postVideo(object[1][3], object[0], "rearview"),
            await left_back.value.postVideo(
              object[1][4],
              object[0],
              "left_back"
            ),
            await right_back.value.postVideo(
              object[1][5],
              object[0],
              "right_back"
            ),
          ]);
        }
      }
      if (video_ok_key.value > 0 && object[0] > video_ok_key.value) {
        let key = object[0];
        let k = MemoryPool.keys.find((item) => {
          return item === key;
        });
        if (!k && object[1].length > 0) MemoryPool.keys.push(key);
        // console.log(object);
        if (object[1].length > 0) {
          MemoryPool.setInitVideo(key, object[1][0], "foresight");
          MemoryPool.setInitVideo(key, object[1][3], "rearview");
          MemoryPool.setInitVideo(key, object[1][1], "right_front");
          MemoryPool.setInitVideo(key, object[1][5], "right_back");
          MemoryPool.setInitVideo(key, object[1][4], "left_back");
          MemoryPool.setInitVideo(key, object[1][2], "left_front");
        }
        if (object[2][1] != 0) {
          MemoryPool.bpMap.set(key, object[5]);
          MemoryPool.objsMap.set(key, object[4]);
          MemoryPool.besicMap.set(key, object[2]);
        }
        if (MemoryPool.startK.length > 4) {
          await updateVideo();
        }
      }
    }
  } catch (err) {
    console.log(err, "err----WS");
  }
});
animate();
async function animate() {
  if (MemoryPool.keys.length > 2) {
    let key = MemoryPool.keys.shift();
    MemoryPool.startK.push(key);
    // console.log(MemoryPool.videosMap["foresight"], "ppppppppppppp")
    // console.log(key, "-------------通知子组件解码", Date.now());
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
    ]).then((res) => {
      MemoryPool.delInitVideo(key);
    });
    if (MemoryPool.objsMap.has(key)) {
      drawWorker.postMessage({
        sign: "draw_bev&objs",
        key: key,
        objs: MemoryPool.objsMap.get(key),
        basic_data: MemoryPool.besicMap.get(key),
      });
      MemoryPool.besicMap.delete(key);
    }
  }
  animationFrameId.value = requestAnimationFrame(() => animate());
}

// 更新视频--按照视频帧
async function updateVideo() {
  return new Promise(async (resolve, reject) => {
    let key = MemoryPool.startK[0];
    let objs = MemoryPool.objsMap.get(key),
      bev = MemoryPool.bevsBgMap.get(key),
      bevs_point = MemoryPool.bpMap.get(key);
    if (MemoryPool.hasVideo(key)) {
      Promise.all([
        await BEV.value.drawBev({
          objs: objs ? objs : null,
          info: bev ? bev : null,
          bevs_point: bevs_point ? bevs_point : null,
        }),
        await foresight.value.drawVideo({
          bg: MemoryPool.getVmap(key, "foresight"),
          obj: MemoryPool.getOVimg(key, "foresight"),
          key: key,
        }),
        await right_front.value.drawVideo({
          bg: MemoryPool.getVmap(key, "right_front"),
          obj: MemoryPool.getOVimg(key, "right_front"),
          key: key,
        }),
        await left_front.value.drawVideo({
          bg: MemoryPool.getVmap(key, "left_front"),
          obj: MemoryPool.getOVimg(key, "left_front"),
          key: key,
        }),
        await rearview.value.drawVideo({
          bg: MemoryPool.getVmap(key, "rearview"),
          obj: MemoryPool.getOVimg(key, "rearview"),
          key: key,
        }),
        await left_back.value.drawVideo({
          bg: MemoryPool.getVmap(key, "left_back"),
          obj: MemoryPool.getOVimg(key, "left_back"),
          key: key,
        }),
        await right_back.value.drawVideo({
          bg: MemoryPool.getVmap(key, "right_back"),
          obj: MemoryPool.getOVimg(key, "right_back"),
          key: key,
        }),
      ]);
      MemoryPool.startK.shift();
      MemoryPool.bpMap.delete(key);
      MemoryPool.bevsBgMap.delete(key);
      MemoryPool.delOVimg(key);
      MemoryPool.delVmap(key);
      MemoryPool.objsMap.delete(key);
      key = null;
    }
    resolve("");
    // }
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
    // if (message.view === "foresight") {
    //   console.log(
    //     message.key,
    //     "-------------主线程父组件拿到子组件传递过来的解码后数据",
    //     Date.now()
    //   );
    // }
    MemoryPool.setVmap(message.key, message.info, message.view);
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
getTime();
function getTime() {
  let t = new Date().toJSON().split("T");
  return `${t[0]} ${t[1].split(".")[0]}`;
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
  background-image: url("@/assets/images/bg.png");
  background-repeat: no-repeat;
  background-size: 100% 100%;
  position: relative;
  box-sizing: border-box;
  padding: 0 35px 35px 35px;
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
}
.v_box {
  width: 100%;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
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
