const states = {
    Playing: 0,
    paused: 1,
    stopped: 2
}
class State {
    constructor(initialState) {
        this.currentState = initialState
    }
    set state(newState) {
        this.prevState = this.state
        this.currentState = newState
    }
    get state() {
        return this.currentState
    }
    play() {
        switch(this.state) {
            case states.paused:

            break
            case states.stopped:

            break
        }
    }
    pause() {
        switch(this.state) {
            case states.playing:

            break
        }
    }
    stop() {
        switch(this.state) {
            case states.paused:

            break
            case states.playing:

            break
        }
    }
}

export default State