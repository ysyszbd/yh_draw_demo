/*
 * @LastEditTime: 2024-04-08 11:47:44
 * @Description: 视频相关worker,只负责视频的数据接收
 */
import { decode } from "@msgpack/msgpack";
let ws,
  limitConnect = 10,
  timeConnect = 0;
let v_buffer = new SharedArrayBuffer(5000000),
  v_uni8 = new Float64Array(v_buffer),
  f_buffer,
  r_buffer,
  rf_buffer,
  rb_buffer,
  lf_buffer,
  lb_buffer,
  bev_buffer;
let old_key = 0;
self.onmessage = async (e) => {
  if (e.data.sign === "init") {
    webSocketInit(reconnect, webSocketInit);
  }
};
let f_u8, r_u8, rf_u8, rb_u8, lf_u8, lb_u8;
const webSocketInit = (reconnect, webSocketInit) => {
  ws = new WebSocket("ws://192.168.1.66:1234");
  ws.binaryType = "arraybuffer";
  ws.onopen = function () {
    console.log("已连接TCP服务器");
  };
  ws.onmessage = async (e) => {
    if (e.data instanceof ArrayBuffer) {
      let object = decode(e.data);
      if (object[1].length > 0) {
        f_buffer = v_uni8.slice(0, object[1][0].length);
        f_buffer.set(object[1][0]);
        rf_buffer = v_uni8.slice(0, object[1][1].length);
        rf_buffer.set(object[1][1]);
        lf_buffer = v_uni8.slice(0, object[1][2].length);
        lf_buffer.set(object[1][2]);
        r_buffer = v_uni8.slice(0, object[1][3].length);
        r_buffer.set(object[1][3]);
        lb_buffer = v_uni8.slice(0, object[1][4].length);
        lb_buffer.set(object[1][4]);
        rb_buffer = v_uni8.slice(0, object[1][5].length);
        rb_buffer.set(object[1][5]);
        postMessage({
          f_buffer,
          r_buffer,
          rf_buffer,
          rb_buffer,
          lf_buffer,
          lb_buffer,
          key: object[0],
          sign: "video",
        });
        f_buffer = null;
        r_buffer = null;
        rf_buffer = null;
        rb_buffer = null;
        lf_buffer = null;
        lb_buffer = null;
      }
      if (object[2][1] != 0) {
        // console.log(object, "object");
        let saf = await handleVO(object[2], object[4], object[0]);
        bev_buffer = v_uni8.slice(0, object[3].length);
        bev_buffer.set(object[3]);
        postMessage({
          bp: object[5],
          objs: saf.bev_objs,
          bev: bev_buffer,
          v_objs: saf.v_objs,
          key: object[0],
          sign: "bev",
        });
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
  if (limitConnect > 0) {
    limitConnect--;
    timeConnect++;
    console.log("第" + timeConnect + "次重连");

    setTimeout(function () {
      webSocketInit(reconnect, webSocketInit);
    }, 2000);
  } else {
    console.log("TCP连接已超时");
  }
};
// 计算点坐标数据
let view_i = {
    0: "foresight",
    1: "right_front",
    2: "left_front",
    3: "rearview",
    4: "left_back",
    5: "right_back",
  },
  view_ship = {
    foresight: 0,
    right_front: 1,
    left_front: 2,
    rearview: 3,
    left_back: 4,
    right_back: 5,
  },
  v_arr = [
    {
      sign: "foresight",
      index: 0,
      v_index: 0,
    },
    {
      sign: "right_front",
      index: 16,
      v_index: 1,
    },
    {
      sign: "left_front",
      index: 32,
      v_index: 2,
    },
    {
      sign: "rearview",
      index: 48,
      v_index: 3,
    },
    {
      sign: "left_back",
      index: 64,
      v_index: 4,
    },
    {
      sign: "right_back",
      index: 80,
      v_index: 5,
    },
  ],
  view_ship_arr = {
    foresight: 0,
    right_front: 16,
    left_front: 32,
    rearview: 48,
    left_back: 64,
    right_back: 80,
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
  pt_cam_z_num,
  transposeMatrix,
  i,
  j,
  e0,
  e1,
  obj_buffer,
  o_buffer,
  objs_buffer = [],
  os_buffer = [],
  arr,
  points_eight,
  empty_arr,
  empty,
  view_a;
async function handleVO(base, objs, key) {
  try {
    return new Promise(async (resolve, reject) => {
      objs_buffer = [];
      os_buffer = [];
      for (j = 0; j < objs.length; j++) {
        // console.log(objs[j][12], "lllllllll");
        empty = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
        arr = [];
        points_eight = await GetBoundingBoxPoints(
          ...objs[j].slice(0, 6),
          objs[j][9]
        );
        view_sign = {
          foresight: 0,
          right_front: 0,
          left_front: 0,
          rearview: 0,
          left_back: 0,
          right_back: 0,
        };
        view_a = {
          foresight: [],
          right_front: [],
          left_front: [],
          rearview: [],
          left_back: [],
          right_back: [],
        };
        obj_buffer = v_uni8.slice(0, 99);
        o_buffer = v_uni8.slice(0, objs[j].length);
        o_buffer.set(objs[j]);
        points_eight.filter((item) => {
          for (e0 in view_sign) {
            transposeMatrix = base[3][view_ship[e0]];
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
        v_arr.filter((ele) => {
          if (view_sign[ele.sign] === 8) {
            // arr.push(...empty);
            view_a[ele.sign].push(...[
              [-1, -1],
              [-1, -1],
              [-1, -1],
              [-1, -1],
              [-1, -1],
              [-1, -1],
              [-1, -1],
              [-1, -1],
            ]);
          } else {
            points_eight.filter((item, index) => {
              view_a[ele.sign].push(project_lidar2img(
                item,
                base[3][ele.v_index],
                base[4][ele.v_index],
                base[5],
                base[6][ele.v_index],
                base[8][ele.v_index]
              ));
            });
          }
          arr.push(...view_a[ele.sign].flat());
        });
        obj_buffer.set(arr, 3);
        obj_buffer.set([objs[j][7]], 0);
        obj_buffer.set([objs[j][8]], 1);
        obj_buffer.set([objs[j][12]], 2);
        objs_buffer.push(obj_buffer);
        os_buffer.push(o_buffer);
      }
      resolve({v_objs: objs_buffer, bev_objs: os_buffer});
    });
  } catch (err) {
    console.log(err, "err---handleVO");
  }
}
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
      let data = {
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
      let view_sign = {
        foresight: 0,
        rearview: 0,
        right_front: 0,
        right_back: 0,
        left_back: 0,
        left_front: 0,
      };
      data.points_eight.filter((item) => {
        for (e0 in view_sign) {
          let transposeMatrix = ext_lidar2cam[e0];
          let pt_cam_z_num =
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
