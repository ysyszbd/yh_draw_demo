/*
 * @LastEditTime: 2024-04-01 18:07:24
 * @Description: 视频相关worker,只负责视频的数据接收
 */
import { decode } from "@msgpack/msgpack";
let db,
  ws,
  limitConnect = 10,
  timeConnect = 0,
  v_buffer = new SharedArrayBuffer(300000),
  v_uni8 = new Uint8Array(v_buffer);
self.onmessage = async (e) => {
    if (e.data.sign === "init") {
      webSocketInit(reconnect, webSocketInit)
    }
};
let f_u8, r_u8, rf_u8, rb_u8, lf_u8, lb_u8;
const webSocketInit = (reconnect, webSocketInit) => {
  ws = new WebSocket("ws://192.168.1.200:1234");
  ws.binaryType = "arraybuffer";
  ws.onopen = function () {
    console.log("已连接TCP服务器");
  };
  ws.onmessage = (e) => {
    if (e.data instanceof ArrayBuffer) {
      let object = decode(e.data);
      if (object[1].length > 0) {
        // f_u8 = object[1][0];
        // r_u8 = object[1][3];
        // rf_u8 = object[1][1];
        // rb_u8 = object[1][5];
        // lf_u8 = object[1][4];
        // lb_u8 = object[1][2];
        postMessage({
            // f_u8, r_u8, rf_u8, rb_u8, lf_u8, lb_u8, 
            key: object[0],
            v_data: object[1]
        }, [object[1][0].buffer])
      }
      // console.log(object, "eee");
    }
  };
  ws.onclose = () => {
    console.log("服务器已经断开");
    reconnect(reconnect, webSocketInit);
  };
};
const reconnect = (reconnect, webSocketInit) => {
  if (this.limitConnect > 0) {
    limitConnect--;
    timeConnect++;
    console.log("第" + this.timeConnect + "次重连");

    setTimeout(function () {
      webSocketInit(reconnect, webSocketInit);
    }, 2000);
  } else {
    console.log("TCP连接已超时");
  }
};
