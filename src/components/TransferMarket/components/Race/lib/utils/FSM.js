class FSM {
    constructor(states, multipleSwitches=true) {
        this.states = states
        this.multipleSwitches = multipleSwitches
    }
    switchState(name, ...params) {
        this.stateName = name
        if ((!this.multipleSwitches && this.stateSwitched) || name === this.state?.name) { return } // disallow state switching more than once every frame
        this.state?.onExit && this.state.onExit() // execute previous state's onExit hook, in case there's one
        this.state = this.states[name]
        this.state.onEnter && this.state.onEnter(...params)
        this.stateSwitched = true
    }
    update() {
        this.stateSwitched = false
    }
}

const stateMachineMixin = (target, states) => {
    const stateMachine = new FSM(states)
    target.switchState = (...params) => stateMachine.switchState(...params)
    target.getState = () => stateMachine.state
}

export {
    stateMachineMixin
}
export default FSM