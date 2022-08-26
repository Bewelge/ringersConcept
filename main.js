let mainOpts = {
	moving: false,
	propagateChance: 0.9,
	gridSize: 10,
	connectionAmount: 1,
	multiConnections: false,
	background: rgba(0, 0, 0, 1),
	stroke: rgba(85, 85, 85, 1),
	lineWidth: 4,
	circles: "#ff7f3f",
	intersections: rgba(150, 150, 150, 1),
	evenOddFill: true,
	randomColors: false,
	jiggle: 0
}

let hoveredRinger = null
let grabbedRinger = null

let gui = new dat.GUI()
gui.add(mainOpts, "propagateChance", 0, 1, 0.01).onChange(t => setup())
gui.add(mainOpts, "gridSize", 1, 50, 1).onChange(t => setup())
gui.add(mainOpts, "connectionAmount", 1, 10, 1).onChange(t => setup())
gui.add(mainOpts, "moving")
gui
	.add(mainOpts, "multiConnections")
	.onChange(t => setup())
	.name("multiple lines per ring")

gui.add(mainOpts, "jiggle", 0, 15, 0.5)

let colors = gui.addFolder("Colors")
colors.addColor(mainOpts, "background")
colors.addColor(mainOpts, "stroke")
colors.addColor(mainOpts, "circles")
colors.add(mainOpts, "randomColors")
colors.addColor(mainOpts, "intersections")
colors.add(mainOpts, "evenOddFill")

gui.add(window, "setup").name("Generate")

class Ringer {
	constructor(opts) {
		this.p = opts.p
		this.rad = opts.rad
		this.connections = 0
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
		if (mainOpts.jiggle) {
			p.addAngle(rndAng(), mainOpts.jiggle)
		}
		ct.fillStyle = mainOpts.randomColors ? this.color : mainOpts.circles
		ct.lineWidth = 5
		ct.beginPath()
		p.arc(ct, this.rad)
		ct.fill()
		ct.stroke()
		ct.closePath()
	}
}

class Connection {
	constructor(opts) {
		this.startRing = opts.startRing
		this.ringers = [this.startRing]
		this.propagate()
	}
	containsRinger(ringer) {
		return this.ringers.indexOf(ringer) >= 0
	}
	propagate() {
		let pool = ringers.filter(ringer => !this.containsRinger(ringer))

		if (!mainOpts.multiConnections) {
			pool = pool.filter(
				ringer =>
					connections.find(connection => connection.containsRinger(ringer)) ==
					undefined
			)
		}

		if (pool.length) {
			let next = rndArr(pool)
			this.ringers.push(next)
			next.connections++
			if (rndFloat() < mainOpts.propagateChance) {
				this.propagate()
			}
		}
	}
	getConnectionPoints() {
		return this.ringers.slice(0, this.ringers.length - 1).map((ringer, i) => {
			let ringer0 = ringer
			let ringer1 = this.ringers[i + 1]
			let ang = ringer0.p.angleTo(ringer1.p)
			let p0 = ringer0.p.copy().addAngle(ang + PI05, ringer0.rad)
			let p1 = ringer1.p.copy().addAngle(ang + PI05, ringer1.rad)
			return [p0, p1]
		})
	}
	renderFills(ct) {
		ct.lineWidth = 5
		ct.fillStyle = mainOpts.intersections
		ct.strokeStyle = mainOpts.stroke
		let pts = this.getConnectionPoints()
		if (pts.length) {
			ct.beginPath()

			pts[0][0].moveTo(ct)
			pts.flatMap(ptPair => ptPair).forEach(pt => pt.lineTo(ct))
			ct.fill(mainOpts.evenOddFill ? "evenodd" : "nonzero")
			ct.closePath()
		}
	}
	render(ct) {
		ct.lineWidth = 5
		ct.strokeStyle = mainOpts.stroke
		let pts = this.getConnectionPoints()
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
let connections = []
function setup() {
	ringers = []
	connections = []
	let dim = mainOpts.gridSize
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

	for (let i = 0; i < mainOpts.connectionAmount; i++) {
		connections.push(new Connection({ startRing: rndArr(ringers) }))
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
	connections.forEach(connections => connections.renderFills(c))
	ringers.forEach(ringer => ringer.render(c))
	connections.forEach(connections => connections.render(c))

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
