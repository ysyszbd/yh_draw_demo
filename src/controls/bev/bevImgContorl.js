/*
 * @LastEditTime: 2024-04-09 21:49:23
 * @Description:
 */
/*
 * @LastEditTime: 2024-04-02 15:39:23
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
import {
  CSS3DRenderer,
  CSS3DSprite,
  CSS3DObject,
} from "three/examples/jsm/renderers/CSS3DRenderer.js";

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
  renderer2;
  controls;
  controls2;
  scale = 51.2 / 30;
  lines = {
    geometry: null,
    group: new THREE.Group(),
  };
  dom_width = 0;
  dom_height = 0;
  road = null;
  objs = {
    start: false,
    main_car: null,
    car: null,
    car_group: new THREE.Object3D(),
    car_tags: new THREE.Object3D(),
    car_rot: Math.PI / 2,
    car_whl: {},
    truck: null,
    truck_group: new THREE.Object3D(),
    truck_tags: new THREE.Object3D(),
    truck_rot: Math.PI,
    truck_whl: {},
    construction_vehicle: null,
    construction_vehicle_group: new THREE.Object3D(),
    construction_vehicle_tags: new THREE.Object3D(),
    construction_vehicle_rot: Math.PI,
    construction_vehicle_whl: {},
    bus: null,
    bus_group: new THREE.Object3D(),
    bus_tags: new THREE.Object3D(),
    bus_rot: Math.PI,
    bus_whl: {},
    trailer: null,
    trailer_group: new THREE.Object3D(),
    trailer_tags: new THREE.Object3D(),
    trailer_rot: Math.PI,
    trailer_whl: {},
    barrier: null,
    barrier_group: new THREE.Object3D(),
    barrier_tags: new THREE.Object3D(),
    barrier_rot: 0,
    barrier_whl: {},
    motorcycle: null,
    motorcycle_group: new THREE.Object3D(),
    motorcycle_tags: new THREE.Object3D(),
    motorcycle_rot: 0,
    motorcycle_whl: {},
    bicycle: null,
    bicycle_group: new THREE.Object3D(),
    bicycle_tags: new THREE.Object3D(),
    bicycle_rot: Math.PI / 2,
    bicycle_whl: {},
    pedestrian: null,
    pedestrian_group: new THREE.Object3D(),
    pedestrian_tags: new THREE.Object3D(),
    pedestrian_rot: Math.PI / 2 + Math.PI / 3,
    pedestrian_whl: {},
    street_cone: null,
    street_cone_group: new THREE.Object3D(),
    street_cone_tags: new THREE.Object3D(),
    street_cone_rot: Math.PI / 2,
    street_cone_whl: {},
    tags_group: new THREE.Object3D(),
  };
  obj_index = {
    "0-0": "car",
    "1-0": "truck",
    "1-1": "construction_vehicle",
    "2-0": "bus",
    "2-1": "trailer",
    "3-0": "barrier",
    "4-0": "motorcycle",
    "4-1": "bicycle",
    "5-0": "pedestrian",
    "5-1": "street_cone",
  };
  material = null;
  geometry = null;
  mesh = null;
  mapBg = null;
  lineColors = {
    1: "rgba(0, 255, 255, 1)",
    2: "rgba(128, 255, 128, 1)",
    3: "rgba(192, 71, 70, 1)",
  };
  animationFrameId = null;
  map = new Map();
  bev_canvas = new OffscreenCanvas(200, 200);
  bev_context = null;
  bev_imgData;
  points_g = new THREE.Object3D();

  constructor() {
    this.map.set(0, [80, 82, 79, 1]);
    this.map.set(1, [255, 255, 255, 1]);
    this.map.set(2, [0, 255, 0, 1]);
    this.map.set(3, [255, 0, 0, 1]);
    this.rgb_data.dom = document.getElementById("bev_box");
    // 初始化three
    this.init();
    // 初始化canvas，并在three上绘制网格，将canvas贴上去
    // this.initBasicCanvas();
    this.initPoints();
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
        if(data.bev) {
          this.bev_imgData = await this.drawBev(data.bev);
          console.log(this.bev_imgData, "this.bev_imgData");
          this.bev.ctx.drawImage(this.bev_imgData, 0, 0);
          this.bev_imgData.close();
          this.bev_imgData = null;
          this.mapBg.needsUpdate = true;
        }
        if (data.bevs_point) {
          // console.log(data.bevs_point, "data.bevs_point");
          this.handleLine(data.bevs_point);
          // this.setPoints(data.bevs_point);
        }
        if (data.objs) {
          // console.log();
          await this.handleObjs(await handleObjs(data.objs));
        }
        resolve("ppp");
      });
    } catch (err) {
      console.log(err, "err---getData");
    }
  }
  drawBev(bev) {
    return new Promise((resolve, reject) => {
      this.bev_context = this.bev_canvas.getContext("2d");
      this.imgData = new ImageData(200, 200);
      for (let i = 0; i < this.imgData.data.length; i += 4) {
        let num = bev[i / 4];
        let color = this.map.get(num);
        this.imgData.data[i + 0] = color[0];
        this.imgData.data[i + 1] = color[1];
        this.imgData.data[i + 2] = color[2];
        this.imgData.data[i + 3] = 255;
      }
      this.bev_context.putImageData(this.imgData, 0, 0);
      resolve(this.bev_canvas.transferToImageBitmap());
    });
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
  // 绘制可以改变宽度的线条   dashed：true虚线、false实线
  setWidthLine(pointsArr, color = "rgb(80,190,225)") {
    try {
      // 处理坐标数据
      let points = this.handlePoints(pointsArr, "line");
      const geometry = this.track(
        new LineGeometry({
          linewidth: 20,
        })
      );
      geometry.setPositions(points);
      const matLine = this.track(
        new LineMaterial({
          color: color,
          linewidth: 10,
          dashed: false,
          vertexColors: false,
        })
      );
      matLine.polygonOffset = true;
      matLine.polygonOffsetFactor = 1;
      matLine.polygonOffsetUnits = 1;

      matLine.resolution.set(this.dom_width, this.dom_height);
      // matLine.resolution.set(window.innerWidth, window.innerHeight);
      let line = this.track(new Line2(geometry, matLine));
      line.computeLineDistances();
      return line;
    } catch (err) {
      console.log(err, "err---setWidthLine");
    }
  }
  initPoints() {
    this.pointsGeometry = new THREE.BufferGeometry();
    this.pointsMaterial = new THREE.PointsMaterial({
      color: 0xff0000,
      size: 0.8, // 设置点的大小
      sizeAttenuation: true // 确定点的大小是否随着距离摄像机远近而衰减
    });
  }
  setPoints(bevs_point) {
    if (this.points_g.children.length !== 0) {
      this.points_g.children.forEach((item) => {
        this.scene.remove(item);
        item.geometry.dispose();
        item.material.dispose();
      });
      this.scene.remove(this.points_g);
      this.points_g.clear();
    }
    bevs_point.forEach((item) => {
      let p_g = this.pointsGeometry.clone();
      let points_arr = this.handlePoints(item[1], "line");
      p_g.setAttribute('position', new THREE.Float32BufferAttribute(points_arr, 3));
      let p_m = this.pointsMaterial.clone();
      const clonedPoints = new THREE.Points(p_g, p_m);
      
      this.points_g.add(clonedPoints);
      this.scene.add(this.points_g);
    })
  }
  // 处理带宽度的线条坐标数据
  handlePoints(pointsArr, sign = "bev") {
    // 处理坐标数据
    if (sign === "line") {
      const points = new Float32Array(200 * 3);
      for(let i = 0; i < points.length; i+=3) {
        let data0 = pointsArr[i * 5];
        if (data0) {
          points[i+0] = -data0[1];
          points[i+1] = data0[0];
          points[i+2] = 0;
        }else {
          points[i+0] = -pointsArr[pointsArr.length - 1][1];
          points[i+1] = pointsArr[pointsArr.length - 1][0];
          points[i+2] = 0;
        }
      }
      return points;
    }
    
  }
  // 更新障碍物
  async handleObjs(objs_data) {
    // console.log(objs_data, "objs_data");
    return new Promise((resolve, reject) => {
      for (let item in objs_data) {
        this.handle3D(objs_data[item].name, objs_data[item].data);
      }
      resolve("---------");
    });
  }
  async handleLine(bevs_point) {
    if (this.lines.group.children.length <= 0) {
      bevs_point.forEach((item) => {
        let line = this.setWidthLine(item[1], this.lineColors[item[0]]);
        this.lines.group.add(line);
      });
      this.scene.add(this.lines.group);
    } 
    else {

      if (this.lines.group.children.length > 50) {
        console.log("大于50---lines");
        for (let j = 50; j < this.lines.group.children.length; j++) {
          this.scene.remove(this.lines.group.children[j]);
          this.lines.group.children[j].geometry.dispose();
          this.lines.group.children[j].material.dispose();
          this.lines.group.remove(this.lines.group.children[j]);
        }
      }

      if (this.lines.group.children.length >= bevs_point.length) {
        // console.log("llllll");
        for (let i = 0; i < bevs_point.length; i++) {
          let points = this.handlePoints(bevs_point[i][1], "line");
          this.lines.group.children[i].geometry.setPositions(points);
          this.lines.group.children[i].geometry.attributes.position.needsUpdate = true;
          this.lines.group.children[i].material.color.set(
            this.lineColors[bevs_point[i][0]]
          );
          this.lines.group.children[i].material.needsUpdate = true;
        }
        for (
          let j = bevs_point.length;
          j < this.lines.group.children.length;
          j++
        ) {
          this.lines.group.children[j].geometry.setPositions([
            100, 100, 0, 100, 100, 0,
          ]);
          this.lines.group.children[j].geometry.attributes.position.needsUpdate = true;
        }
      } else {
        for (let i = 0; i < this.lines.group.children.length; i++) {
          let points = this.handlePoints(bevs_point[i][1], "line");
          this.lines.group.children[i].geometry.setPositions(points);
          this.lines.group.children[i].geometry.attributes.position.needsUpdate = true;
          this.lines.group.children[i].material.color.set(
            this.lineColors[bevs_point[i][0]]
          );
          this.lines.group.children[i].material.needsUpdate = true;
        }
        for (
          let j = this.lines.group.children.length;
          j < bevs_point.length;
          j++
        ) {
          let line = this.setWidthLine(
            bevs_point[j][1],
            this.lineColors[bevs_point[j][0]]
          );
          this.lines.group.add(line);
        }
        this.scene.add(this.lines.group);
      }
    }
    
  }
  // 操作具体的障碍物
  async handle3D(type, data) {
    try {
      if (!this.objs.start) return;
      // console.log(data, "data")
      let group = this.objs[`${type}_group`],
        tags = this.objs[`${type}_tags`],
        model = this.objs[type];

      if (data.length <= 0) {
        if (group.children.length > 50) {
          console.log("大于50---objs00000");
          for (let j = 50; j < group.children.length; j++) {
            this.scene.remove(group.children[j]);
            this.dispose3D(group.children[j]);
            group.remove(group.children[j]);
            this.scene.remove(tags.children[j]);
            tags.remove(tags.children[j]);
          }
        } else {
          for (let j = data.length; j < group.children.length; j++) {
            group.children[j].position.set(100, 100, 0);
            tags.children[j].position.copy(group.children[j].position);
          }
        }
        return;
      }

      if (group.children.length <= 0) {
        for (let i = 0; i < data.length; i++) {
          let point = data[i];
          if (point[0] !== -1 && point[1] !== -1) {
            let c_model = model.scene.clone();
            c_model.matrixAutoUpdate = true;
            c_model.position.set(-point[1], point[0], 0);
            c_model.rotation.y = THREE.MathUtils.degToRad(-THREE.MathUtils.radToDeg(point[9])) + this.objs[`${type}_rot`];
            group.add(c_model);
            let label3DSprite = this.tag3DSprite(point[12]);
            let pos3 = new THREE.Vector3();
            c_model.getWorldPosition(pos3); //获取obj世界坐标、
            // console.log(point, "point", pos3, c_model.position);
            pos3.z = point[5] + 1;
            pos3.y -= 16;
            // console.log(pos3, "pos3");
            label3DSprite.position.copy(pos3);
            tags.add(label3DSprite);
          }
        }
        this.scene.add(tags);
        this.scene.add(group);
      } else {
        if (group.children.length >= data.length) {
          for (let i = 0; i < data.length; i++) {
            group.children[i].position.set(-data[i][1], data[i][0], 0);
            group.children[i].rotation.y = THREE.MathUtils.degToRad(-THREE.MathUtils.radToDeg(data[i][9])) + this.objs[`${type}_rot`];
            let pos3 = new THREE.Vector3();
            group.children[i].getWorldPosition(pos3); //获取obj世界坐标、
            pos3.z = data[i][5] + 1;
            pos3.y -= 16;
            tags.children[i].position.copy(pos3);
            tags.children[i].element.innerHTML = data[i][12];
          }
          if (group.children.length > 50) {
            console.log("大于50---objs11111");
            for (let j = 50; j < group.children.length; j++) {
              this.scene.remove(group.children[j]);
              this.dispose3D(group.children[j]);
              group.remove(group.children[j]);
              this.scene.remove(tags.children[j]);
              tags.remove(tags.children[j]);
            }
          } else {
            for (let j = data.length; j < group.children.length; j++) {
              group.children[j].position.set(100, 100, 0);
              tags.children[j].position.copy(group.children[j].position);
            }
          }
        } else {
          for (let i = 0; i < group.children.length; i++) {
            group.children[i].position.set(-data[i][1], data[i][0], 0);
            group.children[i].rotation.y = THREE.MathUtils.degToRad(-THREE.MathUtils.radToDeg(data[i][9])) + this.objs[`${type}_rot`];
            let pos3 = new THREE.Vector3();
            group.children[i].getWorldPosition(pos3); //获取obj世界坐标、
            pos3.z = data[i][5] + 1;
            pos3.y -= 16;
            tags.children[i].position.copy(pos3);
          }

          for (let j = group.children.length; j < data.length; j++) {
            let l_c_model = model.scene.clone();
            l_c_model.matrixAutoUpdate = true;
            l_c_model.position.set(-data[j][1], data[j][0], 0);
            l_c_model.rotation.y = THREE.MathUtils.degToRad(-THREE.MathUtils.radToDeg(data[j][9])) + this.objs[`${type}_rot`];
            group.add(l_c_model);
            let label3DSprite = this.tag3DSprite(data[j][12]);
            let pos3 = new THREE.Vector3();
            l_c_model.getWorldPosition(pos3); //获取obj世界坐标、
            pos3.z = data[j][5] + 1;
            pos3.y -= 16;
            label3DSprite.position.copy(pos3);
            tags.add(label3DSprite);
          }
          this.scene.add(group);
          this.scene.add(tags);
        }
      }
    } catch (err) {
      console.log(err, "err---handle3D");
    }
  }
  // 创建一个HTML标签
  tag3DSprite(name) {
    // 创建div元素(作为标签)
    let p = document.createElement("p");
    p.innerHTML = name;
    p.classList.add("yh_tag");
    //div元素包装为CSS3模型对象CSS3DSprite
    var label = new CSS3DSprite(p);
    p.style.pointerEvents = "none"; //避免HTML标签遮挡三维场景的鼠标事件
    p.style.boxShadow = "0 0 2px #00ffff inset";
    p.style.background = `linear-gradient(#00ffff, #00ffff) left top,linear-gradient(#00ffff, #00ffff) left top,linear-gradient(#00ffff, #00ffff) right bottom,linear-gradient(#00ffff, #00ffff) right bottom`;
    p.style.backgroundRepeat = "no-repeat";
    p.style.backgroundSize = "1px 6px, 6px 1px";
    p.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    p.style.color = "#ffffff";
    p.style.fontSize = "16px";
    p.style.padding = "4px 10px";

    //缩放CSS3DSprite模型对象
    label.scale.set(0.05, 0.05, 0.05); //根据相机渲染范围控制HTML 3D标签尺寸
    label.rotateY(Math.PI / 2); //控制HTML标签CSS3对象姿态角度
    // label.rotateX(-Math.PI/2);
    return label; //返回CSS3模型标签
  }
  // 清除3D模型
  dispose3D(item) {
    if (item.isMesh) {
      if (item.geometry) {
        item.geometry.dispose();
      }
      if (item.material) {
        if (Array.isArray(item.material)) {
          item.material.forEach((material) => this.disposeMaterial(material));
        } else {
          this.disposeMaterial(item.material);
        }
      }
    }
  }
  disposeMaterial(material) {
    material.dispose();
    // 清除纹理
    if (material.map) material.map.dispose();
    if (material.lightMap) material.lightMap.dispose();
    if (material.bumpMap) material.bumpMap.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.specularMap) material.specularMap.dispose();
    if (material.envMap) material.envMap.dispose();
  }
  // 初始化threejs
  init() {
    this.scene = new THREE.Scene();
    let rect = this.rgb_data.dom.getBoundingClientRect();
    this.dom_width = (rect.width * document.documentElement.clientWidth) / 1080 - 26;
    this.dom_height =
      (rect.height * document.documentElement.clientWidth) / 1080 - 26;
    this.camera = new THREE.PerspectiveCamera(80, width / height, 1, 10000);
    this.camera.position.set(0, -5, 30);
    // this.camera.position.set(0, -5, 55);
    // this.camera.position.set(0, -15, 6);
    this.camera.lookAt(0, 0, 0);
    this.camera.updateMatrix();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.dom_width, this.dom_height);
    this.renderer2 = new CSS3DRenderer();
    this.renderer2.setSize(this.dom_width, this.dom_height);
    this.renderer2.domElement.style.position = "absolute";
    this.renderer2.domElement.style.zIndex = 2;

    this.rgb_data.dom.appendChild(this.renderer.domElement);
    this.rgb_data.dom.appendChild(this.renderer2.domElement);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 2.0;
    this.setMesh();
    this.setAmbientLight();
    this.setControls();
    // this.addSky();
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
    this.bev.ctx.fillStyle = `rgba(80, 82, 79, 0)`;
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
        // opacity: 0,
        // transparent: true
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
          // gltf.position.y = -(size.y / 2) - center.y;
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          // gltf.scale.set(2, 2, 2);
        } else if (item.id === "car") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI / 2;
          gltf.position.y = -100;
          gltf.position.x = -100;
          size = this.ge3Dsize(gltf);
          s = Math.min(1.7 / size.x);
          // gltf.scale.set(2, 2, 2);
          // gltf.scale.set(s, s, s);
        } else if (item.id === "truck") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.y = -100;
          gltf.position.x = -100;
          size = this.ge3Dsize(gltf);
          s = 4.8 / size.x;
          // gltf.scale.set(s, s, s);
        } else if (item.id === "bus") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.y = -120;
          gltf.position.x = -120;
          size = this.ge3Dsize(gltf);
          s = 2.5 / size.x;
          // gltf.scale.set(0.7, 0.7, 0.7);
        } else if (item.id === "trailer") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.y = -130;
          gltf.position.x = -130;
          size = this.ge3Dsize(gltf);
          s = 2.1 / size.x;
          // gltf.scale.set(2,2,2);
        } else if (item.id === "barrier") {
          gltf.rotation.x = Math.PI / 2;
          gltf.position.x = -145;
          gltf.position.y = -144;
          // gltf.scale.set(2,2,2);
        } else if (item.id === "motorcycle") {
          gltf.rotation.x = Math.PI / 2;
          gltf.position.x = 105;
          gltf.position.y = -124;
          size = this.ge3Dsize(gltf);
          s = 0.98 / size.x;
          // gltf.scale.set(s, s, s);
          // gltf.scale.set(2,2,2);
        } else if (item.id === "bicycle") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI / 2;
          gltf.position.x = -122;
          gltf.position.y = -143;
          // size = this.ge3Dsize(gltf);
          // s = 1 / size.x;
          // gltf.scale.set(s, s, s);
          // gltf.scale.set(0.02, 0.02, 0.02);
          // gltf.scale.set(2,2,2);
        } else if (item.id === "pedestrian") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI / 2 + Math.PI / 3;
          gltf.position.x = 120;
          gltf.position.y = -114;
          size = this.ge3Dsize(gltf);
          s = 3.5 / size.z;
          // gltf.scale.set(0.5, 0.5, 0.5);
          gltf.scale.set(s, s, s);
        } else if (item.id === "street_cone") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI / 2;
          gltf.position.x = 100;
          gltf.position.y = -144;
          size = this.ge3Dsize(gltf);
          s = 0.8 / size.z;
          // gltf.scale.set(s, s, s);
          // gltf.scale.set(2,2,2);
        } else if (item.id === "construction_vehicle") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.x = 100;
          gltf.position.y = -100;
          size = this.ge3Dsize(gltf);
          s = 6 / size.x;
          // gltf.scale.set(s, s, s);
          // gltf.scale.set(2,2,2);
        }
        if (item.id !== "main_car") {
          this.objs[`${item.id}_whl`] = this.ge3Dsize(gltf);
        }
        this.scene.add(this.track(gltf));
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
  // 创建环境光
  setAmbientLight(intensity = 1, color = 0xffffff) {
    const light = new THREE.AmbientLight(color, intensity);
    this.scene.add(light);
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
    this.hemiLight.color.setHSL(0.6, 1, 0.6);
    this.hemiLight.position.set(0, 0, 100);
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
    this.controls2 = new OrbitControls(this.camera, this.renderer2.domElement);
  }
  // 渲染循环
  animate = () => {
    // 清除深度缓存---很重要
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
    this.renderer2.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
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
    for (let item in this.objs) {
      if (this.objs[item]?.children?.length > 0) {
        this.objs[item]?.children.forEach((ele) => {
          this.scene.remove(ele);
          this.dispose3D(ele);
        });
        this.scene.remove(this.objs[item]);
      }
      if (this.objs[item]?.isVector3) {
        this.objs[item] = {};
      }
    }
    if (this.lines.group?.children.length > 0) {
      this.lines.group?.children.forEach((ele) => {
        this.scene.remove(ele);
        ele.geometry.dispose();
        ele.material.dispose();
        this.lines.group.remove(ele);
      });
    }
    cancelAnimationFrame(this.animationFrameId);
    this.resTracker.dispose();
  }
}
