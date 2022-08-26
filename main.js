let mainOpts = {
	moving: false,
	propagateChance: 0.9,
	gridSize: 10,
	threadAmount: 1,
	multiThreaded: false,
	background: rgba(0, 0, 0, 1),
	stroke: rgba(245, 245, 245, 1),
	lineWidth: 4,
	circles: "#ff7f3f",
	intersections: rgba(150, 150, 150, 1),
	evenOddFill: true,
	randomColors: false
}

let hoveredRinger = null
let grabbedRinger = null

let gui = new dat.GUI()
gui.add(mainOpts, "propagateChance", 0, 1, 0.01).onChange(t => setup())
gui.add(mainOpts, "gridSize", 1, 50, 1).onChange(t => setup())
gui.add(mainOpts, "threadAmount", 1, 10, 1).onChange(t => setup())
gui.add(mainOpts, "moving")
gui
	.add(mainOpts, "multiThreaded")
	.onChange(t => setup())
	.name("multiple threads per ring")

let colors = gui.addFolder("Colors")
colors.addColor(mainOpts, "background")
colors.addColor(mainOpts, "stroke")
colors.addColor(mainOpts, "circles")
colors.add(mainOpts, "randomColors")
colors.addColor(mainOpts, "intersections")
colors.add(mainOpts, "evenOddFill")

gui.add(window, "setup").name("Generate")

/**
 * The rings around which the threads run
 */
class Ringer {
	constructor(opts) {
		this.p = opts.p
		this.rad = opts.rad
		this.threads = 0
		this.color = getRandomColor()
		this.dir = this.p.angleTo(Vec2.middle())
		this.angChange = rndFloat(0.01, 0.1) * rndSign()
		this.speed = rndFloat(1, 5)
	}
	render(ct) {
		if (mainOpts.moving) {
			this.p.addAngle(this.dir, this.speed)
			this.dir += this.angChange
		}
		let p = this.p.copy()
		ct.fillStyle = mainOpts.randomColors ? this.color : mainOpts.circles
		ct.lineWidth = 5
		ct.beginPath()
		p.arc(ct, this.rad)
		ct.fill()
		ct.stroke()
		ct.closePath()
	}
}

/**
 * These are the lines between the rings. Each Thread runs between n Ringers.
 */
class Thread {
	constructor(opts) {
		this.startRing = opts.startRing
		this.ringers = [this.startRing]
		this.propagate()
	}
	containsRinger(ringer) {
		return this.ringers.indexOf(ringer) >= 0
	}
	propagate() {
		//Recursively add ringers to this Thread
		let pool = ringers.filter(ringer => !this.containsRinger(ringer))

		if (!mainOpts.multiThreaded) {
			pool = pool.filter(
				ringer =>
					threads.find(thread => thread.containsRinger(ringer)) == undefined
			)
		}

		if (pool.length) {
			let next = rndArr(pool)
			this.ringers.push(next)
			next.threads++
			if (rndFloat() < mainOpts.propagateChance) {
				this.propagate()
			}
		}
	}
	getThreadPoints() {
		return this.ringers.slice(0, this.ringers.length - 1).map((ringer, i) => {
			//For each pair of ringers we return two points that lie on the edge of each respective ringer.
			let ringer0 = ringer
			let ringer1 = this.ringers[i + 1]
			let ang = ringer0.p.angleTo(ringer1.p)
			let p0 = ringer0.p.copy().addAngle(ang + PI05, ringer0.rad)
			let p1 = ringer1.p.copy().addAngle(ang + PI05, ringer1.rad)
			return [p0, p1]
		})
	}
	renderFills(ct) {
		ct.lineWidth = mainOpts.lineWidth
		ct.fillStyle = mainOpts.intersections
		ct.strokeStyle = mainOpts.stroke
		let pts = this.getThreadPoints()
		//Make a path through all points and fill
		if (pts.length) {
			ct.beginPath()

			pts[0][0].moveTo(ct)
			pts.flatMap(ptPair => ptPair).forEach(pt => pt.lineTo(ct))

			//Make the background fill also extend to the edge of the circle. Otherwise it looks weird.
			if (this.ringers.length > 1) {
				let firstR = this.ringers[0]
				let lastR = this.ringers[this.ringers.length - 1]

				let ang = lastR.p.angleTo(firstR.p)
				let p0 = lastR.p.copy().addAngle(ang + PI05, lastR.rad)
				let p1 = firstR.p.copy().addAngle(ang + PI05, firstR.rad)
				p0.lineTo(ct)
				p1.lineTo(ct)
			}
			ct.fill(mainOpts.evenOddFill ? "evenodd" : "nonzero")
			ct.closePath()
		}
	}
	render(ct) {
		ct.lineWidth = mainOpts.lineWidth
		ct.strokeStyle = mainOpts.stroke
		let pts = this.getThreadPoints()
		pts.forEach(ptPair => {
			ct.beginPath()
			ptPair[0].moveTo(ct)
			ptPair[1].lineTo(ct)
			ct.stroke()
			ct.closePath()
		})
	}
}

let ringers = []
let threads = []
function setup() {
	ringers = []
	threads = []
	let dim = mainOpts.gridSize
	//First we generate some ringers in a grid
	for (let i = 0; i < dim; i++) {
		for (let j = 0; j < dim; j++) {
			ringers.push(
				new Ringer({
					p: new Vec2(
						((2.5 + i) * width) / (dim + 4),
						((2.5 + j) * height) / (dim + 4)
					),
					rad: (rndFloat(0.1, 0.3) * width) / dim
				})
			)
		}
	}

	//Now we create threads that run around those ringers
	for (let i = 0; i < mainOpts.threadAmount; i++) {
		threads.push(new Thread({ startRing: rndArr(ringers) }))
	}
	paused = false
}

function render() {
	if (paused) {
		window.requestAnimationFrame(render)
		return
	}
	c.clearRect(0, 0, width, height)
	c.fillStyle = mainOpts.background
	c.fillRect(0, 0, width, height)

	//draw the fill between the threads
	threads.forEach(athreads => athreads.renderFills(c))
	//draw the rings
	ringers.forEach(ringer => ringer.render(c))
	//finally, draw the threads
	threads.forEach(athreads => athreads.render(c))

	cnv.style.cursor = hoveredRinger ? "pointer" : "default"
	window.requestAnimationFrame(render)
}
render()
setup()

window.addEventListener("mousemove", ev => {
	setMouse(ev)
	setHovered()
	if (grabbedRinger) {
		grabbedRinger.p = mouse
	}
})
var hasDeletedThisClick = false
window.addEventListener("touchmove", ev => {
	setMouse(ev)
	setHovered()
	if (grabbedRinger) {
		grabbedRinger.p = mouse
	}
})

window.addEventListener("mousedown", ev => {
	setMouse(ev)
	setHovered()

	if (hoveredRinger && !grabbedRinger) {
		grabbedRinger = hoveredRinger
	}
})
var touches = []
window.addEventListener("touchstart", ev => {
	if (ev.touches.length > 1) ev.preventDefault()
	setMouse(ev)
	setHovered()
	if (hoveredRinger && !grabbedRinger) {
		grabbedRinger = hoveredRinger
	}
})
window.addEventListener("mouseup", ev => {
	setMouse(ev)
	setHovered()
	grabbedRinger = null
})
window.addEventListener("touchend", ev => {
	setHovered()
	grabbedRinger = null
})

function setMouse(ev) {
	let rect = cnv.getBoundingClientRect()
	let el = ev.touches ? ev.touches[ev.touches.length - 1] : ev
	let top = rect.top

	let y = el.clientY
	if (rect.width < rect.height) {
		top = (rect.height - rect.width) / 2
		y = el.clientY - top
	}
	mouse = new Vec2(el.clientX - rect.left, el.clientY - top).multiply(
		width / rect.width
	)
	return rect
}
function setHovered() {
	hoveredRinger = null
	let found = ringers.find(ringer => ringer.p.distanceTo(mouse) < ringer.rad)
	if (found) {
		hoveredRinger = found
	}
}
