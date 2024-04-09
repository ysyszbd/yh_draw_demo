import { construct2DArray } from "@/controls/box2img";

let imageBitmap, 
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
  },
  v_objs_canvas = new OffscreenCanvas(960, 480),
  v_objs_cxt = v_objs_canvas.getContext("2d"),
  color,
  obj_data,
  text,
  x,
  y;
onmessage = async (e) => {
    if (e.data.sign === "draw_objs") {

    }
}
// 各view渲染障碍物
function drawVideoObjs(objs, view, key) {
    return new Promise((resolve, reject) => {
      objs.filter((item) => {
        color = box_color[`${item[7]}-${item[8]}`];
        obj_data = item[item.length - 1][view];
        if (obj_data.length <= 0) return;
        v_objs_cxt.beginPath();
        v_objs_cxt.fillStyle = color;
        v_objs_cxt.font = "18px serif";
        text = v_objs_cxt.measureText(obj_data[12]);
        let x =
            (item[13][`${view}`][7][0] - item[13][`${view}`][6][0]) / 2 +
            item[13][`${view}`][6][0] -
            text.width / 2,
          y = item[13][`${view}`][6][1];
        v_objs_cxt.fillRect(x - 1, y - 18, text.width + 1, 18);
        v_objs_cxt.fillStyle = "#fff";
        v_objs_cxt.fillText(item[12], x, y);
        drawBox(obj_data);
      });
      v_objs_cxt.fillStyle = "white";
      v_objs_cxt.fillRect(10, 20, 180, 30);
      v_objs_cxt.font = "28px serif";
      v_objs_cxt.fillStyle = "green";
      v_objs_cxt.fillText(key, 10, 44);
      resolve(v_objs_canvas.transferToImageBitmap());
    });
  }
function drawBox(box) {
    v_objs_cxt.lineWidth = "1.4"; //线条 宽度
    v_objs_cxt.strokeStyle = color;
    v_objs_cxt.moveTo(box[0][0], box[0][1]); //移动到某个点；
    v_objs_cxt.lineTo(box[1][0], box[1][1]);
    v_objs_cxt.lineTo(box[5][0], box[5][1]);
    v_objs_cxt.lineTo(box[7][0], box[7][1]);
    v_objs_cxt.lineTo(box[6][0], box[6][1]);
    v_objs_cxt.lineTo(box[2][0], box[2][1]);
    v_objs_cxt.lineTo(box[3][0], box[3][1]);
    v_objs_cxt.lineTo(box[1][0], box[1][1]);
    v_objs_cxt.moveTo(box[0][0], box[0][1]);
    v_objs_cxt.lineTo(box[2][0], box[2][1]);
    v_objs_cxt.moveTo(box[0][0], box[0][1]);
    v_objs_cxt.lineTo(box[4][0], box[4][1]);
    v_objs_cxt.lineTo(box[6][0], box[6][1]);
    v_objs_cxt.moveTo(box[4][0], box[4][1]);
    v_objs_cxt.lineTo(box[5][0], box[5][1]);
    v_objs_cxt.moveTo(box[3][0], box[3][1]);
    v_objs_cxt.lineTo(box[7][0], box[7][1]);
    v_objs_cxt.stroke(); //描边
  }
  // 计算视频要放置在dom元素中的宽高--按照视频帧的比例来
function handleWH(imgW, imgH, domW, domH) {
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