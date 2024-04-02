/*
 * @LastEditTime: 2024-04-02 11:01:54
 * @Description: 
 */
import * as THREE from "three";
export default class ResourceTracker {
  constructor() {
    this.resources = new Set();
  }
  track(resource) {
    try {
      if (!resource) {
        return resource;
      }
      if (Array.isArray(resource)) {
        resource.forEach(resource => {
          this.track(resource);
        })
        return resource;
      }
      if (resource.dispose || resource instanceof THREE.Object3D) {
        this.resources.add(resource);
      }
      if (resource instanceof THREE.Object3D) {
        this.track(resource.geometry);
        this.track(resource.material);
        this.track(resource.children);
      } else if (resource instanceof THREE.Material) {
        for (const value of Object.values(resource)) {
          if (value instanceof THREE.Texture) {
            this.track(value);
          }
        }
        if (resource.uniforms) {
          for (const value of Object.values(resource.uniforms)) {
            if (value) {
              const uniformsValue = value.value;
              if (uniformsValue instanceof THREE.Texture || Array.isArray(uniformsValue)) {
                this.track(uniformsValue);
              } 
            }
          }
        }
      }
      return resource;
    } catch (err) {
      console.log(err, "err===track");
    }
  }
  untrack(resource) {
    this.resources.delete(resource);
  }
  dispose() {
    for (const resource of this.resources) {
      if (resource instanceof THREE.Object3D) {
        if (resource.parent) {
          resource.parent.remove(resource);
        }
      }
      if (resource.dispose) {
        resource.dispose();
      }
    }
    this.resources.clear();
  }
}
