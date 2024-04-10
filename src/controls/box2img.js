/*
 * @LastEditTime: 2024-04-08 11:59:49
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
export function project_lidar2img(pts, ext_lidar2cam, K, scale, crop, D) {
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
  arr,
  points_eight,
  empty_arr;
export async function handleObjsPoints(base, objs) {
  try {
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
  }catch(err) {
    console.log(err, "err-----");
  }
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
          Math.abs(item[0] * scale) <= 51.2 &&
          Math.abs(item[1] * scale) <= 51.2
        ) {
          //   //   // obj_index[type].data.push(item);
          // item[0] = item[0];
          // item[1] = item[1];
          // item[0] = item[0] * scale;
          // item[1] = item[1] * scale;
          item[2] = 0;
          // item[9] += 0.5;
          // item[2] += 1.9
          obj_index[type].data.push(item);
        }
      }
    });
    resolve(obj_index);
  });
}
export function formaData(timer) {
  const year = timer.getFullYear();
  const month = timer.getMonth() + 1; // 由于月份从0开始，因此需加1
  const day = timer.getDate();
  const hour = timer.getHours();
  const minute = timer.getMinutes();
  const second = timer.getSeconds();
  return `${pad(year, 4)}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(
    minute
  )}:${pad(second)}`;
}
export function pad(timeEl, total = 2, str = "0") {
  return timeEl.toString().padStart(total, str);
}
