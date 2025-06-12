class Inflexion {
    constructor(world, samplingWindow, onNew) {
        this.world = world
        this.samplingWindow = samplingWindow
        this.curI = 0 // Tracks current z-index
        this.previousFirstSegmentIndex = 0
        this.segSize = world.segments.length
        this.onNew = onNew
    }

    evaluateObjective(i) {
        const h1 = this.world.segments[i].h
        const h2 = this.world.segments[i + this.samplingWindow].h
        const h3 = this.world.segments[i + 2 * this.samplingWindow].h

        const deltaH1 = h2 - h1
        const deltaH2 = h3 - h2
        return deltaH2 - deltaH1
    }

    processSegment(i) {
        const fCurrent = this.evaluateObjective(i)
        const fPrevious = this.evaluateObjective(i - 1)
        const fNext = this.evaluateObjective(i + 1)

        // Check for local minimum
        if (fCurrent < fPrevious && fCurrent < fNext) {
            const spawnZIndex = i + this.samplingWindow + this.world.firstSegmentIndex
            this.onNew(spawnZIndex, fCurrent)
        }
    }

    update() {
        const newSegmentsCount = (this.world.segments.length - this.segSize) + this.world.firstSegmentIndex - this.previousFirstSegmentIndex
        this.segSize = this.world.segments.length
        this.previousFirstSegmentIndex = this.world.firstSegmentIndex
        if (newSegmentsCount) console.log(newSegmentsCount)
        if (newSegmentsCount > 0) {
            const startIndex = Math.max(1, this.curI - newSegmentsCount + 1)
            const maxIndex = this.world.segments.length - 2 * this.samplingWindow - 1

            for (let i = startIndex; i < maxIndex; i++) {
                this.processSegment(i)
            }

            this.curI = maxIndex
        }
    }
}

export default Inflexion