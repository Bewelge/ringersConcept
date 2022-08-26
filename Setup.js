let maxDim = 800
let thePallete =
	Object.keys(colorPalletes)[rndInt(0, Object.keys(colorPalletes).length - 1)]

let width = 2000
let height = 2000
let cnv = createCanvas(width, height)
let c = cnv.getContext("2d")
var paused = false

document.body.appendChild(cnv)
