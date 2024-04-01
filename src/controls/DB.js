/**
 * 打开数据库
 * @param {object} dbName 数据库的名字
 * @param {string} storeName 仓库名称
 * @param {string} version 数据库的版本
 * @return {object} 该函数会返回一个数据库实例
 */
export function openDB(dbName, version = 2) {
  return new Promise((resolve, reject) => {
    //  兼容浏览器
    var indexedDB =
      window.indexedDB ||
      window.mozIndexedDB ||
      window.webkitIndexedDB ||
      window.msIndexedDB;
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
      objectStore = db.createObjectStore("old_videos", {
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
export function addData(db, storeName, data) {
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
export function getDataByKey(db, storeName, key) {
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
 * 通过游标读取数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 */
export function cursorGetData(db, storeName) {
  let list = [];
  var store = db
    .transaction(storeName, "readwrite") // 事务
    .objectStore(storeName); // 仓库对象
  var request = store.openCursor(); // 指针对象
  // 游标开启成功，逐行读数据
  request.onsuccess = function (e) {
    var cursor = e.target.result;
    if (cursor) {
      // 必须要检查
      list.push(cursor.value);
      cursor.continue(); // 遍历了存储对象中的所有内容
    } else {
      console.log("游标读取的数据：", list);
    }
  };
}
/**
 * 通过索引读取数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {string} indexName 索引名称
 * @param {string} indexValue 索引值
 */
export function getDataByIndex(db, storeName, indexName, indexValue) {
  var store = db.transaction(storeName, "readwrite").objectStore(storeName);
  var request = store.index(indexName).get(indexValue);
  request.onerror = function () {
    console.log("事务失败");
  };
  request.onsuccess = function (e) {
    var result = e.target.result;
    console.log("索引查询结果：", result);
  };
}
/**
 * 通过索引和游标查询记录
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {string} indexName 索引名称
 * @param {string} indexValue 索引值
 */
export function cursorGetDataByIndex(db, storeName, indexName, indexValue) {
  let list = [];
  var store = db.transaction(storeName, "readwrite").objectStore(storeName); // 仓库对象
  var request = store
    .index(indexName) // 索引对象
    .openCursor(IDBKeyRange.only(indexValue)); // 指针对象
  request.onsuccess = function (e) {
    var cursor = e.target.result;
    if (cursor) {
      // 必须要检查
      list.push(cursor.value);
      cursor.continue(); // 遍历了存储对象中的所有内容
    } else {
      console.log("游标索引查询结果：", list);
    }
  };
  request.onerror = function (e) {};
}
/**
 * 更新数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {object} data 数据
 */
export function updateDB(db, storeName, data) {
  var request = db
    .transaction([storeName], "readwrite") // 事务对象
    .objectStore(storeName) // 仓库对象
    .put(data);

  request.onsuccess = function () {
    console.log("数据更新成功");
  };

  request.onerror = function () {
    console.log("数据更新失败");
  };
}
/**
 * 通过主键删除数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {object} id 主键值
 */
export function deleteDB(db, storeName, id) {
  return new Promise((resolve, reject) => {
    var request = db
      .transaction([storeName], "readwrite")
      .objectStore(storeName)
      .delete(id);
  
    request.onsuccess = function () {
      // console.log("数据删除成功");
      resolve("阐述完毕")
    };
  
    request.onerror = function () {
      console.log("数据删除失败");
    };

  })
}
/**
 * 通过索引和游标删除指定的数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {string} indexName 索引名
 * @param {object} indexValue 索引值
 */
export function cursorDelete(db, storeName, indexName, indexValue) {
  var store = db.transaction(storeName, "readwrite").objectStore(storeName);
  var request = store
    .index(indexName) // 索引对象
    .openCursor(IDBKeyRange.only(indexValue)); // 指针对象
  request.onsuccess = function (e) {
    var cursor = e.target.result;
    var deleteRequest;
    if (cursor) {
      deleteRequest = cursor.delete(); // 请求删除当前项
      deleteRequest.onerror = function () {
        console.log("游标删除该记录失败");
      };
      deleteRequest.onsuccess = function () {
        console.log("游标删除该记录成功");
      };
      cursor.continue();
    }
  };
  request.onerror = function (e) {};
}
/**
 * 关闭数据库
 * @param {object} db 数据库实例
 */
export function closeDB(db) {
  db.close();
  console.log("数据库已关闭");
}
/**
 * 删除数据库
 * @param {object} dbName 数据库名称
 */
export function deleteDBAll(dbName) {
  console.log(dbName);
  let deleteRequest = window.indexedDB.deleteDatabase(dbName);
  deleteRequest.onerror = function (event) {
    console.log("删除失败");
  };
  deleteRequest.onsuccess = function (event) {
    console.log("删除成功");
  };
}
