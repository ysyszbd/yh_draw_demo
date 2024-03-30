/*
 * @LastEditTime: 2024-03-30 20:39:48
 * @Description:
 */
/*
 * @LastEditTime: 2024-03-29 16:21:28
 * @Description:./
 */
export default class Video {
  dom; // 外侧dom，利用该dom计算子元素宽高
  dom_w;
  dom_h;
  // 用来控制canvas大小的dom
  handle_box;
  // 3D线框 canvas元素--- 实际视频+线框的canvas
  helper_dom;
  helper_ctx;
  id = "";
  old_wh = {
    w: 0,
    h: 0,
  };
  v_canvas = new OffscreenCanvas(960, 480);
  v_context = null;
  imgData;
  v_objs_canvas = new OffscreenCanvas(960, 480);
  v_objs_cxt = null;
  box_color = {
    "0-0": "rgb(255, 0, 128)",
    "1-0": "rgb(0, 128, 255)",
    "1-1": "rgb(0,  255,  255)",
    "2-0": "rgb(150,  30, 150)",
    "2-1": "rgb(255,  0,  128)",
    "3-0": "rgb(192, 67, 100)",
    "4-0": "rgb(255, 255, 0)",
    "4-1": "rgb(255,  128,   0)",
    "5-0": "rgb(0, 255,  0)",
    "5-1": "rgb(0,  128, 128)",
  };
  constructor(id) {
    this.init(id);
  }
  // 获取所需的dom元素
  init(id) {
    this.dom = document.getElementById(id);
    let rect = this.dom.getBoundingClientRect();
    this.dom_w = rect.width  * document.documentElement.clientWidth / 1080;
    this.dom_h = rect.height  * document.documentElement.clientWidth / 1080;
    this.handle_box = document.getElementById(id + "_box");
    this.helper_dom = document.getElementById(id + "_helper_box");
    this.helper_ctx = this.helper_dom.getContext("2d", {
      willReadFrequently: true,
    });
    this.id = id;
  }
  async drawVideo(data) {
    // console.log(data,"data");
    // 使用canvas外部的元素来控制canvas的大小
    let w = 940;
    let h = 480;
    if (w != this.old_wh.w || h != this.old_wh.h) {
      let wh_obj = this.handleWH(w, h, this.dom_w, this.dom_h);
      this.old_wh = wh_obj;
      this.handle_box.style.width = wh_obj.w + "px";
      this.handle_box.style.height = wh_obj.h + "px";
    }
    if (this.helper_dom.width != w || this.helper_dom.height != h) {
      this.helper_dom.width = w;
      this.helper_dom.height = h;
    }
    this.helper_ctx.clearRect(0, 0, w, h);
    if (data.bg) {
      this.helper_ctx.drawImage(data.bg, 0, 0, w, h);
      data.bg.close();
    }
    if (data.obj) {
      // let objs = await this.drawVideoObjs(data.obj, this.id, data.key);
      this.helper_ctx.drawImage(data.obj, 0, 0, w, h);
      data.obj.close();
    }
  }
  drawVideoObjs(objs, view, key) {
    return new Promise((resolve, reject) => {
      this.v_objs_cxt = this.v_objs_canvas.getContext("2d");
      objs.filter((item) => {
        let color = this.box_color[`${item[7]}-${item[8]}`];
        let obj_data = item[item.length - 1][view];
        let arr = obj_data.filter((item) => {
          return item[0] === -1 && item[1] === -1;
        });
        if (arr.length === 8) return;
        this.v_objs_cxt.beginPath();
        this.v_objs_cxt.lineWidth = "1.4"; //线条 宽度
        this.v_objs_cxt.strokeStyle = color;
        this.v_objs_cxt.moveTo(obj_data[0][0], obj_data[0][1]); //移动到某个点；
        this.v_objs_cxt.lineTo(obj_data[1][0], obj_data[1][1]);
        this.v_objs_cxt.lineTo(obj_data[5][0], obj_data[5][1]);
        this.v_objs_cxt.lineTo(obj_data[7][0], obj_data[7][1]);
        this.v_objs_cxt.lineTo(obj_data[6][0], obj_data[6][1]);
        this.v_objs_cxt.lineTo(obj_data[2][0], obj_data[2][1]);
        this.v_objs_cxt.lineTo(obj_data[3][0], obj_data[3][1]);
        this.v_objs_cxt.lineTo(obj_data[1][0], obj_data[1][1]);
        this.v_objs_cxt.moveTo(obj_data[0][0], obj_data[0][1]);
        this.v_objs_cxt.lineTo(obj_data[2][0], obj_data[2][1]);
        this.v_objs_cxt.moveTo(obj_data[0][0], obj_data[0][1]);
        this.v_objs_cxt.lineTo(obj_data[4][0], obj_data[4][1]);
        this.v_objs_cxt.lineTo(obj_data[6][0], obj_data[6][1]);
        this.v_objs_cxt.moveTo(obj_data[4][0], obj_data[4][1]);
        this.v_objs_cxt.lineTo(obj_data[5][0], obj_data[5][1]);
        this.v_objs_cxt.moveTo(obj_data[3][0], obj_data[3][1]);
        this.v_objs_cxt.lineTo(obj_data[7][0], obj_data[7][1]);
        this.v_objs_cxt.stroke(); //描边
      });
      this.v_objs_cxt.fillStyle = "white";
      this.v_objs_cxt.fillRect(10, 20, 180, 30);
      this.v_objs_cxt.font = "24px serif";
      this.v_objs_cxt.fillStyle = "green";
      this.v_objs_cxt.fillText(key, 10, 40);
      resolve(this.v_objs_canvas.transferToImageBitmap());
    });
  }
  // 计算视频要放置在dom元素中的宽高--按照视频帧的比例来
  handleWH(imgW, imgH, domW, domH) {
    let w = imgW,
      h = imgH;
    if (domW != imgW || domH != imgH) {
      let box_w = domW - 15,
        box_h = domH - 15;
      if (imgW != box_w) {
        h = (box_w * imgH) / imgW;
        if (h > box_h) {
          w = (box_h * imgW) / imgH;
          h = box_h;
        } else {
          w = box_w;
        }
      }
    }
    return {
      w: w,
      h: h,
    };
  }
  clear() {
    this.dom = null;
    this.handle_box = null;
    this.helper_dom = null;
    this.helper_ctx = null;
  }
}
