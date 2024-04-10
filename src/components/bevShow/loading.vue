<!--
 * @LastEditTime: 2024-03-27 15:20:39
 * @Description: 
-->
<template>
  <div class="loading_page">
    <img src="../../assets/images/logo.png" class="logo" alt="">
    <div class="loader"></div>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
.loading_page {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(
    to left,
    rgba(11, 54, 76, 0.98),
    #126db3,
    rgba(11, 54, 76, 0.98)
  );
  padding-top: 100px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  // justify-content: center;
  .logo {
    width: 200px;
    margin-bottom: 60px;
  }
  .text {
    color: #fff;
    font-size: 26px;
    margin-top: 50px;
  }
}

/* HTML: <div class="loader"></div> */
.loader {
  width: fit-content;
  font-weight: bold;
  font-family: monospace;
  font-size: 45px;
  background: radial-gradient(circle closest-side,#000 94%,#0000) right/calc(200% - 1em) 100%;
  animation: l24 1s infinite alternate linear;
}
.loader::before {
  content: "Loading...";
  line-height: 1em;
  color: #0000;
  background: inherit;
  background-image: radial-gradient(circle closest-side,#fff 94%,rgba(11, 54, 76, 1));
  -webkit-background-clip:text;
          background-clip:text;
}

@keyframes l24{
  100%{background-position: left}
}
</style>
