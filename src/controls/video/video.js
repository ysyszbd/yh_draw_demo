/*
 * @LastEditTime: 2024-04-17 18:07:41
 * @Description:
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
  v_objs_canvas0 = new OffscreenCanvas(960, 480);
  v_objs_cxt0 = this.v_objs_canvas0.getContext("2d");
  box_color = {
    "0-0": "rgb(1, 121, 254)",
    "1-0": "rgb(0, 128, 255)",
    "1-1": "rgb(0,  255,  255)",
    "2-0": "rgb(150,  30, 150)",
    "2-1": "rgb(255,  0,  128)",
    "3-0": "rgb(192, 67, 100)",
    "4-0": "rgb(255, 255, 0)",
    "4-1": "rgb(255,  128,   0)",
    "5-0": "rgb(0, 255,  0)",
    // "5-1": "rgb(0,  128, 128)",
  };
  obj = {
    color: null,
    data: null,
    text: null,
    x: 0,
    y: 0,
    box: null,
  };
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
  mapx = null;
  mapy = null;
  dst = null;
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
    return new Promise(async (resolve, reject) => {
      // 使用canvas外部的元素来控制canvas的大小
      if (this.helper_dom.width != 960 || this.helper_dom.height != 480) {
        this.helper_dom.width = 960;
        this.helper_dom.height = 480;
      }
      if (data.bg) {
        await this.drawBG(data.bg);
      }
      if (data.v_o) {
        await this.drawObjs(data.v_o, data.key);
      }
      resolve("")
    })
  }
  drawBG(bg) {
    return new Promise((resolve, reject) => {
      this.helper_ctx.drawImage(bg, 0, 0, 960, 480);
      bg.close();
      resolve("视频渲染完毕");
    });
  }
  async drawObjs(objs, key) {
    return new Promise(async (resolve, reject) => {
      this.objs_img = await this.drawVideoObjs(objs, this.id, key);
      this.helper_ctx.drawImage(this.objs_img, 0, 0, 960, 480);
      this.objs_img.close();
      resolve("障碍物渲染完毕")
    });
  }
  // 各view渲染障碍物
  drawVideoObjs(objs, view, key) {
    return new Promise((resolve, reject) => {
      objs.filter((item) => {
        if (this.box_color[`${item[0]}-${item[1]}`]) {
          this.obj.color = this.box_color[`${item[0]}-${item[1]}`]
            ? this.box_color[`${item[0]}-${item[1]}`]
            : "black";
          this.obj.obj_data = [...item.slice(0, 3)];
          this.obj.box = construct2DArray(
            item.slice(
              this.view_ship_arr[view] + 3,
              this.view_ship_arr[view] + 19
            ),
            8,
            2
          );
          this.v_objs_cxt.beginPath();
          this.v_objs_cxt.fillStyle = this.obj.color;
          this.v_objs_cxt.font = "18px serif";
          this.obj.text = this.v_objs_cxt.measureText(this.obj.obj_data[2]);
          this.obj.x =
            (this.obj.box[7][0] - this.obj.box[6][0]) / 2 +
            this.obj.box[6][0] -
            this.obj.text.width / 2;
          this.obj.y = this.obj.box[6][1];
          this.v_objs_cxt.fillRect(
            this.obj.x - 1,
            this.obj.y - 18,
            this.obj.text.width + 1,
            18
          );
          this.v_objs_cxt.fillStyle = "#fff";
          this.v_objs_cxt.fillText(
            this.obj.obj_data[2],
            this.obj.x,
            this.obj.y
          );
          this.v_objs_cxt.lineWidth = "1.4"; //线条 宽度
          this.v_objs_cxt.strokeStyle = this.obj.color;
          this.drawBox(this.obj.box);
        } else {
          // let type = `${item[0]}-${item[1]}`;
          // console.log(type, "type");
        }
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
  clear() {
    this.dom = null;
    this.handle_box = null;
    this.helper_dom = null;
    this.helper_ctx = null;
  }
}
