/*
 * @LastEditTime: 2024-04-01 16:41:25
 * @Description:
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ObserverInstance } from "@/controls/event/observer";
import ResourceTracker from "@/controls/resourceTracker";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import skyVertexShader from "@/assets/shader/skyVertexShader.vs?raw";
import skyFragmentShader from "@/assets/shader/skyFragmentShader.fs?raw";
import roadFragmentShader from "@/assets/shader/roadFragmentShader.fs?raw";
import { handleObjs } from "@/controls/box2img.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

export default class bevImgContorl {
  resTracker = new ResourceTracker();
  track = this.resTracker.track.bind(this.resTracker);
  rgb_data = {
    dom: null,
    ctx: null,
  };
  bev = {
    dom: null,
    ctx: null,
  };
  scene;
  camera;
  renderer;
  particleSystem;
  scale = 51.2 / 30;
  lines = null;
  road = null;
  objs = {
    start: false,
    main_car: null,
    car: null,
    car_group: new THREE.Object3D(),
    car_whl: {},
    truck: null,
    truck_group: new THREE.Object3D(),
    truck_whl: {},
    construction_vehicle: null,
    construction_vehicle_group: new THREE.Object3D(),
    construction_vehicle_whl: {},
    bus: null,
    bus_group: new THREE.Object3D(),
    bus_whl: {},
    trailer: null,
    trailer_group: new THREE.Object3D(),
    trailer_whl: {},
    barrier: null,
    barrier_group: new THREE.Object3D(),
    barrier_whl: {},
    motorcycle: null,
    motorcycle_group: new THREE.Object3D(),
    motorcycle_whl: {},
    bicycle: null,
    bicycle_group: new THREE.Object3D(),
    bicycle_whl: {},
    pedestrian: null,
    pedestrian_group: new THREE.Object3D(),
    pedestrian_whl: {},
    street_cone: null,
    street_cone_group: new THREE.Object3D(),
    street_cone_whl: {},
  };
  material = null;
  geometry = null;
  mesh = null;
  mapBg = null;
  map = new Map();
  draw_time = [];
  lineColors = {
    1: "rgba(0, 255, 255, 1)",
    2: "rgba(128, 255, 128, 1)",
    3: "rgba(192, 71, 70, 1)",
  };

  constructor() {
    this.map.set(0, [80, 82, 79, 1]);
    this.map.set(1, [255, 255, 255, 1]);
    this.map.set(2, [0, 255, 0, 1]);
    this.map.set(3, [255, 0, 0, 1]);
    this.rgb_data.dom = document.getElementById("bev_box");
    // 初始化three
    this.init();
    // 初始化canvas，并在three上绘制网格，将canvas贴上去
    this.initBasicCanvas();
    this.animate();
  }
  // 释放道路占用的内存
  initRoadGroup() {
    if (this.road) {
      this.road.children.forEach((item) => {
        this.scene.remove(item);
        item.geometry.dispose();
        item.material.dispose();
      });
      this.scene.remove(this.road);
    }
    this.resTracker.dispose();
    this.road = null;
  }
  // 更新bev
  async getData(data) {
    try {
      if (!data.bevs_point) return;
      // console.log(data, "data]]]");
      return new Promise(async (resolve, reject) => {
        this.initLanesGroup();
        this.initRoadGroup();
        if (data?.info) {
          this.bev.ctx.drawImage(data.info, 0, 0);
          this.mapBg.needsUpdate = true;
        }
        if (data.bevs_point) {
          this.lines = new THREE.Group();
          // let arr3 = data.bevs_point.filter((item) => {
          //   return item[0] === 3;
          // });
          // if (arr3.length > 1) {
          //   this.road = new THREE.Object3D();
          //   const l_mesh = this.setMeshRoad(arr3[0][1], "left");
          //   this.road.add(l_mesh);
          //   const r_mesh = this.setMeshRoad(arr3[arr3.length - 1][1], "right");
          //   this.road.add(r_mesh);
          //   this.scene.add(this.road);
          // }
          // console.log(arr3, "arr3");
          for (let i = 0; i < data?.bevs_point.length; i++) {
            this.lines.add(
              this.setWidthLine(
                data.bevs_point[i][1],
                this.lineColors[data.bevs_point[i][0]]
              )
            );
          }
          this.scene.add(this.lines);
        }
        if (data.objs) {
          await this.handleObjs(await handleObjs(data.objs));
        }
        resolve("ppp");
      });
    } catch (err) {
      console.log(err, "err---getData");
    }
  }
  // 初始化道路元素
  setMeshRoad(points, directoin) {
    // console.log(points[0], directoin);
    try {
      let x0, x2, x1;
      if (directoin === "left") {
        x0 = -points[0][1] - 1;
      }
      if (directoin === "right") {
        x0 = -points[0][1] + 1;
      }

      const shapes = this.track(new THREE.Shape());
      shapes.moveTo(x0, points[0][0]);
      for (let i = 1; i < points.length; i++) {
        // console.log(points[i], "points[i]");
        if (directoin === "left") x2 = -points[i][1] - 1;
        if (directoin === "right") x2 = -points[i][1] + 1;
        shapes.lineTo(x2, points[i][0]);
      }
      for (let i = points.length - 1; i >= 0; i--) {
        if (directoin === "left") x1 = -points[i][1] - 10;
        if (directoin === "right") x1 = -points[i][1] + 8;
        shapes.lineTo(x1, points[i][0]);
      }
      // console.log(shapes, "shapes");
      const geometry = this.track(new THREE.ShapeGeometry(shapes));
      const material = this.track(
        new THREE.MeshBasicMaterial({
          color: "rgb(53, 52, 52)",
        })
      );
      const mesh = new THREE.Mesh(geometry, material);
      return mesh;
    } catch (err) {
      console.log(err, "err---setMeshRoad");
    }
  }
  // 释放线内存
  initLanesGroup() {
    // 释放资源
    // 车道线是一堆线，把之前的线清除掉后再生成新的线
    if (this.lines) {
      this.lines.children.forEach((item) => {
        this.scene.remove(item);
        item.geometry.dispose();
        item.material.dispose();
      });
      this.scene.remove(this.lines);
    }
    this.resTracker.dispose();
    this.lines = null;
  }
  // 绘制可以改变宽度的线条   dashed：true虚线、false实线
  setWidthLine(pointsArr, color = "rgb(80,190,225)") {
    try {
      // 处理坐标数据
      let points = this.handlePoints(pointsArr);
      const geometry = this.track(new LineGeometry());
      geometry.setPositions(points);
      const matLine = this.track(
        new LineMaterial({
          color: color,
          linewidth: 20,
          dashed: false,
          vertexColors: false,
        })
      );
      matLine.resolution.set(window.innerWidth, window.innerHeight);
      let line = new Line2(geometry, matLine);
      line.computeLineDistances();
      return line;
    } catch (err) {
      console.log(err, "err---setWidthLine");
    }
  }
  // 处理带宽度的线条坐标数据
  handlePoints(pointsArr) {
    // 处理坐标数据
    const points = [];
    pointsArr.forEach((item) => {
      points.push(-item[1], item[0], 0);
    });
    return points;
  }
  // 更新障碍物
  async handleObjs(objs_data) {
    return new Promise((resolve, reject) => {
      if (objs_data.length <= 0) return;
      for (let item in objs_data) {
        if (objs_data[item].data.length > 0) {
          // console.log(objs_data[item], "objs_data[item]");
          this.handle3D(objs_data[item].name, objs_data[item].data);
        } else {
          let group = this.objs[`${objs_data[item].name}_group`];
          group.children.forEach((item) => {
            this.scene.remove(item);
            group.remove(item);
          });
        }
      }
      resolve("---------");
    });
  }
  // 操作具体的障碍物
  async handle3D(type, data) {
    try {
      if (!this.objs.start) return;
      let group = this.objs[`${type}_group`],
        model = this.objs[type];
      if (group.children.length <= 0) {
        group.clear();
        for (let i = 0; i < data.length; i++) {
          let point = data[i];
          if (point[0] !== -1 && point[1] !== -1) {
            let c_model = model.scene.clone();
            c_model.matrixAutoUpdate = true;
            c_model.position.set(
              -point[1] * this.scale,
              point[0] * this.scale,
              point[2] * this.scale
            );
            // let size = this.ge3Dsize(c_model);
            // let s = point[5] / size.z;
            // c_model.scale.set(s, s, s);
            c_model.rotation.y = -point[9];
            group.add(c_model);
          }
        }
        this.scene.add(group);
      } else {
        if (group.children.length >= data.length) {
          for (let i = 0; i < data.length; i++) {
            group.children[i].position.set(
              -data[i][1] * this.scale,
              data[i][0] * this.scale,
              data[i][2] * this.scale
            );
            // let size = this.ge3Dsize(group.children[i]);
            // let s = data[5] / size.z;
            // group.children[i].scale.set(s, s, s);
            group.children[i].rotation.y = -data[i][9];
          }
          for (let j = data.length; j < group.children.length; j++) {
            this.scene.remove(group.children[j]);
            group.remove(group.children[j]);
          }
        } else {
          for (let i = 0; i < group.children.length; i++) {
            // let size = this.ge3Dsize(group.children[i]);
            // let s = data[5] / size.z;
            // group.children[i].scale.set(s, s, s);

            group.children[i].position.set(
              -data[i][1] * this.scale,
              data[i][0] * this.scale,
              data[i][2] * this.scale
            );
            group.children[i].rotation.y = -data[i][9];
          }

          for (let j = group.children.length; j < data.length; j++) {
            let l_c_model = model.scene.clone();
            // let size = this.ge3Dsize(l_c_model);
            // let s = data[5] / size.z;
            // l_c_model.scale.set(s, s, s);
            l_c_model.matrixAutoUpdate = true;
            l_c_model.position.set(
              -data[j][1] * this.scale,
              data[j][0] * this.scale,
              data[j][2] * this.scale
            );
            l_c_model.rotation.y = -data[j][9];
            group.add(l_c_model);
          }
          this.scene.add(group);
        }
      }
    } catch (err) {
      console.log(err, "err---handle3D");
    }
  }
  // 处理语义分割的数据，拿到所有路沿的位置坐标，按行列存储
  handleDataCanvas(bev_demo) {
    try {
      return new Promise((resolve, reject) => {
        let road = [];
        let now_h = -1;
        let road_empty = [-1, -1];
        for (let i = 0; i < bev_demo.length; i++) {
          // 判断该像素点是否为路沿,如果该像素点为路沿，则将该像素点加入road所在的行列三维数组中
          let arr = new Array(this.bev.dom.width).fill(null);
          road.push(arr);
          let points = [null, null];
          if (bev_demo[i] === 0) {
            points = this.getPoints(i, this.bev.dom.width);
            // 找到当前行
            if (points[0] != now_h) {
              now_h = points[0];
              if (road_empty[0] >= 0 && road_empty[1] < 0) {
                road_empty[1] = now_h;
              }
            }
            road[points[1]][points[0]] = points;
            road[points[1]] = road[points[1]].filter((item) => item !== null);
          }
          road[i] = road[i].filter((item) => item !== null);
          if (road[i].length === 0) {
            if (now_h >= 0 && road_empty[0] < 0 && road_empty[1] < 0) {
              road_empty[0] = this.getPoints(i, this.bev.dom.width)[1];
            }
          }
        }
        // console.log(road_empty, "road_empty");
        resolve(road);
      });
    } catch (err) {
      console.log(err, "err---handleDataCanvas");
    }
  }
  // 获取像素的坐标点，即像素点所在的行列值
  getPoints(i, w) {
    let w_i = 0,
      h_i = 0;
    h_i = Math.floor(i / w);
    w_i = i - w * h_i;
    return [w_i, h_i];
  }
  // 初始化threejs
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color().setHSL(0.6, 0, 1);
    this.scene.fog = new THREE.Fog(this.scene.background, 1, 5000);
    let rect = this.rgb_data.dom.getBoundingClientRect();
    var width = rect.width * 2 - 30;
    var height = rect.height * 2 - 30;
    // var width = (rect.width * document.documentElement.clientWidth) / 1080 - 26;
    // var height =
    //   (rect.height * document.documentElement.clientWidth) / 1080 - 26;
    // var height =
    //   rect.height -
    //   40 -
    //   document.getElementById("page_title").getBoundingClientRect().height;
    this.camera = new THREE.PerspectiveCamera(80, width / height, 1, 10000);
    this.camera.position.set(0, -5, 30);
    // this.camera.position.set(0, -15, 6);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrix();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.rgb_data.dom.appendChild(this.renderer.domElement);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 2.0;
    // this.setMesh();
    this.setAmbientLight();
    this.setControls();
    this.addSky();
    this.load3D();
  }
  // 初始化bev的canvas
  initBasicCanvas() {
    this.bev.dom = document.createElement("canvas");
    this.bev.ctx = this.bev.dom.getContext("2d", {
      willReadFrequently: true,
    });
    this.bev.dom.height = 200;
    this.bev.dom.width = 200;

    const devicePixelRatio = window.devicePixelRatio || 1;
    this.bev.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.bev.ctx.imageSmoothingEnabled = true;
    this.bev.ctx.imageSmoothingQuality = "high";
    this.bev.ctx.fillStyle = `#50524f`;
    this.bev.ctx.fillRect(0, 0, this.bev.dom.width, this.bev.dom.height);
    this.mapBg = this.track(new THREE.CanvasTexture(this.bev.dom));
    this.mapBg.colorSpace = THREE.SRGBColorSpace;
    this.mapBg.wrapS = this.mapBg.wrapT = THREE.RepeatWrapping;
    this.mapBg.magFilter = THREE.LinearFilter;
    this.mapBg.minFilter = THREE.LinearFilter;
    this.material = this.track(
      new THREE.MeshPhongMaterial({
        map: this.mapBg,
        side: THREE.DoubleSide,
      })
    );
    this.geometry = this.track(new THREE.PlaneGeometry(60, 60));
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }
  addSky() {
    const uniforms = {
      topColor: { value: new THREE.Color(0x0077ff) },
      bottomColor: { value: new THREE.Color(0xffffff) },
      offset: { value: 33 },
      exponent: { value: 0.8 },
    };
    uniforms["topColor"].value.copy(this.hemiLight.color);

    this.scene.fog.color.copy(uniforms["bottomColor"].value);
    const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: skyVertexShader,
      fragmentShader: skyFragmentShader,
      side: THREE.BackSide,
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
  }
  // 加载3D车模型
  async load3D() {
    try {
      const filesArr = [
        "main_car",
        "car",
        "truck",
        "construction_vehicle",
        "bus",
        "trailer",
        "barrier",
        "motorcycle",
        "bicycle",
        "pedestrian",
        "street_cone",
      ];
      const res = await Promise.all(filesArr.map(this.loadFile));
      this.objs.start = true;
      let size, s;
      res.forEach((item) => {
        this.objs[item.id] = item.gltf;
        let gltf = this.objs[item.id].scene;
        if (item.id === "main_car") {
          const box = this.track(new THREE.Box3().setFromObject(gltf)),
            center = box.getCenter(new THREE.Vector3());
          size = box.getSize(new THREE.Vector3());
          gltf.position.y = -(size.y / 2) - center.y;
          gltf.rotation.x = Math.PI / 2;
        } else if (item.id === "car") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.y = -100;
          gltf.position.x = -100;
          size = this.ge3Dsize(gltf);
          s = Math.min(1.7 / size.x);
          gltf.scale.set(s, s, s);
        } else if (item.id === "truck") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.y = -105;
          gltf.position.x = -105;
          size = this.ge3Dsize(gltf);
          s = 2.4 / size.x;
          gltf.scale.set(s, s, s);
        } else if (item.id === "bus") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.y = -125;
          gltf.position.x = -125;
          size = this.ge3Dsize(gltf);
          s = 2.5 / size.x;
          gltf.scale.set(s, s, s);
        } else if (item.id === "trailer") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.y = -135;
          gltf.position.x = -135;
          size = this.ge3Dsize(gltf);
          s = 2.1 / size.x;
          gltf.scale.set(s, s, s);
        } else if (item.id === "barrier") {
          gltf.rotation.x = Math.PI / 2;
          gltf.position.x = -145;
          gltf.position.y = -144;
        } else if (item.id === "motorcycle") {
          gltf.rotation.x = Math.PI / 2;
          gltf.position.x = 105;
          gltf.position.y = -124;
          size = this.ge3Dsize(gltf);
          s = 0.98 / size.x;
          gltf.scale.set(s, s, s);
        } else if (item.id === "bicycle") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.x = -123;
          gltf.position.y = -144;
          size = this.ge3Dsize(gltf);
          s = 0.45 / size.x;
          gltf.scale.set(s, s, s);
          // gltf.scale.set(0.02, 0.02, 0.02);
        } else if (item.id === "pedestrian") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI / 2 + Math.PI / 3;
          gltf.position.x = 120;
          gltf.position.y = -114;
          size = this.ge3Dsize(gltf);
          s = 1.65 / size.z;
          gltf.scale.set(s, s, s);
        } else if (item.id === "street_cone") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI / 2;
          gltf.position.x = 100;
          gltf.position.y = -147;
          size = this.ge3Dsize(gltf);
          s = 0.4 / size.z;
          gltf.scale.set(s, s, s);
        } else if (item.id === "construction_vehicle") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.x = 110;
          gltf.position.y = -105;
          size = this.ge3Dsize(gltf);
          s = 2.35 / size.x;
          gltf.scale.set(s, s, s);
        }
        if (item.id !== "main_car") {
          this.objs[`${item.id}_whl`] = this.ge3Dsize(gltf);
        }
        this.scene.add(gltf);
        gltf.matrixAutoUpdate = false;
        gltf.updateMatrix();
      });
      ObserverInstance.emit("INIT_OK", {
        id: "objs",
      });
    } catch (err) {
      console.log(err, "err===load3D");
    }
  }
  ge3Dsize(gltf) {
    const box = this.track(new THREE.Box3().setFromObject(gltf)),
      size = box.getSize(new THREE.Vector3());
    return size;
  }
  // 加载3d模型文件
  loadFile(url) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(
        `/car_model/${url}/scene.gltf`,
        (gltf) => {
          resolve({ gltf: gltf, id: url });
        },
        null,
        (err) => {
          reject(err);
        }
      );
    });
  }
  // 加载obj格式的3d模型
  async loadObj3D() {
    try {
      let obj = await this.loadObjFile("A/SM_MercedesBenzCoupeC");
      obj.scale.set(0.01, 0.01, 0.01);
      obj.rotation.x = Math.PI / 2;
      obj.rotation.y = Math.PI / 2;
      obj.position.x = 10;
      obj.position.y = -15;
      this.scene.add(obj);
    } catch (err) {
      console.log(err, "err===loadObj3D");
    }
  }
  // 加载obj格式的3d模型
  loadObjFile(name) {
    return new Promise((resolve, reject) => {
      new OBJLoader().load(`src/assets/objs_model/${name}.obj`, (root) => {
        resolve(root);
      });
    });
  }
  // 创建环境光
  setAmbientLight(intensity = 1, color = 0xffffff) {
    const light = new THREE.AmbientLight(color, intensity);
    this.scene.add(light);
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
    this.hemiLight.color.setHSL(0.6, 1, 0.6);
    this.hemiLight.position.set(0, 0, 50);
    this.scene.add(this.hemiLight);
    const hemiLightHelper = new THREE.HemisphereLightHelper(this.hemiLight, 10);
    this.scene.add(hemiLightHelper);
    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1, 1.75);
    dirLight.position.multiplyScalar(30);
    this.scene.add(dirLight);
  }
  // 添加控制器
  setControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  // 渲染循环
  animate = () => {
    // 清除深度缓存---很重要
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  };
  // 绘制辅助网格、坐标
  setMesh() {
    // 一格5单位
    let gridHelper = new THREE.GridHelper(
      60,
      60,
      "rgb(238, 14, 14)",
      "rgb(158, 156, 153)"
    );
    gridHelper.rotation.x = -(Math.PI / 2);
    const axesHelper = new THREE.AxesHelper(15);
    this.scene.add(axesHelper);
    this.scene.add(gridHelper);
  }
  // 清除掉所有内存
  clearFun() {
    console.log("clearFun");
    this.objs.car_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.car_group);
    this.objs.truck_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.truck_group);
    this.objs.construction_vehicle_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.construction_vehicle_group);
    this.objs.bus_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.bus_group);
    this.objs.trailer_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.trailer_group);
    this.objs.barrier_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.barrier_group);
    this.objs.motorcycle_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.motorcycle_group);
    this.objs.bicycle_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.bicycle_group);
    this.objs.pedestrian_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.pedestrian_group);
    this.objs.street_cone_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.street_cone_group);
    this.resTracker.dispose();
  }
}
