<!--
 * @LastEditTime: 2024-04-17 17:27:23
 * @Description: 
-->
<template>
  <div class="video_box">
    <div class="handle_box" :id="props.video_id + '_box'">
      <div class="v_text">{{ v_texts[props.video_id] }}</div>
      <canvas
        class="handle_box_canvas"
        :id="props.video_id + '_helper_box'"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  onMounted,
  defineExpose,
  onUnmounted,
  ref,
} from "vue";
import VIDEO from "@/controls/video/video.js";
const v_texts = {
  foresight: "前视",
  rearview: "后视",
  right_front: "右前",
  right_back: "右后",
  left_back: "左后",
  left_front: "左前",
}
const props = defineProps(["video_id"]);
const emits = defineEmits(["updataVideoStatus"]);
let yh_video = ref(null),
  video_work = new Worker(
    new URL("../../controls/video/ffmpeg_decode.js", import.meta.url),
    {
      type: "module",
    }
  );
onMounted(() => {
  yh_video.value = new VIDEO(props.video_id);
  initVideoWork();
});
function drawVideo(data) {
  return new Promise((resolve, reject) => {
    yh_video.value.drawVideo(data);
    resolve(`渲染${props.video_id}完毕`);
  });
}
function postVideo(u8Array, key, view) {
  return new Promise((resolve, reject) => {
    if (view != props.video_id) return;
    video_work.postMessage({
      video_data: u8Array,
      view: props.video_id,
      key: key,
    });
    resolve(`通知${view}解码~`);
  });
}
function initVideoWork() {
  video_work.onmessage = (event) => {
    if (event.data.type === "message") {
      if (event.data.info == "init") {
        changeCodecId(173);
      }
      if (event.data.info == "opencv_init") {
        video_work.postMessage({
          view: props.video_id,
          type: "opencv",
        });
      }
    } else {
      let message = event.data,
        info = message.info;
      if (info.width == 0 || info.height == 0) {
        return;
      }
      emits("updataVideoStatus", message);
    }
  };
}
// 清除视频占用内存
function clearVideo() {
  // yh_video.value.clear();
  // yh_video.value = null;
  video_work.terminate();
  // video_work = null;
}
function changeCodecId(val) {
  video_work.postMessage({
    type: "updateCodecId",
    info: val,
    id: props.video_id,
  });
}
defineExpose({
  postVideo,
  drawVideo,
});
onUnmounted(() => {
  clearVideo();
  video_work.postMessage({
    view: props.video_id,
    type: "clear",
  });
  video_work.terminate();
});
</script>

<style lang="scss" scoped>
.handle_box {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  //justify-content: center;
  // background: pink;
  .handle_box_canvas {
    //width: 100%;
    height: 100%;
    color: rgb(255, 255, 0);
    position: absolute;
    top: 0;
    // left: 0;
    transform-origin: 0 0;
    z-index: 1;
    border-radius: 3px;
  }
}
.v_text {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 5;
  font-size: 10px;
  color: #fff;
  padding: 1px 3px;
  border-radius: 3px 0 3px 0;
  background: rgba(0, 0, 0, .6);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
