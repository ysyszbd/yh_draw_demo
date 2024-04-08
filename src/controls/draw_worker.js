let v_objs,
  f_imageBitmap,
  r_imageBitmap,
  rf_imageBitmap,
  rb_imageBitmap,
  lb_imageBitmap,
  lf_imageBitmap;
onmessage = async (e) => {
  // if (e.data.sign === "bev_init") {
  //   webSocketInit(reconnect, webSocketInit);
  // }
  if (e.data.sign === "draw_bev&objs") {
    v_objs = await handleObjsPoints(e.data.basic_data, e.data.objs);
    // console.log(v_objs, "v_objs");
    f_imageBitmap = await drawVideoObjs(v_objs, "foresight", e.data.key);
    r_imageBitmap = await drawVideoObjs(v_objs, "rearview", e.data.key);
    rf_imageBitmap = await drawVideoObjs(v_objs, "right_front", e.data.key);
    rb_imageBitmap = await drawVideoObjs(v_objs, "right_back", e.data.key);
    lb_imageBitmap = await drawVideoObjs(v_objs, "left_back", e.data.key);
    lf_imageBitmap = await drawVideoObjs(v_objs, "left_front", e.data.key);
    postMessage(
      {
        sign: e.data.sign,
        key: e.data.key,
        v_o: v_objs,
        f_imageBitmap,
        r_imageBitmap,
        rf_imageBitmap,
        rb_imageBitmap,
        lb_imageBitmap,
        lf_imageBitmap,
      },
      [
        f_imageBitmap,
        r_imageBitmap,
        rf_imageBitmap,
        rb_imageBitmap,
        lb_imageBitmap,
        lf_imageBitmap,
      ]
    );
    v_objs = null;
    f_imageBitmap = null;
    r_imageBitmap = null;
    rf_imageBitmap = null;
    rb_imageBitmap = null;
    lb_imageBitmap = null;
    lf_imageBitmap = null;
  }
};
let ws,
  limitConnect = 10,
  timeConnect = 0;
const webSocketInit = (reconnect, webSocketInit) => {
  ws = new WebSocket("ws://192.168.1.161:1234");
  ws.binaryType = "arraybuffer";
  ws.onopen = function () {
    console.log("已连接TCP服务器");
  };
  ws.onmessage = (e) => {
    if (e.data instanceof ArrayBuffer) {
      let object = decode(e.data);
      if (object[1].length > 0) {
        postMessage(
          {
            key: object[0],
            v_data: object[1],
          },
          [object[1][0].buffer]
        );
      }
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
let map = new Map();
map.set(0, [80, 82, 79, 1]);
map.set(1, [255, 255, 255, 1]);
map.set(2, [0, 255, 0, 1]);
map.set(3, [255, 0, 0, 1]);
let bev_canvas = new OffscreenCanvas(200, 200),
  bev_context = bev_canvas.getContext("2d");
// 渲染bev
function drawBev(key) {
  return new Promise((resolve, reject) => {
    bev_context.fillStyle = "white";
    bev_context.fillRect(10, 20, 180, 30);
    bev_context.font = "18px serif";
    bev_context.fillStyle = "blue";
    bev_context.fillText(key, 10, 40);
    resolve(bev_canvas.transferToImageBitmap());
  });
}
let box_color = {
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
let v_objs_canvas = new OffscreenCanvas(960, 480),
  v_objs_cxt = v_objs_canvas.getContext("2d"),
  color,
  obj_data,
  text,
  x,
  y;
// 各view渲染障碍物
function drawVideoObjs(objs, view, key) {
  return new Promise((resolve, reject) => {
    
    objs.filter((item) => {
      color = "rgba(255, 255, 255, 0.3)";
      // color = box_color[`${item[7]}-${item[8]}`];
      obj_data = item[item.length - 1][view];
      if (obj_data.length <= 0) return;
      v_objs_cxt.beginPath();
      v_objs_cxt.fillStyle = color;
      v_objs_cxt.font = "18px serif";
      text = v_objs_cxt.measureText(item[12]);
      x =
        (item[13][`${view}`][7][0] - item[13][`${view}`][6][0]) / 2 +
        item[13][`${view}`][6][0] -
        text.width / 2;
      y = item[13][`${view}`][6][1];
      v_objs_cxt.fillRect(x - 4, y - 18, text.width + 1, 18);
      v_objs_cxt.fillStyle = "#fff";
      v_objs_cxt.fillText(item[12], x, y);
      v_objs_cxt.lineWidth = "1.4"; //线条 宽度
      v_objs_cxt.strokeStyle = color;
      v_objs_cxt.moveTo(obj_data[0][0], obj_data[0][1]); //移动到某个点；
      v_objs_cxt.lineTo(obj_data[1][0], obj_data[1][1]);
      v_objs_cxt.lineTo(obj_data[5][0], obj_data[5][1]);
      v_objs_cxt.lineTo(obj_data[7][0], obj_data[7][1]);
      v_objs_cxt.lineTo(obj_data[6][0], obj_data[6][1]);
      v_objs_cxt.lineTo(obj_data[2][0], obj_data[2][1]);
      v_objs_cxt.lineTo(obj_data[3][0], obj_data[3][1]);
      v_objs_cxt.lineTo(obj_data[1][0], obj_data[1][1]);
      v_objs_cxt.moveTo(obj_data[0][0], obj_data[0][1]);
      v_objs_cxt.lineTo(obj_data[2][0], obj_data[2][1]);
      v_objs_cxt.moveTo(obj_data[0][0], obj_data[0][1]);
      v_objs_cxt.lineTo(obj_data[4][0], obj_data[4][1]);
      v_objs_cxt.lineTo(obj_data[6][0], obj_data[6][1]);
      v_objs_cxt.moveTo(obj_data[4][0], obj_data[4][1]);
      v_objs_cxt.lineTo(obj_data[5][0], obj_data[5][1]);
      v_objs_cxt.moveTo(obj_data[3][0], obj_data[3][1]);
      v_objs_cxt.lineTo(obj_data[7][0], obj_data[7][1]);
      v_objs_cxt.stroke(); //描边
    });
    v_objs_cxt.fillStyle = "white";
    v_objs_cxt.fillRect(10, 60, 180, 30);
    v_objs_cxt.font = "20px serif";
    v_objs_cxt.fillStyle = "green";
    v_objs_cxt.fillText(key, 10, 80);
    resolve(v_objs_canvas.transferToImageBitmap());
  });
}
// 计算点坐标数据
let view_i = {
    0: "foresight",
    3: "rearview",
    1: "right_front",
    5: "right_back",
    4: "left_back",
    2: "left_front",
  },
  view_ship = {
    foresight: 0,
    rearview: 3,
    right_front: 1,
    right_back: 5,
    left_back: 4,
    left_front: 2,
  },
  K = {},
  D = {},
  ext_lidar2cam = {},
  crop = {},
  data = {
    points_eight: [],
    foresight: [],
    rearview: [],
    right_front: [],
    right_back: [],
    left_back: [],
    left_front: [],
  },
  view_sign = {
    foresight: 0,
    rearview: 0,
    right_front: 0,
    right_back: 0,
    left_back: 0,
    left_front: 0,
  },
  obj_buffer,
  pt_cam_z_num,
  transposeMatrix,
  i,
  j,
  e0,
  e1;
async function handleObjsPoints(base, objs) {
  return new Promise(async (resolve, reject) => {
    for (i = 0; i < 6; i++) {
      K[view_i[i]] = base[4][i];
      ext_lidar2cam[view_i[i]] = base[3][i];
      D[view_i[i]] = base[8][i];
      crop[view_i[i]] = base[6][i];
    }
    // console.log(objs, "objs");
    for (j = 0; j < objs.length; j++) {
      data = {
        points_eight: [],
        foresight: [],
        rearview: [],
        right_front: [],
        right_back: [],
        left_back: [],
        left_front: [],
      };

      data.points_eight = await GetBoundingBoxPoints(
        ...objs[j].slice(0, 6),
        objs[j][9]
      );
      view_sign = {
        foresight: 0,
        rearview: 0,
        right_front: 0,
        right_back: 0,
        left_back: 0,
        left_front: 0,
      };
      data.points_eight.filter((item) => {
        for (e0 in view_sign) {
          transposeMatrix = ext_lidar2cam[e0];
          pt_cam_z_num =
            item[0] * transposeMatrix[8] +
            item[1] * transposeMatrix[9] +
            item[2] * transposeMatrix[10] +
            transposeMatrix[11];
          if (pt_cam_z_num < 0.2) {
            view_sign[e0]++;
          }
        }
      });
      for (e1 in view_sign) {
        if (view_sign[e1] === 8) {
          data[e1] = [];
        } else {
          data.points_eight.filter((item) => {
            data[e1].push(
              project_lidar2img(
                item,
                ext_lidar2cam[e1],
                K[e1],
                base[5],
                crop[e1],
                D[e1]
              )
            );
          });
        }
      }
      objs[j].push(data);
    }
    resolve(objs);
  });
}
// 将3d坐标转换为2D坐标
// ext转为4*4，k转为3*3
let pt_cam_x,
  pt_cam_y,
  pt_cam_z,
  x_u,
  y_u,
  x_scale,
  y_scale,
  x_crop,
  y_crop,
  r2,
  r4,
  r6,
  a1,
  a2,
  a3,
  cdist,
  icdist2,
  x_d,
  y_d;
function project_lidar2img(pts, ext_lidar2cam, K, scale, crop, D) {
  pt_cam_x =
    pts[0] * ext_lidar2cam[0] +
    pts[1] * ext_lidar2cam[1] +
    pts[2] * ext_lidar2cam[2] +
    ext_lidar2cam[3];
  pt_cam_y =
    pts[0] * ext_lidar2cam[4] +
    pts[1] * ext_lidar2cam[5] +
    pts[2] * ext_lidar2cam[6] +
    ext_lidar2cam[7];
  pt_cam_z =
    pts[0] * ext_lidar2cam[8] +
    pts[1] * ext_lidar2cam[9] +
    pts[2] * ext_lidar2cam[10] +
    ext_lidar2cam[11];
  // x_u = pt_cam_x / pt_cam_z;
  // y_u = pt_cam_y / pt_cam_z;
  // console.log(pt_cam_x, pt_cam_y, pt_cam_z)
  x_u = pt_cam_x / Math.abs(pt_cam_z);
  y_u = pt_cam_y / Math.abs(pt_cam_z);
  // console.log(x_u, y_u)
  // console.log(D)

  // r2 = x_u * x_u + y_u * y_u;
  // r4 = r2 * r2;
  // r6 = r4 * r2;
  // a1 = 2 * x_u * y_u;
  // a2 = r2 + 2 * x_u * x_u;
  // a3 = r2 + 2 * y_u * y_u;
  // cdist = 1 + D[0] * r2 + D[1] * r4 + D[4] * r6;
  // icdist2 = 1 / (1 + D[5] * r2 + D[6] * r4 + D[7] * r6);

  // x_d = x_u * cdist * icdist2 + D[2] * a1 + D[3] * a2;
  // y_d = y_u * cdist * icdist2 + D[2] * a3 + D[3] * a1;
  // console.log(x_d, y_d)

  x_scale = scale[0] * (K[0] * x_u + K[2]);
  y_scale = scale[1] * (K[4] * y_u + K[5]);
  // console.log(K)

  // console.log(crop, "crop");
  // crop = [0, -80]
  // if (crop[1] == -160) crop[1] = -80;
  // crop[1] == -160;

  x_crop = x_scale + crop[0];
  y_crop = y_scale + crop[1];
  return [x_crop, y_crop];
}
//    pt0 -- pt1
//   / |    / |
// pt2 -- pt3 |
//  |  |   |  |
//  | pt4 -- pt5
//  | /    | /
// pt6 -- pt7
// 计算盒子的8个点坐标
let cos_a,
  sin_a,
  half_l,
  half_w,
  half_h,
  pt0,
  pt1,
  pt2,
  pt3,
  pt4,
  pt5,
  pt6,
  pt7;
function GetBoundingBoxPoints(x, y, z, w, l, h, r_z) {
  return new Promise(async (resolve, reject) => {
    cos_a = Math.cos(r_z - Math.PI / 2);
    sin_a = Math.sin(r_z - Math.PI / 2);
    half_l = l / 2;
    half_w = w / 2;
    half_h = h / 2;
    pt0 = [
      cos_a * -half_w - sin_a * -half_l + x,
      sin_a * -half_w + cos_a * -half_l + y,
      z - half_h,
    ];
    pt1 = [
      cos_a * half_w - sin_a * -half_l + x,
      sin_a * half_w + cos_a * -half_l + y,
      z - half_h,
    ];
    pt2 = [
      cos_a * -half_w - sin_a * half_l + x,
      sin_a * -half_w + cos_a * half_l + y,
      z - half_h,
    ];
    pt3 = [
      cos_a * half_w - sin_a * half_l + x,
      sin_a * half_w + cos_a * half_l + y,
      z - half_h,
    ];
    pt4 = [
      cos_a * -half_w - sin_a * -half_l + x,
      sin_a * -half_w + cos_a * -half_l + y,
      z + half_h,
    ];
    pt5 = [
      cos_a * half_w - sin_a * -half_l + x,
      sin_a * half_w + cos_a * -half_l + y,
      z + half_h,
    ];
    pt6 = [
      cos_a * -half_w - sin_a * half_l + x,
      sin_a * -half_w + cos_a * half_l + y,
      z + half_h,
    ];
    pt7 = [
      cos_a * half_w - sin_a * half_l + x,
      sin_a * half_w + cos_a * half_l + y,
      z + half_h,
    ];
    resolve([pt0, pt1, pt2, pt3, pt4, pt5, pt6, pt7]);
  });
}
