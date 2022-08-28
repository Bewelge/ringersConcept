let mainOpts = {
	propagation: {
		default: false,
		sortedAngles: true
	},
	moving: false,
	clockwise: false,
	closed: true,
	threadIntersections: false,
	ringIntersections: false,
	propagateChance: 0.9,
	gridSize: 8,
	circleMin: 10,
	circleMax: 50,
	threadAmount: 1,
	multiThreaded: false,
	threadOffset: 10,
	background: "#afafaf",
	circleStroke: rgba(245, 245, 245, 1),
	threadStroke: rgba(0, 0, 0, 1),
	threadLineWidth: 8,
	circleLineWidth: 0,
	circles: "#ffe800",
	threadedCircles: "#000000",
	intersections: "#ffffff",
	evenOddFill: false,
	randomColors: false,
	renderUnconnected: false
}

let hoveredRinger = null
let grabbedRinger = null

let gui = new dat.GUI({ width: 500 })

var first = gui.addFolder("Propagation")
var pos1 = first
	.add(mainOpts.propagation, "default")
	.name("Random")
	.listen()
	.onChange(t => setChecked("default"))
var neg1 = first
	.add(mainOpts.propagation, "sortedAngles")
	.name("Sorted Angles")
	.listen()
	.onChange(t => setChecked("sortedAngles"))

function setChecked(prop) {
	Object.keys(mainOpts.propagation).forEach(
		key => (mainOpts.propagation[key] = false)
	)
	mainOpts.propagation[prop] = true
	setup()
}

gui.add(mainOpts, "propagateChance", 0, 1, 0.01).onChange(t => setup())
gui.add(mainOpts, "gridSize", 1, 50, 1).onChange(t => setup())
gui.add(mainOpts, "circleMin", 1, 50, 1).onChange(t => setup())
gui.add(mainOpts, "circleMax", 1, 50, 1).onChange(t => setup())
gui.add(mainOpts, "threadAmount", 1, 10, 1).onChange(t => setup())
gui.add(mainOpts, "renderUnconnected")
gui.add(mainOpts, "moving")
gui.add(mainOpts, "clockwise")
gui.add(mainOpts, "closed")
gui
	.add(mainOpts, "threadIntersections")
	.onChange(t => setup())
	.name("allow thread intersections")
gui
	.add(mainOpts, "ringIntersections")
	.onChange(t => setup())
	.name("allow ring intersections")
gui
	.add(mainOpts, "multiThreaded")
	.onChange(t => setup())
	.name("multiple threads/ring")

let colors = gui.addFolder("Rendering")
colors.addColor(mainOpts, "background")
colors.addColor(mainOpts, "intersections")
colors.addColor(mainOpts, "threadStroke")
colors.add(mainOpts, "threadOffset", 0, 10, 0.1)
colors.add(mainOpts, "threadLineWidth", 0, 15, 0.1)
colors.addColor(mainOpts, "circles")
colors.addColor(mainOpts, "threadedCircles")
colors.addColor(mainOpts, "circleStroke")
colors.add(mainOpts, "circleLineWidth", 0, 15, 0.1)

colors.add(mainOpts, "randomColors")
colors.add(mainOpts, "evenOddFill")

gui.add(window, "setup").name("Generate new")

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
		ct.fillStyle = mainOpts.randomColors
			? this.color
			: this.threads > 0
			? mainOpts.threadedCircles
			: mainOpts.circles
		ct.lineWidth = mainOpts.circleLineWidth
		ct.strokeStyle = mainOpts.circleStroke
		ct.beginPath()
		p.arc(ct, this.rad)
		ct.fill()
		if (mainOpts.circleLineWidth > 0) {
			ct.stroke()
		}
		ct.closePath()
	}
}

/**
 * These are the lines between the rings. Each Thread runs between n Ringers.
 */
class Thread {
	constructor(opts) {
		this.startRing = opts.startRing
		this.startRing.threads++
		this.ringers = [this.startRing]
		this.propagate()
	}
	containsRinger(ringer) {
		return this.ringers.indexOf(ringer) >= 0
	}
	/**
	 * Recursively add ringers to this Thread
	 **/
	propagate() {
		if (mainOpts.propagation.default) {
			//filter out any candidates for the next ringer that are already included in this thread
			let pool = getCandidates(this)

			if (pool.length) {
				let next = rndArr(pool)
				this.ringers.push(next)
				next.threads++
				if (rndFloat() < mainOpts.propagateChance) {
					this.propagate()
				}
			}
		} else if (mainOpts.propagation.sortedAngles) {
			let pool = getCandidates(this).filter(ringer => ringer.threads == 0)
			let amount = Math.min(pool.length, 10)
			let selection = []
			for (let i = 0; i < amount; i++) {
				let candidate = rndArr(pool)
				pool.splice(pool.indexOf(candidate), 1)
				selection.push(candidate)
			}
			let m = selection
				.map(ringer => ringer.p)
				.reduce((prev, curr) => prev.addVector(curr), new Vec2())
				.multiply(1 / selection.length)
			selection.sort((ringerA, ringerB) =>
				getSignedAng(ringerA.p.angleTo(m), ringerB.p.angleTo(m))
			)
			selection.forEach(ringer => {
				ringer.threads++
				this.ringers.push(ringer)
			})
		}
	}
	getThreadPoints() {
		let lines = this.ringers
			.slice(0, this.ringers.length - 1)
			.map((ringer, i) => {
				//For each pair of ringers we return two points that lie on the edge of each respective ringer.
				let ringer0 = ringer
				let ringer1 = this.ringers[i + 1]
				return getRingerEdgePoints(ringer0, ringer1)
			})
		if (mainOpts.closed) {
			let firstR = this.ringers[0]
			let lastR = this.ringers[this.ringers.length - 1]
			lines.push(getRingerEdgePoints(lastR, firstR))
		}
		return lines
	}
	renderFills(ct) {
		ct.fillStyle = mainOpts.intersections
		let pts = this.getThreadPoints()
		//Make a path through all points and fill
		if (pts.length) {
			ct.beginPath()

			pts[0].p0.moveTo(ct)
			pts.forEach((ptPair, i) => {
				ptPair.p0.lineTo(ct)
				ptPair.p1.lineTo(ct)
				let nextPair = i < pts.length - 1 ? pts[i + 1] : pts[0]
				let ring1P = ptPair.ringer1.p
				let ang0 = ring1P.angleTo(ptPair.p1)
				let ang1 = nextPair.ringer0.p.angleTo(nextPair.p0)
				ct.arc(
					ring1P.x,
					ring1P.y,
					ptPair.ringer1.rad + mainOpts.threadOffset,
					ang0,
					ang1
				)
			})

			//Make the background fill also extend to the edge of the last&first circle. Otherwise it looks weird.
			if (this.ringers.length > 1) {
				let firstR = this.ringers[0]
				let lastR = this.ringers[this.ringers.length - 1]

				let { p0, p1 } = getRingerEdgePoints(lastR, firstR)
				p0.lineTo(ct)
				p1.lineTo(ct)
				let ang0 = lastR.p.angleTo(p0)
				let ang1 = firstR.p.angleTo(p1)
				ct.arc(
					lastR.p.x,
					lastR.p.y,
					lastR.rad + mainOpts.threadOffset,
					ang0,
					ang1
				)
			}
			ct.fill(mainOpts.evenOddFill ? "evenodd" : "nonzero")
			ct.closePath()
		}
	}
	render(ct) {
		ct.lineWidth = mainOpts.threadLineWidth
		ct.strokeStyle = mainOpts.threadStroke
		let pts = this.getThreadPoints()
		ct.beginPath()
		pts.forEach((ptPair, i) => {
			ptPair.p0.moveTo(ct)
			ptPair.p1.lineTo(ct)

			let nextPair = i < pts.length - 1 ? pts[i + 1] : pts[0]
			let ring1P = ptPair.ringer1.p
			let ang0 = ring1P.angleTo(ptPair.p1)
			let ang1 = nextPair.ringer0.p.angleTo(nextPair.p0)
			ct.arc(
				ring1P.x,
				ring1P.y,
				ptPair.ringer1.rad + mainOpts.threadOffset,
				ang0,
				ang1
			)
		})
		ct.stroke()
		ct.closePath()
	}
}

let ringers = []
let threads = []
function getRingerEdgePoints(ringer0, ringer1) {
	let ang = ringer0.p.angleTo(ringer1.p)
	let angChange = mainOpts.clockwise ? PI05 : -PI05
	let p0 = ringer0.p
		.copy()
		.addAngle(ang + angChange, ringer0.rad + mainOpts.threadOffset)
	let p1 = ringer1.p
		.copy()
		.addAngle(ang + angChange, ringer1.rad + mainOpts.threadOffset)
	return { p0, p1, ringer0, ringer1 }
}

function getCandidates(aThread) {
	//filter out any candidates for the next ringer that are already included in this thread
	let pool = ringers.filter(ringer => !aThread.containsRinger(ringer))

	if (!mainOpts.multiThreaded) {
		//remove all candidates that are included in any existing threads.
		pool = pool.filter(
			ringer =>
				threads.find(thread => thread.containsRinger(ringer)) == undefined
		)
	}

	if (!mainOpts.threadIntersections) {
		//filter thread intersections
		pool = pool.filter(ringer => {
			let curRinger = aThread.ringers[aThread.ringers.length - 1]
			let newLine = getRingerEdgePoints(curRinger, ringer)
			let allThreads = threads.concat([aThread])
			let allLines = allThreads.flatMap(thread => thread.getThreadPoints())
			if (mainOpts.closed) {
				let lastLine = getRingerEdgePoints(ringer, aThread.ringers[0])
				allLines.push(lastLine)
			}
			return (
				allLines.find(line =>
					linesIntersect(newLine.p0, newLine.p1, line.p0, line.p1)
				) == undefined
			)
		})
	}

	if (!mainOpts.ringIntersections) {
		pool = pool.filter(ringer => {
			let curRinger = aThread.ringers[aThread.ringers.length - 1]
			let newLine = getRingerEdgePoints(curRinger, ringer)
			let lastLineIntersects = false
			if (mainOpts.closed) {
				let newLastLine = getRingerEdgePoints(ringer, aThread.ringers[0])
				lastLineIntersects =
					ringers.find(
						aRinger =>
							inteceptCircleLineSeg(
								aRinger.p,
								aRinger.rad - 1,
								newLastLine.p0,
								newLastLine.p1
							).length != 0
					) != undefined
			}
			return (
				!lastLineIntersects &&
				ringers.find(
					aRinger =>
						inteceptCircleLineSeg(
							aRinger.p,
							aRinger.rad - 1,
							newLine.p0,
							newLine.p1
						).length != 0
				) == undefined
			)
		})
	}
	return pool
}
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
					rad: rndInt(mainOpts.circleMin, mainOpts.circleMax)
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
	ringers
		.filter(ringer => ringer.threads != 0)
		.forEach(ringer => ringer.render(c))
	//finally, draw the threads
	threads.forEach(athreads => athreads.render(c))

	if (mainOpts.renderUnconnected) {
		ringers
			.filter(ringer => ringer.threads == 0)
			.forEach(ringer => ringer.render(c))
	}

	cnv.style.cursor = hoveredRinger ? "pointer" : "default"
	window.requestAnimationFrame(render)
}
render()
setup()
