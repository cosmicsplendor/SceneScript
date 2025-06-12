export const rand = (to, from = 0) => from + Math.floor((to - from + 1)* Math.random())

export const randf = (to, from = 0) => from + (to - from) * Math.random()

export const skewedRand = (to, from = 0) => from + Math.floor((to - from + 1) * Math.random() * Math.random())

export const pickOne = array => array[rand(array.length - 1)]

export const clamp = (from = 0, to = 1, num) => Math.min(to, Math.max(from, num))

export const sign = num => num === 0 ? 1 : num / Math.abs(num)

export const lerp = (from, to, num) => (num - from) / (to - from)

const  hexRegexes = {
    short: new RegExp(`[0-9a-f]`, "g"),
    long: new RegExp(`[0-9a-f]{2}`, "g")
}
export const hexToArray = (hexString="#000") => {
    const regexKey = hexString.length === 4 ? "short": "long"
    const regex = hexRegexes[regexKey]
    return hexString.replace("#", "").match(regex).map(hex => parseInt(hex.concat(regexKey === "short" ? hex: ""), 16))
}
export const hexToNorm = hexString => {
    return hexToArray(hexString).map(num => num / 255)
}
export const hexToRgb = hexString => {
    return `rgb(${hexToArray(hexString).join(",")})`
}
export const decomposeColor = (color) => {
    // Check if the input is a hex color
    if (color.startsWith('#')) {
      // Remove the hash symbol if it's present
      color = color.replace('#', '');
  
      // Parse the hex color string into its R, G, B components
      let r = parseInt(color.substring(0, 2), 16);
      let g = parseInt(color.substring(2, 4), 16);
      let b = parseInt(color.substring(4, 6), 16);
  
      // Normalize the values by dividing by 255
      return [r / 255, g / 255, b / 255];
    } else if (color.startsWith('rgb')) {
      // Extract RGB values, handling both comma and space separators
      const rgbValues = color.substring(4, color.length - 1).split(/[\s,]+/);
      return rgbValues.map(value => parseInt(value) / 255);
    } else {
      // Throw an error if the input is not a valid hex or rgb color
      throw new Error('Invalid color format. Please provide a hex or rgb color.');
    }
  }