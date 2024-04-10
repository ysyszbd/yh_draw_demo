export default class Ws {
  constructor(url, isBin, fn) {
    this.webSocketInit(url, isBin, fn, this.reconnect, this.webSocketInit);
    this.limitConnect = 10;
    this.timeConnect = 0;
  }

  webSocketInit = (url, isBin, fn, reconnect, webSocketInit) => {
    var ws = new WebSocket(url);
    
    if (isBin) {
      ws.binaryType = 'arraybuffer';
      // console.log(ws.bufferedAmount);
    }
    ws.onopen = function () {
      this.timeConnect = 0;
      console.log("已连接TCP服务器");
    };
    ws.onmessage = fn;
    ws.onclose = () => {
      console.log('服务器已经断开');
      this.reconnect(url, isBin, fn, reconnect, webSocketInit);
    };
  }

  reconnect = (url, isBin, fn, reconnect, webSocketInit) => {
    // if (this.limitConnect > 0) {
      // this.limitConnect--;
      this.timeConnect++;
      console.log("第" + this.timeConnect + "次重连");

      setTimeout(function () {
        this.webSocketInit(url, isBin, fn, reconnect, webSocketInit);
      }, 1000);

    // } else {
    //   console.log("TCP连接已超时");
    // }
  }
}