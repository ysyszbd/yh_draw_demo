/*
 * @LastEditTime: 2024-04-03 18:18:52
 * @Description:
 */
// import { K, D, ext_lidar2cam } from "../assets/demo_data/data";
// import { create, all } from "mathjs";
// // 创建mathjs实例
// const mathjs = create(all, {
//   number: "BigNumber",
//   precision: 20,
// });
// export const math = create(all, mathjs);

export function construct2DArray(original, m, n) {
  return original.length === m * n
    ? Array.from({ length: m }, (_, i) => original.slice(i * n, (i + 1) * n))
    : [];
}
// 将3d坐标转换为2D坐标
// ext转为4*4，k转为3*3
export function project_lidar2img(pts, ext_lidar2cam, K, scale, crop) {
  // 逆转矩阵
  // const transposeMatrix = math.inv(ext_lidar2cam);
  ext_lidar2cam = transposeMatrix;

  const pt_cam_x =
    pts[0] * ext_lidar2cam[0][0] +
    pts[1] * ext_lidar2cam[0][1] +
    pts[2] * ext_lidar2cam[0][2] +
    ext_lidar2cam[0][3];
  const pt_cam_y =
    pts[0] * ext_lidar2cam[1][0] +
    pts[1] * ext_lidar2cam[1][1] +
    pts[2] * ext_lidar2cam[1][2] +
    ext_lidar2cam[1][3];
  const pt_cam_z =
    pts[0] * ext_lidar2cam[2][0] +
    pts[1] * ext_lidar2cam[2][1] +
    pts[2] * ext_lidar2cam[2][2] +
    ext_lidar2cam[2][3];
  const x_u = pt_cam_x / Math.abs(pt_cam_z);
  const y_u = pt_cam_y / Math.abs(pt_cam_z);

  const x = K[0][0] * x_u + K[0][2];
  const y = K[1][1] * y_u + K[1][2];
  const x_scale = scale[0] * x;
  const y_scale = scale[1] * y;

  const x_crop = x_scale + crop[0];
  const y_crop = y_scale + crop[1];
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
export function GetBoundingBoxPoints(x, y, z, w, l, h, r_z) {
  return new Promise(async (resolve, reject) => {
    const cos_a = Math.cos(r_z - Math.PI / 2);
    const sin_a = Math.sin(r_z - Math.PI / 2);
    const half_l = l / 2;
    const half_w = w / 2;
    const half_h = h / 2;
    const pt0 = [
      cos_a * -half_w - sin_a * -half_l + x,
      sin_a * -half_w + cos_a * -half_l + y,
      z - half_h,
    ];
    const pt1 = [
      cos_a * half_w - sin_a * -half_l + x,
      sin_a * half_w + cos_a * -half_l + y,
      z - half_h,
    ];
    const pt2 = [
      cos_a * -half_w - sin_a * half_l + x,
      sin_a * -half_w + cos_a * half_l + y,
      z - half_h,
    ];
    const pt3 = [
      cos_a * half_w - sin_a * half_l + x,
      sin_a * half_w + cos_a * half_l + y,
      z - half_h,
    ];
    const pt4 = [
      cos_a * -half_w - sin_a * -half_l + x,
      sin_a * -half_w + cos_a * -half_l + y,
      z + half_h,
    ];
    const pt5 = [
      cos_a * half_w - sin_a * -half_l + x,
      sin_a * half_w + cos_a * -half_l + y,
      z + half_h,
    ];
    const pt6 = [
      cos_a * -half_w - sin_a * half_l + x,
      sin_a * -half_w + cos_a * half_l + y,
      z + half_h,
    ];
    const pt7 = [
      cos_a * half_w - sin_a * half_l + x,
      sin_a * half_w + cos_a * half_l + y,
      z + half_h,
    ];
    // const pt8 = [x, y, z];
    // resolve([pt8, pt8, pt8, pt8, pt8, pt8, pt8, pt8]);

    resolve([pt0, pt1, pt2, pt3, pt4, pt5, pt6, pt7]);
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
  K = {},
  ext_lidar2cam = {};
export async function handleObjsPoints(base, objs) {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 6; i++) {
      K[view_i[i]] = construct2DArray(base[4][i], 3, 3);
      ext_lidar2cam[view_i[i]] = construct2DArray(base[3][i], 4, 4);
    }
    for (let j = 0; j < objs.length; j++) {
      let data = {
        points_eight: [],
        foresight: [],
        rearview: [],
        right_front: [],
        right_back: [],
        left_back: [],
        left_front: [],
      };

      let a = objs[j].slice(0, 6);
      data.points_eight = await GetBoundingBoxPoints(...a, objs[j][9]);
      let view_sign = {
        foresight: 0,
        rearview: 0,
        right_front: 0,
        right_back: 0,
        left_back: 0,
        left_front: 0,
      };
      data.points_eight.filter((item) => {
        let pt_cam_z;
        for (let e in view_sign) {
          // const transposeMatrix = math.inv(ext_lidar2cam[e]);
          pt_cam_z =
            item[0] * transposeMatrix[2][0] +
            item[1] * transposeMatrix[2][1] +
            item[2] * transposeMatrix[2][2] +
            transposeMatrix[2][3];
          if (pt_cam_z < 0.2) {
            view_sign[e]++;
          }
        }
      });

      data.points_eight.filter((item) => {
        for (let e in view_sign) {
          if (view_sign[e] === 8) {
            data[e].push([-1, -1]);
          } else {
            data[e].push(
              project_lidar2img(item, ext_lidar2cam[e], K[e], base[5], base[6])
            );
          }
        }
      });
      objs[j].push(data);
    }
    resolve(objs);
  });
}
let scale = 51.2 / 30;
// 计算障碍物信息
export function handleObjs(objs_data) {
  return new Promise((resolve, reject) => {
    let obj_index = {
      "0-0": {
        name: "car",
        data: [],
      },
      "1-0": { name: "truck", data: [] },
      "1-1": { name: "construction_vehicle", data: [] },
      "2-0": { name: "bus", data: [] },
      "2-1": { name: "trailer", data: [] },
      "3-0": { name: "barrier", data: [] },
      "4-0": { name: "motorcycle", data: [] },
      "4-1": { name: "bicycle", data: [] },
      "5-0": { name: "pedestrian", data: [] },
      "5-1": { name: "street_cone", data: [] },
    };
    objs_data.filter((item) => {
      let type = `${item[7]}-${item[8]}`;
      if (obj_index[type]) {
        if (
          Math.abs(item[0] * scale) <= 30 &&
          Math.abs(item[1] * scale) <= 30
        ) {
          //   //   // obj_index[type].data.push(item);
          item[0] = item[0] * scale;
          item[1] = item[1] * scale;
          item[2] = 0;
          // item[2] += 1.9
          obj_index[type].data.push(item);
        }
      }
    });
    resolve(obj_index);
  });
}
export function formaData(timer) {
  const year = timer.getFullYear()
  const month = timer.getMonth() + 1 // 由于月份从0开始，因此需加1
  const day = timer.getDate()
  const hour = timer.getHours()
  const minute = timer.getMinutes()
  const second = timer.getSeconds()
  return `${pad(year, 4)}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`
}
export function pad(timeEl, total = 2, str = '0') {
  return timeEl.toString().padStart(total, str)
}
