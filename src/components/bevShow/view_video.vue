<!--
 * @LastEditTime: 2024-04-07 15:16:30
 * @Description: 
-->
<template>
  <div class="video_box">
    <div class="handle_box" :id="props.video_id + '_box'">
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
  inject,
} from "vue";
import VIDEO from "@/controls/video/video.js";

const props = defineProps(["video_id"]);
const emits = defineEmits(["updataVideoStatus", "handleVideoInit"]);
let yh_video = ref(null);
let video_start = ref(false);
let video_work = new Worker(
  new URL("../../controls/video/ffmpeg_decode.js", import.meta.url).href
);
let key = ref(null);
let bg = ref(null);
const MemoryPool = inject("MemoryPool");
const videoInit = inject("videoInit");
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
    let params = {
      video_data: u8Array,
      view: props.video_id,
      key: key,
    };
    video_work.postMessage(params);
    resolve(`通知${view}解码~`);
  });
}
function initVideoWork() {
  video_work.onmessage = (event) => {
    if (event.data.type === "message") {
      if (event.data.info == "init") {
        changeCodecId(173);
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
  yh_video.value.clear();
  // yh_video.value = null;
  video_work.terminate();
  // video_work = null;
}
function changeCodecId(val) {
  let data = {
    type: "updateCodecId",
    info: val,
    id: props.video_id,
  };
  video_work.postMessage(data);
}
defineExpose({
  postVideo,
  drawVideo,
});
onUnmounted(() => {
  clearVideo();
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
  justify-content: center;
  .handle_box_canvas {
    // width: 100%;
    height: 100%;
    color: rgb(255, 255, 0);
    position: absolute;
    top: 0;
    // left: 0;
    transform-origin: 0 0;
    z-index: 1;
    border-radius: 5px;
  }
}
</style>
