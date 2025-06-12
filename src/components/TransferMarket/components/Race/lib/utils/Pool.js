class Pool {
  constructor({ factory, size }) {
    this.factory = factory
    this.size = size
    this.list = Array(size).fill(false)
    this.lastIdx = 0
  }
  create() {
    const curIdx = (this.lastIdx + 1) % this.list.length;
    const obj = this.list[curIdx]
    if (!obj) {
      this.list[curIdx] = this.factory.apply(null, arguments); // Directly use `arguments`
    } else if (!obj.removed) {
      console.log("Found non removed object, dynamically resizing")
      this.list[curIdx] = this.factory.apply(null, arguments)
      this.list.push(obj)
    } else {
      obj.__prev = null
      obj.__next = null
      obj.removed = false
      obj.toRemove = false
      obj.pos.x = 0
      obj.pos.y = 0
      obj.i = 0
      obj.j = 0
      obj.reset.apply(obj, arguments);
    }
    this.lastIdx = curIdx
    return this.list[curIdx];
  }
}

class FIFOPool {
  constructor() {
    this.free = [];          // Stack of free objects
    this.totalCreated = 0;   // Counter for total objects created
  }

  allocate(count) {
    for (let i = 0; i < count; i++) {
      this.free.push({});
      this.totalCreated++;
    }
  }

  get() {
    if (this.free.length > 0) {
      return this.free.pop();
    } else {
      this.totalCreated++;
      return {};
    }
  }

  free(obj) {
    // Clear user-defined properties
    for (const prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        delete obj[prop];
      }
    }
    this.free.push(obj);
  }
}

export default Pool