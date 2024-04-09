/*
 * @LastEditTime: 2024-04-08 11:46:31
 * @Description:
 */
/*
 * @LastEditTime: 2024-03-29 16:21:28
 * @Description:./
 */
import { construct2DArray } from "@/controls/box2img";
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
  v_objs_cxt = this.v_objs_canvas.getContext("2d");
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
  color;
  obj_data;
  text;
  x;
  y;
  old_objs = null;
  view_ship_arr = {
    foresight: 0,
    right_front: 16,
    left_front: 32,
    rearview: 48,
    left_back: 64,
    right_back: 80,
  };
  objs_img = null;
  constructor(id) {
    this.init(id);
  }
  // 获取所需的dom元素
  init(id) {
    this.dom = document.getElementById(id);
    // let rect = this.dom.getBoundingClientRect();
    // this.dom_w = rect.width  * document.documentElement.clientWidth / 1080;
    // this.dom_h = rect.height  * document.documentElement.clientWidth / 1080;
    this.handle_box = document.getElementById(id + "_box");
    this.helper_dom = document.getElementById(id + "_helper_box");
    this.helper_ctx = this.helper_dom.getContext("2d", {
      willReadFrequently: true,
    });
    this.id = id;
  }
  async drawVideo(data) {
    // 使用canvas外部的元素来控制canvas的大小
    let w = 940;
    let h = 480;
    // console.log(data.objs, "data");
    if (this.helper_dom.width != w || this.helper_dom.height != h) {
      this.helper_dom.width = w;
      this.helper_dom.height = h;
    }
    // this.helper_ctx.clearRect(0, 0, w, h);
    if (data.bg) {
      this.helper_ctx.drawImage(data.bg, 0, 0, w, h);
      data.bg.close();
    }
    if (data.objs) {
      this.objs_img = await this.drawVideoObjs(data.objs, this.id, data.key);
      this.helper_ctx.drawImage(this.objs_img, 0, 0, w, h);
      this.objs_img.close();
      this.objs_img = null;
    }
  }
  // 各view渲染障碍物
  drawVideoObjs(objs, view, key) {
    return new Promise((resolve, reject) => {
      objs.filter((item) => {
        this.color = this.box_color[`${item[7]}-${item[8]}`];
        // this.color = this.box_color[`${item[0]}-${item[1]}`];
        // this.obj_data = [
        //   ...item.slice(0, 3),
        //   ...item.slice(
        //     this.view_ship_arr[view] + 3,
        //     this.view_ship_arr[view] + 19
        //   ),
        // ];
        this.obj_data = item[item.length - 1][view];
        // let box = construct2DArray(item.slice(
        //   this.view_ship_arr[view] + 3,
        //   this.view_ship_arr[view] + 19
        // ), 8, 2);
        if (this.obj_data.length <= 0) return;
        this.v_objs_cxt.beginPath();
        this.v_objs_cxt.fillStyle = this.color;
        this.v_objs_cxt.font = "18px serif";
        // let points = item.slice(this.view_ship_arr[this.id], 16);
        // console.log(this.obj_data, "this.obj_data", view);
        this.text = this.v_objs_cxt.measureText(this.obj_data[12]);
        // this.text = this.v_objs_cxt.measureText(this.obj_data[2]);
        // let x =
        //     (box[7][0] - box[6][0]) / 2 +
        //     box[6][0] -
        //     this.text.width / 2,
        //   y = box[6][1];
        let x =
            (item[13][`${view}`][7][0] - item[13][`${view}`][6][0]) / 2 +
            item[13][`${view}`][6][0] -
            this.text.width / 2,
          y = item[13][`${view}`][6][1];
        this.v_objs_cxt.fillRect(x - 1, y - 18, this.text.width + 1, 18);
        this.v_objs_cxt.fillStyle = "#fff";
        this.v_objs_cxt.fillText(item[12], x, y);
        // this.v_objs_cxt.fillText(this.obj_data[2], x, y);
        this.drawBox(this.obj_data);
      });
      this.v_objs_cxt.fillStyle = "white";
      this.v_objs_cxt.fillRect(10, 20, 180, 30);
      this.v_objs_cxt.font = "28px serif";
      this.v_objs_cxt.fillStyle = "green";
      this.v_objs_cxt.fillText(key, 10, 44);
      resolve(this.v_objs_canvas.transferToImageBitmap());
    });
  }
  drawBox(box) {
    this.v_objs_cxt.lineWidth = "1.4"; //线条 宽度
    this.v_objs_cxt.strokeStyle = this.color;
    this.v_objs_cxt.moveTo(box[0][0], box[0][1]); //移动到某个点；
    this.v_objs_cxt.lineTo(box[1][0], box[1][1]);
    this.v_objs_cxt.lineTo(box[5][0], box[5][1]);
    this.v_objs_cxt.lineTo(box[7][0], box[7][1]);
    this.v_objs_cxt.lineTo(box[6][0], box[6][1]);
    this.v_objs_cxt.lineTo(box[2][0], box[2][1]);
    this.v_objs_cxt.lineTo(box[3][0], box[3][1]);
    this.v_objs_cxt.lineTo(box[1][0], box[1][1]);
    this.v_objs_cxt.moveTo(box[0][0], box[0][1]);
    this.v_objs_cxt.lineTo(box[2][0], box[2][1]);
    this.v_objs_cxt.moveTo(box[0][0], box[0][1]);
    this.v_objs_cxt.lineTo(box[4][0], box[4][1]);
    this.v_objs_cxt.lineTo(box[6][0], box[6][1]);
    this.v_objs_cxt.moveTo(box[4][0], box[4][1]);
    this.v_objs_cxt.lineTo(box[5][0], box[5][1]);
    this.v_objs_cxt.moveTo(box[3][0], box[3][1]);
    this.v_objs_cxt.lineTo(box[7][0], box[7][1]);
    this.v_objs_cxt.stroke(); //描边
  }
  // 计算视频要放置在dom元素中的宽高--按照视频帧的比例来
  handleWH(imgW, imgH, domW, domH) {
    let w = 960,
      h = 480;
    if (domW != imgW || domH != imgH) {
      let box_w = domW - 15,
        box_h = domH - 15;
      if (imgW != box_w) {
        h = (box_w * imgH) / imgW;
        console.log(h, "");
        if (h > box_h) {
          h = box_h;
          w = (box_h * imgW) / imgH;
        } else {
          w = (h * imgW) / imgH;
          // w = box_w;
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
