<!--
 * @LastEditTime: 2024-04-03 16:35:39
 * @Description: 
-->
<template>
  <div class="rbg_demo" id="bev_box"></div>
</template>

<script setup>
import bevImgControl from "@/controls/bev/bevImgContorl.js";
import { onMounted, ref, onUnmounted, defineExpose } from "vue";
let Bev = ref(null);
function drawBev(data) {
  return new Promise(async (resolve, reject) => {
    await Bev.value.getData(data);
    resolve(`渲染bev完毕`);
  });
}
onMounted(() => {
  Bev.value = new bevImgControl();
});
onUnmounted(() => {
  // Bev.value.ObserverInstance.removeAll();
  Bev.value.clearFun();
  // Bev.value = null;
});
defineExpose({
  drawBev,
});
</script>

<style lang="scss" scoped>
.rbg_demo {
  width: 260px;
  // height: 100%;
  height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px !important;
  background: url("@/assets/images/bev_bg.png") no-repeat;
  background-size: 100% 100%;
  box-sizing: border-box;
  position: relative;
  canvas {
    width: 100% !important;
    height: 100% !important;
    border-radius: 8px !important;
    background:rgba(255,255,255,0);
    position: absolute;
    z-index: 1;
  }
  .yh_tag {
    box-shadow: 0 0 2px #00ffff inset;
    background: linear-gradient(#00ffff, #00ffff) left top,
      linear-gradient(#00ffff, #00ffff) left top,
      linear-gradient(#00ffff, #00ffff) right bottom,
      linear-gradient(#00ffff, #00ffff) right bottom;
    background-repeat: no-repeat;
    background-size: 1px 6px, 6px 1px;
    background-color: rgba(0, 0, 0, 0.4);
    color: #ffffff !important;
    font-size: 16px;
    padding: 4px 10px;
  }
}
</style>
