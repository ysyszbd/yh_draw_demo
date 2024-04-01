/*
 * @LastEditTime: 2024-04-01 18:07:24
 * @Description:
 */
import { decode } from "@msgpack/msgpack";
let db,
  ws,
  limitConnect = 10,
  timeConnect = 0,
  v_buffer = new SharedArrayBuffer(300000),
  v_uni8 = new Uint8Array(v_buffer);
self.onmessage = async (e) => {
  if (e.data.sign === "init") {
    webSocketInit(reconnect, webSocketInit);
    db = await openDB("yh_bev");
  } else if (e.data.sign === "set_video") {
    // console.log(e.data, "eeee", db);
    addData(db, "videos", e.data.params);
  } else if (e.data.sign === "get_video") {
    let res = await getDataByKey(db, "videos", e.data.key);
    postMessage({
      sign: "get_video",
      params: res,
    });
  } else if (e.data.sign === "del_video") {
    deleteDB(db, "videos", e.data.key);
  } else if (e.data.sign === "del_db") {
    deleteDBAll("yh_bev");
    closeDB(db);
  } else if (e.data.sign === "close_db") {
  }
};
const webSocketInit = (reconnect, webSocketInit) => {
  ws = new WebSocket("ws://192.168.1.161:1234");
  ws.binaryType = "arraybuffer";
  ws.onopen = function () {
    console.log("已连接TCP服务器");
  };
  ws.onmessage = (e) => {
    if (e.data instanceof ArrayBuffer) {
      let object = decode(e.data);
      
      // console.log(object, "eee");
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
/**
 * 打开数据库
 * @param {object} dbName 数据库的名字
 * @param {string} storeName 仓库名称
 * @param {string} version 数据库的版本
 * @return {object} 该函数会返回一个数据库实例
 */
function openDB(dbName, version = 2) {
  return new Promise((resolve, reject) => {
    let db;
    // 打开数据库，若没有则会创建
    const request = indexedDB.open(dbName, version);
    // 数据库打开成功回调
    request.onsuccess = (event) => {
      db = event.target.result; // 数据库对象
      console.log("数据库打开成功", db);
      resolve(db);
    };
    // 数据库打开失败的回调
    request.onerror = function (event) {
      console.log("数据库打开报错", event);
    };
    // 数据库有更新时候的回调
    request.onupgradeneeded = function (event) {
      // 数据库创建或升级的时候会触发
      db = event.target.result; // 数据库对象
      var objectStore;
      // 创建存储库--原始视频数据
      objectStore = db.createObjectStore("videos", {
        keyPath: "key", // 这是主键
      });
      // 创建索引，在后面查询数据的时候可以根据索引查
      objectStore.createIndex("foresight", "foresight", { unique: false });
      objectStore.createIndex("rearview", "rearview", { unique: false });
      objectStore.createIndex("right_front", "right_front", { unique: false });
      objectStore.createIndex("right_back", "right_back", { unique: false });
      objectStore.createIndex("left_back", "left_back", { unique: false });
      objectStore.createIndex("left_front", "left_front", { unique: false });
      console.log("onupgradeneeded", db);
    };
  });
}
/**
 * 新增数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {string} data 数据
 */
function addData(db, storeName, data) {
  var request = db
    .transaction([storeName], "readwrite") // 事务对象 指定表格名称和操作模式（"只读"或"读写"）
    .objectStore(storeName) // 仓库对象
    .add(data);

  request.onsuccess = function (event) {
    // console.log("数据写入成功");
  };

  request.onerror = function (event) {
    console.log("数据写入失败");
  };
}
/**
 * 通过主键读取数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {string} key 主键值
 */
function getDataByKey(db, storeName, key) {
  return new Promise((resolve, reject) => {
    var transaction = db.transaction([storeName]); // 事务
    var objectStore = transaction.objectStore(storeName); // 仓库对象
    var request = objectStore.get(key); // 通过主键获取数据

    request.onerror = function (event) {
      console.log("事务失败");
    };

    request.onsuccess = function (event) {
      resolve(request.result);
    };
  });
}
/**
 * 通过主键删除数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {object} id 主键值
 */
function deleteDB(db, storeName, id) {
  return new Promise((resolve, reject) => {
    var request = db
      .transaction([storeName], "readwrite")
      .objectStore(storeName)
      .delete(id);

    request.onsuccess = function () {
      // console.log("数据删除成功");
      resolve("阐述完毕");
    };

    request.onerror = function () {
      console.log("数据删除失败");
    };
  });
}
/**
 * 关闭数据库
 * @param {object} db 数据库实例
 */
function closeDB(db) {
  db.close();
  console.log("数据库已关闭");
}
/**
 * 删除数据库
 * @param {object} dbName 数据库名称
 */
function deleteDBAll(dbName) {
  let deleteRequest = window.indexedDB.deleteDatabase(dbName);
  deleteRequest.onerror = function (event) {
    console.log("删除失败");
  };
  deleteRequest.onsuccess = function (event) {
    console.log("删除成功");
  };
}
