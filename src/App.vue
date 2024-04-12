<script setup>
import mainPage from "@/components/bevShow/main.vue";
import loading from "@/components/bevShow/loading.vue";
import { ObserverInstance } from "@/controls/event/observer";
import { ref, onUnmounted, provide } from "vue";
let model3D_status = ref(false),
  video_start = ref(false),
  observerListenerList = [
    {
      eventName: "INIT_OK",
      fn: modelInit.bind(this),
    },
  ];
provide("videoInit", videoInit);
ObserverInstance.selfAddListenerList(observerListenerList, "yh_init");
function videoInit() {
  video_start.value = true;
}
function modelInit() {
  model3D_status.value = true;
}
onUnmounted(() => {
  ObserverInstance.removeAll();
});
</script>

<template>
  <div class="main_box">
    <!-- <loading /> -->
    <!-- <loading v-if="!model3D_status || !video_start" class="loading_page"/> -->
    <mainPage :videoStart="video_start" class="main_page" />
  </div>
</template>

<style lang="scss" scoped>
@import "./src/style/index.scss";
body {
  margin: 0;
}
.main_box {
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  .loading_page {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
  }
  .main_page {
    position: absolute;
    top: 0;
    left: 0;
  }
}
</style>
