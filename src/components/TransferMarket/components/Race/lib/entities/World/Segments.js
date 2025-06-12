class Segments {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.segments = new Array(maxSize);
        this.startIndex = 0; // Index of the "first" segment
        this.count = 0;     // Number of segments currently stored
    }

    push(segment) {
        const nextIndex = (this.startIndex + this.count) % this.maxSize;
        this.segments[nextIndex] = segment;
        this.count++
    }

    shift() {
        // this.segments[this.startIndex] = undefined; // Optional: Clear the slot
        this.startIndex = (this.startIndex + 1) % this.maxSize;
        this.count--;
    }

    get length() {
        return this.count;
    }

    // Mimic array-like access
    get(index) {
        if (index < 0 || index >= this.count) {
            return undefined;
        }
        const actualIndex = (this.startIndex + index) % this.maxSize;
        return this.segments[actualIndex];
    }

    // To enable bracket notation (e.g., this.segmentManager[index])
    [Symbol.iterator]() {
        let index = 0;
        return {
            next: () => {
                if (index < this.count) {
                    return { value: this.get(index++), done: false };
                } else {
                    return { done: true };
                }
            }
        };
    }

    // Optional: Implement other array methods if needed (e.g., slice, map, etc.)
}

export default Segments