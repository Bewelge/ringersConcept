var bgTicks = 0
var BG_TICKS_MAX = 1000
var BG_STROKES = "rgba(0, 0, 0, 1)"
var BG_COLOR = "rgba(255,255,255,1)"
var BG_STROKE_WIDTH = 0.1

function initBg() {
	cBg.fillStyle = BG_COLOR
	cBg.fillRect(0, 0, width, height)

	for (let i = 0; i < rndInt(150, 250); i++) {
		renderBgTexture()
	}
}
function renderBgTexture() {
	if (bgTicks > BG_TICKS_MAX) {
		return
	}
	bgTicks++
	cBg.fillStyle = "black"
	cBg.beginPath()
	cBg.arc(Vec2.middle().x, Vec2.middle().y, 700, 0, PI2)
	cBg.fill()
	// cBg.globalCompositeOperation = "source-over"
	// cBg.strokeStyle = BG_STROKES
	// cBg.lineWidth = BG_STROKE_WIDTH * 1000
	// for (let i = 0; i < 2; i++) {
	// 	let p = Vec2.random(150)

	// 	cBg.moveTo(p.x, rndInt(150, 250))
	// 	cBg.lineTo(p.x, height - rndInt(150, 250))
	// }
	// cBg.stroke()
	cBg.closePath()
	cBg.strokeStyle = "rgba(255,255,255,1)"
	cBg.lineWidth = 3
	for (let i = 0; i < 700 / 20; i++) {
		cBg.beginPath()
		cBg.arc(Vec2.middle().x, Vec2.middle().y, i * 20, 0, PI2)
		cBg.stroke()
		cBg.closePath()
	}
}
