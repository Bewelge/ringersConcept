const PI = Math.PI
const PI2 = Math.PI * 2
const PI05 = Math.PI * 0.5
class Vec2 {
	constructor(x = 0, y = 0) {
		this._x = x
		this._y = y
	}
	get x() {
		return this._x
	}
	get y() {
		return this._y
	}
	get length() {
		return this.distanceToOrigin()
	}
	addVector(vector) {
		this._x += vector.x
		this._y += vector.y
		return this
	}
	add(x, y) {
		this._x += x
		this._y += y
		return this
	}
	subtractVector(vector) {
		this._x -= vector.x
		this._y -= vector.y
		return this
	}
	addAngle(angle, dist) {
		this._x += Math.cos(angle) * dist
		this._y += Math.sin(angle) * dist
		return this
	}
	multiply(number) {
		this._x *= number
		this._y *= number
		return this
	}
	floor() {
		this._x = Math.floor(this._x)
		this._y = Math.floor(this._y)
		return this
	}
	ceil() {
		this._x = Math.ceil(this._x)
		this._y = Math.ceil(this._y)
		return this
	}
	round() {
		this._x = Math.round(this._x)
		this._y = Math.round(this._y)
		return this
	}
	rotateAround(vec, ang) {
		let curAng = this.angleTo(vec)
		let dis = vec.distanceTo(this)
		let newP = vec.copy().addAngle(curAng + ang, -dis)

		this._x = newP.x
		this._y = newP.y
		return this
	}
	ceiling(num) {
		this._x = Math.min(num, this._x)
		this._y = Math.min(num, this._y)
		return this
	}
	bottom(num) {
		this._x = Math.max(num, this._x)
		this._y = Math.max(num, this._y)
		return this
	}
	peg(min, max) {
		this.ceiling(max)
		this.bottom(min)
		return this
	}
	distanceTo(vector) {
		return distancePoints(this, vector)
	}
	distanceToOrigin() {
		return distancePoints(this, Vec2.origin())
	}
	angleTo(vector) {
		return anglePoints(this, vector)
	}
	angleToOrigin() {
		return this.angleTo(Vec2.origin())
	}
	copy() {
		return new Vec2(this._x, this._y)
	}
	isInBound() {
		return this._x >= 0 && this._x <= width && this._y >= 0 && this._y <= height
	}
	getPixelIndex() {
		return this._x * 4 + this._y * 4 * width
	}
	mirrorAcross(p0, p1) {
		let vx = p1.x - p0.x
		let vy = p1.y - p0.y
		let x = p0.x - this.x
		let y = p0.y - this.y
		let r = 1 / (vx * vx + vy * vy)
		this._x = this.x + 2 * (x - x * vx * vx * r - y * vx * vy * r)
		this._y = this.y + 2 * (y - y * vy * vy * r - x * vx * vy * r)

		return this
	}
	debug() {
		c.save()
		c.fillStyle = "black"
		c.globalCompositeOperation = "source-over"
		c.beginPath()
		c.arc(this.x, this.y, 5, 0, PI2)
		c.stroke()
		c.closePath()
		c.restore()
		return this
	}

	static middle(w = width, h = height) {
		return new Vec2(w / 2, h / 2)
	}
	static middleOf(vec1, vec2, a = 0.5) {
		return new Vec2(
			vec1.x * (1 - a) + a * vec2.x,
			vec1.y * (1 - a) + a * vec2.y
		)
	}
	static random(margin = 0, x = width, y = height) {
		return new Vec2(
			randomInt(margin, x - margin),
			randomInt(margin, y - margin)
		)
	}
	static create(x, y) {
		return new Vec2(x, y)
	}
	static origin() {
		return new Vec2(0, 0)
	}
	moveTo(ct) {
		ct.moveTo(this.x, this.y)
	}
	lineTo(ct) {
		ct.lineTo(this.x, this.y)
	}
	arc(ct, rad) {
		ct.arc(this.x, this.y, rad, 0, PI2, false)
	}
}

function anglePoints(point1, point2) {
	return Math.atan2(point2.y - point1.y, point2.x - point1.x)
}
function distancePoints(point1, point2) {
	return Math.sqrt(
		(point1.x - point2.x) * (point1.x - point2.x) +
			(point1.y - point2.y) * (point1.y - point2.y)
	)
}
function angle(x1, y1, x2, y2) {
	return Math.atan2(y2 - y1, x2 - x1)
}
function distance(x1, y1, x2, y2) {
	return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2))
}
function randomInt(min, max) {
	return Math.floor(randomFloat(min, max))
}
function randomFloat(min, max) {
	return min + fxrand() * (max - min)
}

function clamp(val, min, max) {
	return Math.min(max, Math.max(min, val))
}
function rgba(r, g, b, a) {
	return "rgba(" + r + "," + g + "," + b + "," + a + ")"
}
function rgb(r, g, b) {
	return "rgb(" + r + "," + g + "," + b + ")"
}

function createCanvas(width, height) {
	width = width || 50
	height = height || 50
	const cnv = document.createElement("canvas")
	cnv.width = width
	cnv.height = height
	return cnv
}
CanvasRenderingContext2D.prototype.fillCircle = function (x, y, radius) {
	this.beginPath()
	this.arc(x, y, radius, 0, Math.PI * 2, 0)
	this.fill()
	this.closePath()
}

function curvedLine(c, p1, p2, offset) {
	c.beginPath()
	c.moveTo(p1.x, p2.x)
	let mx = (p1.x + p2.x) / 2
	let my = (p1.y + p2.y) / 2
	let ang = p1.angleTo(p2)
	let c1 = new Vec2(
		mx + Math.cos(ang + Math.PI * 0.5) * offset,
		my + Math.sin(ang + Math.PI * 0.5) * offset
	)
	let c2 = new Vec2(
		mx + Math.cos(ang - Math.PI * 0.5) * offset,
		my + Math.sin(ang - Math.PI * 0.5) * offset
	)
	c.bezierCurveTo(c1.x, c1.y, c2.y, c2.y, p2.x, p2.y)
	c.stroke()
	c.closePath()
}

function doXTimes(times, toDo) {
	let tmp = times
	while (times--) {
		toDo(tmp - (times + 1))
	}
}

function rndFloat(min = 0, max = 1) {
	return min + (max - min) * fxrand()
}
function rndInt(min = 0, max = 1) {
	return Math.floor(min + (max - min) * fxrand() + 0.5)
}
function rndAng() {
	return rndFloat(0, Math.PI * 2)
}
function rndSign() {
	let num = rndFloat(-1, 1)
	while (num == 0) {
		num = rndFloat(-1, 1)
	}
	return Math.sign(num)
}
function rndArr(list) {
	return list[rndInt(0, list.length - 1)]
}

function peg(val, min = 0, max = 1) {
	return Math.min(max, Math.max(min, val))
}

function getClosestDirection(fromAngle, toAngle, turnSpeed) {
	let provisional = toAngle - fromAngle
	while (provisional < 0) {
		provisional += Math.PI * 2
	}
	return provisional < Math.PI ? -1 : provisional > Math.PI ? 1 : 0
}

function strokeLine(c, vec1, vec2) {
	strokeLines(c, vec1, vec2)
}

function strokeLines(c, ...vecs) {
	if (vecs.length > 1) {
		c.beginPath()
		c.moveTo(vecs[0].x, vecs[0].y)
		for (let i = 1; i < vecs.length; i++) {
			c.lineTo(vecs[i].x, vecs[i].y)
		}
		c.closePath()
		c.stroke()
	}
}

function getRandomColor() {
	return colorPalletes[thePallete][
		rndInt(0, colorPalletes[thePallete].length - 1)
	]
}

function isPreview() {
	var canvas = document.createElement("canvas")
	var gl
	var debugInfo
	var vendor
	var renderer

	try {
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
	} catch (e) {}

	if (gl) {
		debugInfo = gl.getExtension("WEBGL_debug_renderer_info")
		vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
		renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
	}
	return renderer == "Google SwiftShader"
}

window.addEventListener("keydown", e => {
	switch (e.code) {
		case "Space":
			paused = !paused
			break
		case "ArrowUp":
			svgSpeed++
			break
		case "ArrowDown":
			svgSpeed = Math.max(1, svgSpeed - 1)
			break
		case "KeyS":
			let a = document.createElement("a")
			a.href = cnv.toDataURL()
			a.download = document.title + " by Bewelge"
			a.click()
			break
		case "KeyV":
			if (document.querySelector("#plotterSettings").style.display == "flex") {
				document.querySelector("#plotterSettings").style.display = "none"
			} else {
				document.querySelector("#plotterSettings").style.display = "flex"
			}
			break
	}
})
function smoothLineThroughPoints(path, points, dontClose) {
	points = points.map(pos => new Vec2(pos.x, pos.y))
	let curves = []
	!dontClose ? points.push(points[0]) : null
	let str = ""
	// move to the first point
	let curP = points[0]
	path.moveTo(points[0].x, points[0].y)
	str += "M " + points[0].x + " " + points[0].y
	var i
	for (i = 1; i < points.length - 2; i++) {
		var xc = (points[i].x + points[i + 1].x) / 2
		var yc = (points[i].y + points[i + 1].y) / 2
		path.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
		str += " Q " + points[i].x + " " + points[i].y + " " + xc + " " + yc
		curves.push(new QuadraticCurve(curP, points[i], new Vec2(xc, yc)))
		curP = new Vec2(xc, yc)
	}
	// curve through the last two points
	try {
		str +=
			" Q " +
			points[i].x +
			" " +
			points[i].y +
			" " +
			points[i + 1].x +
			" " +
			points[i + 1].y
		path.quadraticCurveTo(
			points[i].x,
			points[i].y,
			points[i + 1].x,
			points[i + 1].y
		)
		curves.push(
			new QuadraticCurve(
				curP,
				points[i],
				new Vec2(points[i + 1].x, points[i + 1].y)
			)
		)
	} catch (error) {
		// console.log(error)
	}
	return { path, curves, str }
}
function raggedLineThroughPoints(p, points) {
	let ps = points.map(pos => new Vec2(pos.x, pos.y))
	let curP = ps[0]
	ps.forEach(point => {
		let curRatio = 0
		let ang = curP.angleTo(point)
		let dis = curP.distanceTo(point)
		for (let i = 0; i < 10; i++) {
			// if (point.distanceTo(curP)>10) {
			let newP = curP.copy().addAngle(ang, (dis * i) / 10)

			let lngt = rndInt(1, 5)
			let aAng = ang + rndFloat(-0.05, 0.05)
			p.moveTo(newP.x, newP.y)
			p.lineTo(newP.x + Math.cos(aAng) * lngt, newP.y + Math.sin(aAng) * lngt)
			// }
		}
		curP = point
	})
	return p
}
function getSignedAng(ang0, ang1) {
	ang0 < 0 ? (ang0 += PI2) : null
	let diff = ang0 - ang1

	return ((diff + PI) % PI2) - PI
}

function addGrain(grainStrength = 20) {
	let dt = c.getImageData(0, 0, width, height)
	for (let i = 0; i < dt.data.length; i += 4) {
		let rnd = Math.floor(rndFloat(-1, 1)) * grainStrength
		dt.data[i + 3] = dt.data[i + 3] + rnd
	}
	c.putImageData(dt, 0, 0)
}

/**
 *
 * FROM https://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas
 */

function drawCurve(
	ctx,
	ptsa,
	tension = 0.5,
	isClosed = true,
	numOfSegments = 20,
	showPoints = false
) {
	drawLines(ctx, getCurvePoints(ptsa, tension, isClosed, numOfSegments))

	if (showPoints) {
		ctx.stroke()
		ctx.beginPath()
		for (var i = 0; i < ptsa.length - 1; i += 2)
			ctx.rect(ptsa[i] - 2, ptsa[i + 1] - 2, 4, 4)
	}
}

function getCurvePoints(
	pts,
	tension = 0.5,
	isClosed = true,
	numOfSegments = 20
) {
	// use input value if provided, or use a default value

	var _pts = [],
		res = [], // clone array
		x,
		y, // our x,y coords
		t1x,
		t2x,
		t1y,
		t2y, // tension vectors
		c1,
		c2,
		c3,
		c4, // cardinal points
		st,
		t,
		i // steps based on num. of segments

	// clone array so we don't change the original
	//
	_pts = pts.slice(0)

	// The algorithm require a previous and next point to the actual point array.
	// Check if we will draw closed or open curve.
	// If closed, copy end points to beginning and first points to end
	// If open, duplicate first points to beginning, end points to end
	if (isClosed) {
		_pts.unshift(pts[pts.length - 1])
		// _pts.unshift(pts[pts.length - 2])
		_pts.unshift(pts[pts.length - 1])
		// _pts.unshift(pts[pts.length - 2])
		_pts.push(pts[0])
		// _pts.push(pts[1])
	} else {
		// _pts.unshift(pts[1]) //copy 1. point and insert at beginning
		_pts.unshift(pts[0])
		// _pts.push(pts[pts.length - 2]) //copy last point and append
		_pts.push(pts[pts.length - 1])
	}

	// ok, lets start..

	// 1. loop goes through point array
	// 2. loop goes through each segment between the 2 pts + 1e point before and after
	for (i = 1; i < _pts.length - 2; i++) {
		for (t = 0; t <= numOfSegments; t++) {
			// calc tension vectors
			t1x = (_pts[i + 1].x - _pts[i - 1].x) * tension
			t2x = (_pts[i + 2].x - _pts[i].x) * tension

			t1y = (_pts[i + 1].y - _pts[i - 1].y) * tension
			t2y = (_pts[i + 2].y - _pts[i].y) * tension

			// calc step
			st = t / numOfSegments

			// calc cardinals
			c1 = 2 * Math.pow(st, 3) - 3 * Math.pow(st, 2) + 1
			c2 = -(2 * Math.pow(st, 3)) + 3 * Math.pow(st, 2)
			c3 = Math.pow(st, 3) - 2 * Math.pow(st, 2) + st
			c4 = Math.pow(st, 3) - Math.pow(st, 2)

			// calc x and y cords with common control vectors
			x = c1 * _pts[i].x + c2 * _pts[i + 1].x + c3 * t1x + c4 * t2x
			y = c1 * _pts[i].y + c2 * _pts[i + 1].y + c3 * t1y + c4 * t2y

			//store points in array
			res.push(new Vec2(x, y))
		}
	}

	return res
}
function drawLines(ctx, pts) {
	if (pts.length) {
		pts[0].moveTo(ctx)
		for (i = 1; i < pts.length; i++) pts[i].lineTo(ctx)
	}
}
/**
 * END FROM https://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas
 *
 **/
function drawCrappyLines(ctx, pts, penStateChangeChance = 0.01) {
	if (pts.length) {
		for (let i = 0; i < pts.length - 1; i++) {
			let p0 = pts[i]
			let p1 = pts[i + 1]
			let dis = Math.ceil(p0.distanceTo(p1))
			let isDown = false
			for (let j = 0; j < dis; j += 0.1) {
				if (!isDown || rndFloat() < penStateChangeChance) {
					if (isDown) {
						Vec2.middleOf(p0, p1, j / dis).lineTo(ctx)
					} else {
						Vec2.middleOf(p0, p1, j / dis).moveTo(ctx)
					}
					isDown = !isDown
				}
			}
			if (isDown) {
				p1.lineTo(ctx)
			}
		}
		// pts[0].moveTo(ctx)
		// for (i = 1; i < pts.length; i++) pts[i].lineTo(ctx)
	}
}

/**
 * From https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
	var j, x, i
	for (i = a.length - 1; i > 0; i--) {
		j = Math.floor(rndFloat() * (i + 1))
		x = a[i]
		a[i] = a[j]
		a[j] = x
	}
	return a
}
/**
 * END From https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
 *
 */

class Line {
	constructor(pts) {
		this.pts = pts
		this.distances = pts.map((pt, i) =>
			i < pts.length - 1 ? pt.distanceTo(pts[i + 1]) : 0
		)
		this._length = this.distances.reduce((prev, curr) => prev + curr, 0)
	}
	get length() {
		return this._length
	}
	getPosAt(rat) {
		// if (rat < 0 ){
		// 	let firstLength = this.distances[0]
		// 	let firstAng = this.pts[0].angleTo(this.pts[1])

		// 	return this.pts[0].copy().addAngle(firstAng,-firstLength)
		// }
		let lengthAt = this.length * rat
		let curLength = 0
		let lastP = this.pts[0]
		lastP.debug()
		for (let i = 1; i < this.pts.length; i++) {
			let thisPt = this.pts[i]
			let dis = this.distances[i - 1]
			if (curLength + dis >= lengthAt) {
				return Vec2.middleOf(
					lastP,
					thisPt,
					(dis - (curLength + dis - lengthAt)) / dis
				)
			}
			curLength += dis
			lastP = thisPt
		}
		// return lastP

		console.log(this.pts, lastP, curLength, lengthAt, this.length, rat)
	}
	getAngleAt(rat) {
		if (rat > 0.99) {
			rat = 0.989
		}
		let p0 = this.getPosAt(rat)
		let p1 = this.getPosAt(rat + 0.01)
		try {
			return p0.angleTo(p1)
		} catch (error) {
			console.log(error)
		}
	}
}
function getTotalLineLength(pts) {
	return pts
		.map((pt, i) => (i < pts.length - 1 ? pt.distanceTo(pts[i + 1]) : 0))
		.reduce((prev, curr) => prev + curr, 0)
}
function prop(obj, key, def) {
	if (!obj.hasOwnProperty(key)) {
		return def
	}
	return obj[key]
}
function stickPathAroundCurve(path, curve, wAngle, wd) {
	curve = curve.copy()
	curve.doCurveTo(path)
	let oldP1 = curve.p1.copy()
	let oldP0 = curve.p0.copy()
	let offsetVec = new Vec2(0, 0).addAngle(wAngle + PI05, wd)
	curve.translate(offsetVec)
	let pointyEnd = Vec2.middleOf(curve.p1, oldP1, 0.5).addAngle(
		curve.getAngleAt(1),
		wd * 0
	)
	path.lineTo(pointyEnd.x, pointyEnd.y)
	path.lineTo(curve.p1.x, curve.p1.y)
	curve.reverseCurveTo(path)
	let middleBottom = Vec2.middleOf(curve.p0, oldP0, 0.5).addAngle(
		curve.getAngleAt(0.1) - PI05,
		rndFloat(0.1, 0.4) * wd
	)
	path.lineTo(middleBottom.x, middleBottom.y)
	path.lineTo(oldP0.x, oldP0.y)
}
function leafPathAroundCurve(path, curve) {
	curve = curve.copy()
	curve.doCurveTo(path)
	curve.mirrorReverseCurveTo(path)
	// return arr.flatMap(a => a)
}
let rectIds = 0
class Rect {
	constructor(opts) {
		this.w = opts.w
		this.h = opts.h
		this.x = opts.x
		this.y = opts.y
		this.id = rectIds++
		this.p = new Vec2(opts.x, opts.y)
		this.cache = {}
	}
	render(ct) {
		ct.fillRect(this.p.x, this.p.y, this.w, this.h)
	}
	intersects(rect) {
		if (this.cache.hasOwnProperty(rect.id)) {
			return this.cache[rect.id]
		}
		let oneAboveTheOther =
			this.p.y + this.h < rect.p.y || rect.p.y + rect.h < this.p.y
		let isLeftOfTheOther =
			this.p.x + this.w < rect.p.x || rect.p.x + rect.w < this.p.x
		let doesntOverlap = oneAboveTheOther || isLeftOfTheOther

		this.cache[rect.id] = !doesntOverlap
		// console.log(doesntOverlap)
		return !doesntOverlap
	}
}

/**
 * FROM https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
 */
function linesIntersect(p0, p1, p2, p3) {
	var det, gamma, lambda
	det = (p1.x - p0.x) * (p3.y - p2.y) - (p3.x - p2.x) * (p1.y - p0.y)
	if (det === 0) {
		return false
	} else {
		lambda =
			((p3.y - p2.y) * (p3.x - p0.x) + (p2.x - p3.x) * (p3.y - p0.y)) / det
		gamma =
			((p0.y - p1.y) * (p3.x - p0.x) + (p1.x - p0.x) * (p3.y - p0.y)) / det
		return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1
	}
}
/**
 * END FROM https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
 */

/**
 *
 * FROM https://stackoverflow.com/questions/37224912/circle-line-segment-collision
 */
function inteceptCircleLineSeg(center, radius, p1, p2) {
	var a, b, c, d, u1, u2, ret, retP1, retP2, v1, v2
	v1 = {}
	v2 = {}
	v1.x = p2.x - p1.x
	v1.y = p2.y - p1.y
	v2.x = p1.x - center.x
	v2.y = p1.y - center.y
	b = v1.x * v2.x + v1.y * v2.y
	c = 2 * (v1.x * v1.x + v1.y * v1.y)
	b *= -2
	d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - radius * radius))
	if (isNaN(d)) {
		// no intercept
		return []
	}
	u1 = (b - d) / c // these represent the unit distance of point one and two on the line
	u2 = (b + d) / c
	retP1 = {} // return points
	retP2 = {}
	ret = [] // return array
	if (u1 <= 1 && u1 >= 0) {
		// add point if on the line segment
		retP1.x = p1.x + v1.x * u1
		retP1.y = p1.y + v1.y * u1
		ret[0] = retP1
	}
	if (u2 <= 1 && u2 >= 0) {
		// second add point if on the line segment
		retP2.x = p1.x + v1.x * u2
		retP2.y = p1.y + v1.y * u2
		ret[ret.length] = retP2
	}
	return ret
}

/**
 *
 * END FROM https://stackoverflow.com/questions/37224912/circle-line-segment-collision
 */
