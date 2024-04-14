/*
 * @LastEditTime: 2024-04-13 18:53:44
 * @Description:
 */

export function construct2DArray(original, m, n) {
  return original.length === m * n
    ? Array.from({ length: m }, (_, i) => original.slice(i * n, (i + 1) * n))
    : [];
}
export const video_basic = [
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
];
export const view_ship = {
  foresight: 0,
  right_front: 1,
  left_front: 2,
  rearview: 3,
  left_back: 4,
  right_back: 5,
};
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
  // console.log(scale, crop, "scale, crop");
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
  x_u = pt_cam_x / pt_cam_z;
  y_u = pt_cam_y / pt_cam_z;
  // x_u = pt_cam_x / Math.abs(pt_cam_z);
  // y_u = pt_cam_y / Math.abs(pt_cam_z);

  r2 = x_u * x_u + y_u * y_u;
  r4 = r2 * r2;
  r6 = r4 * r2;
  a1 = 2 * x_u * y_u;
  a2 = r2 + 2 * x_u * x_u;
  a3 = r2 + 2 * y_u * y_u;
  cdist = 1 + D[0] * r2 + D[1] * r4 + D[4] * r6;
  icdist2 = 1 / (1 + D[5] * r2 + D[6] * r4 + D[7] * r6);

  x_d = x_u * cdist * icdist2 + D[2] * a1 + D[3] * a2;
  y_d = y_u * cdist * icdist2 + D[2] * a3 + D[3] * a1;

  x_scale = scale[0] * (K[0] * x_d + K[2]);
  y_scale = scale[1] * (K[4] * y_d + K[5]);

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
    resolve([pt0, pt1, pt2, pt3, pt4, pt5, pt6, pt7]);
  });
}

// 计算点坐标数据
let view_i = {
    0: "foresight",
    1: "right_front",
    2: "left_front",
    3: "rearview",
    4: "left_back",
    5: "right_back",
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
  } catch (err) {
    console.log(err, "err-----");
  }
}
let scale = 51.2 / 30;
// 计算障碍物信息
export function handleObjs(objs_data) {
  // console.log(objs_data, "objs_data");
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
      // "5-1": { name: "street_cone", data: [] },
    };
    objs_data.filter((item) => {
      let type = `${item[7]}-${item[8]}`;
      if (obj_index[type]) {
        // console.log(item, "item");
        if (Math.abs(item[0]) <= 30 && Math.abs(item[1]) <= 30) {
          // item[2] = 0;
          obj_index[type].data.push(item);
        }
      }
    });
    // console.log(obj_index, "obj_index");
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
export function isLineStraight(points) {
  if (points.length < 3) {
    // 至少需要3个点来判断线条是否弯曲
    return true;
  }

  const getSlope = (p1, p2) => (p2[1] - p1[1]) / (p2.x - p1.x);
  const firstSlope = getSlope(points[0], points[1]);

  for (let i = 1; i < points.length - 1; i++) {
    const slope = getSlope(points[i], points[i + 1]);
    if (Math.abs(slope - firstSlope) > 1e-6) {
      // 斜率变化超过了允许的误差范围，线条可能是曲线
      return false;
    }
  }

  // 所有斜率近似相等，线条更像直线
  return true;
}
export let cameralatrix = {
  foresight: [
    954.0700073242188 / 2,
    0,
    966.5700073242188 / 2,
    0,
    954.0700073242188 / 2,
    536.8800048828125 / 2,
    0,
    0,
    1,
  ],
  rearview: [
    1962.0999755859375 / 2,
    0,
    962.7899780273438 / 2,
    0,
    1962.0999755859375 / 2,
    647.3599853515625 / 2 - 160,
    0,
    0,
    1,
  ],
  right_front: [
    1149.199951171875 / 2,
    0,
    962.0599975585938 / 2,
    0,
    1149.199951171875 / 2,
    647.2000122070312 / 2 - 160,
    0,
    0,
    1,
  ],
  right_back: [
    1153.199951171875 / 2,
    0,
    959.5599975585938 / 2,
    0,
    1153.199951171875 / 2,
    642.47998046875 / 2 - 160,
    0,
    0,
    1,
  ],
  left_back: [
    1153.4000244140625 / 2,
    0,
    960.1500244140625 / 2,
    0,
    1153.4000244140625 / 2,
    633.02001953125 / 2 - 160,
    0,
    0,
    1,
  ],
  left_front: [
    1149.199951171875 / 2,
    0,
    962.0599975585938 / 2,
    0,
    1149.199951171875 / 2,
    647.2000122070312 / 2 - 160,
    0,
    0,
    1,
  ],
};
export let distCoefis = {
  foresight: [
    0.544471025466919, 0.030316999182105064, -0.000028000000384054147,
    -0.000004999999873689376, -0.00039599998854100704, 0.9054499864578247,
    0.14028699696063995, 0,
  ],
  right_front: [
    0.5199699997901917, -0.289682000875473, 0.00011700000322889537,
    -0.000012000000424450263, -0.03207400068640709, 0.8908799886703491,
    -0.19602300226688385, -0.129271000623703,
  ],
  left_front: [
    0.5199699997901917, -0.289682000875473, 0.00011700000322889537,
    -0.000012000000424450263, -0.03207400068640709, 0.8908799886703491,
    -0.19602300226688385, -0.129271000623703,
  ],
  rearview: [
    -0.5068050026893616, 0.27776700258255005, -0.0007910000276751816,
    -0.0001630000042496249, -0.10025200247764587, 0, 0, 0,
  ],
  left_back: [
    0.6038810014724731, -0.1506589949131012, -0.000056000000768108293,
    -0.00013299999409355223, -0.01913899928331375, 0.9744619727134705,
    -0.024149000644683838, -0.07658100128173828,
  ],
  right_back: [
    3.760683059692383, 1.5822479724884033, 0.00021800000104121864,
    -0.00011700000322889537, 0.05919500067830086, 4.135602951049805,
    2.8630518913269043, 0.8628029823303223,
  ],
};
