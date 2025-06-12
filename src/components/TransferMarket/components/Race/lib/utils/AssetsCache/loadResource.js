import { offlineErrMsg } from "../../constants"

const loadImgResource = url => {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = url
        img.onload = () => resolve(img)
        img.onerror = () => reject({ message: offlineErrMsg })
    })
}
const loadDataResource = url => {
    return new Promise((resolve, reject) => {
        fetch(url)
            .then(res => res.json())
            .then(data => resolve(data))
            .catch(e => reject({ message: offlineErrMsg }))
    })
}
const loadModule = loader => {
    return new Promise((resolve, reject) => {
        loader()
            .then(module => {
                resolve(module.default)
            })
            .catch(e => {
                console.log(e)
                reject(({ message: offlineErrMsg }))
            })
    })
}

const types = Object.freeze({ SOUND: "SOUND", IMAGE: "IMAGE", DATA: "DATA", MODULE: "MODULE" })


const loadFns = {
    [types.IMAGE]: loadImgResource,
    [types.DATA]:loadDataResource,
    [types.MODULE]: loadModule
}

const inferType = url => {
    if (typeof url === "function") {
        return types.MODULE
    }
    if (url.match(/.(jpe?g)|(png)$/)) {
        return types.IMAGE
    } 
    if (url.match(/.(mp3)|(aac)|(ogg)$/)) {
        return types.SOUND
    } 
    if (url.match(/.(cson|bson)$/)) {
        return types.DATA
    }
}

const loadResource = url => {
    const type = inferType(url)
    const load = loadFns[type]
    return load(url)
}

export default loadResource