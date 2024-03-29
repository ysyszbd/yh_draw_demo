<!--
 * @LastEditTime: 2024-03-27 18:06:14
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
  })
}
onMounted(() => {
  Bev.value = new bevImgControl();
});
onUnmounted(() => {
  Bev.value.ObserverInstance.removeAll();
  // Bev.value.clearFun();
  // Bev.value = null;
});
defineExpose({
  drawBev
});
</script>

<style lang="scss" scoped>
.rbg_demo {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px !important;
  box-sizing: border-box;
  canvas {
    width: 100% !important;
    height: 100% !important;  
    border-radius: 8px !important;
  }
}
</style>