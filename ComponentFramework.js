// testC.filter = "blur(3px)"
var isExportColors = true
var boundingRectMargin = 10
function getTestData() {
	if (testData == null) {
		testData = testC.getImageData(0, 0, width, height)
	}
	return testData
}

function testPixel(vec) {
	if (!vec.isInBound()) {
		return false
	}
	let ind = Math.round(vec.x) * 4 + Math.round(vec.y) * 4 * width
	return getTestData().data[ind + 3] == 0
}

var svgIdCounter = 0
class VPathSVG {
	constructor(path, opts = {}) {
		this.isPetal = 0
		this.test = () => true
		this.svg = document.createElementNS("http://www.w3.org/2000/svg", "path")
		this.path = path
		this.isContext = !(this.path instanceof Path2D)
		this.z = opts.z
		this.z1 = 0
		this.z2 = 0
		this.z3 = 0
		this.fillStyle = opts.fillStyle || "rgb(255,255,255)"
		this.strokeStyle = opts.strokeStyle || "rgb(255,255,255)"
		this.lineWidth = opts.hasOwnProperty("lineWidth") ? opts.lineWidth : 0.5
		this.isStroke = opts.isStroke
		this.isFill = opts.isFill

		this.onlyClip = false

		this.updateTranslate = () => {}
		this.currentTranslate = new Vec2()
		this.d = ""
		this.id = svgIdCounter++
		this.rotation = 0
		this.commands = []
	}
	getBoundingRect() {
		if (!this.boundingRect) {
			let margin = boundingRectMargin

			let maxX = -Infinity
			let minX = Infinity
			let maxY = -Infinity
			let minY = Infinity
			this.commands.forEach(cmd => {
				if (cmd.x < minX) {
					minX = cmd.x
				}
				if (cmd.x > maxX) {
					maxX = cmd.x
				}
				if (cmd.y < minY) {
					minY = cmd.y
				}
				if (cmd.y > maxY) {
					maxY = cmd.y
				}
			})
			if (
				maxX == -Infinity ||
				minX == Infinity ||
				maxY == -Infinity ||
				minY == Infinity
			) {
				console.log(123)
			}
			minX = peg(minX, 0, width)
			maxX = peg(maxX, 0, width)
			minY = peg(minY, 0, height)
			maxY = peg(maxY, 0, height)
			this.boundingRect = new Rect({
				x: peg(minX - margin, 0, width),
				y: peg(minY - margin, 0, height),
				w: peg(maxX - minX + margin * 2, 0, width),
				h: peg(maxY - minY + margin * 2, 0, height)
			})
		}
		return this.boundingRect
	}
	linePoints(pts) {
		this.moveTo(pts[0].x, pts[0].y)
		for (let i = 1; i < pts.length; i++) {
			this.lineTo(pts[i].x, pts[i].y)
		}
		return this
	}
	renderTest() {
		if (this.hasOwnProperty("clipSpacing")) {
			testC.lineWidth = this.clipSpacing
		} else {
			testC.lineWidth = svgClipSpacing
		}
		testC.save()
		if (this.rotation != 0) {
			testC.rotate(this.rotation)
			this.currentTranslate
				.copy()
				.rotateAround(new Vec2(), -this.rotation)
				.translate(testC)
		}

		testC.fill(this.path)
		testC.stroke(this.path)
		testC.restore()
		// this.render(testC, "black")
	}
	testPixel(p) {
		if (this.clippedBy) {
			return testC.isPointInPath(this.clippedBy, p.x, p.y) && testPixel(p)
		}
		return testPixel(p)
	}
	doCautiousPath(ct) {
		let step = 1
		ct.beginPath()
		let newCommands = []
		if (this.commands.length) {
			let cmds = this.commands.slice(0)
			let lines = []
			let curLine = []
			for (let i = 0; i < cmds.length; i++) {
				let cmd = cmds[i]
				if (cmd.type == "M") {
					if (curLine.length) {
						lines.push(curLine)
					}
					curLine = [cmd]
				}
				if (cmd.type == "L") {
					curLine.push(cmd)
				}
			}
			if (curLine.length) {
				lines.push(curLine)
			}

			lines.forEach(line => {
				let isDown = false
				let paths = []
				let segStart = new Vec2(line[0].x, line[0].y)
				for (let i = 1; i < line.length; i++) {
					let segEnd = new Vec2(line[i].x, line[i].y)
					let dis = segStart.distanceTo(segEnd)
					let steps = Math.ceil(Math.max(1, dis / step))

					for (let j = 0; j <= steps; j++) {
						let p = Vec2.middleOf(segStart, segEnd, j / steps)
							.addVector(this.currentTranslate)
							.rotateAround(this.currentTranslate, this.rotation)

						if (!isDown) {
							if (this.testPixel(p)) {
								isDown = true
								if (
									!(
										j == steps &&
										i == line.length - 1 &&
										lines.indexOf(line) == lines.length - 1
									)
								)
									newCommands.push({ type: "M", x: p.x, y: p.y })
							}
						} else {
							if (this.testPixel(p)) {
								//pen is down and next pixel free -> only draw line if we're at the end of the segment
								if (j == steps) {
									newCommands.push({ type: "L", x: p.x, y: p.y })
								}
							} else {
								//pen is down and next pixel filled -> finish line

								newCommands.push({ type: "L", x: p.x, y: p.y })
								isDown = false
							}
						}
					}

					segStart = segEnd
				}
			})

			//Combine moveTo and lineTo commands that start/end at the same point
			// let lastCmd = null
			// for (let i = 0; i < newCommands.length; i++) {
			// 	let cmd = newCommands[i]
			// 	if (cmd.type == "M") {
			// 		if (lastCmd && lastCmd.type == "L") {
			// 			//command is moveTo but last command is already at same spot --> delete this command
			// 			if (lastCmd.x == cmd.x && lastCmd.y == cmd.y) {
			// 				newCommands.splice(i, 1)
			// 				continue
			// 			}
			// 		}
			// 	}
			// 	lastCmd = cmd
			// }

			// clear out lines below certain threshold
			let minLength = MIN_LINE_LENGTH
			let lineStartInd = 0
			let totalLength = 0
			let curLength = 0
			if (newCommands.length) {
				let curP = new Vec2(newCommands[0].x, newCommands[0].y)
				let toDelete = []
				for (let i = 1; i < newCommands.length; i++) {
					let cmd = newCommands[i]
					let p = new Vec2(cmd.x, cmd.y)
					if (cmd.type == "M") {
						curP = p
						curLength = 0
						lineStartInd = i
						continue
					}
					let dis = curP.distanceTo(p)
					curLength += dis
					totalLength += dis
					let isLastOfLine =
						i == newCommands.length - 1 || newCommands[i + 1].type == "M"
					if (isLastOfLine) {
						if (curLength < minLength) {
							for (let k = lineStartInd; k <= i; k++) {
								toDelete.push(k)
								totalLength -= curLength
							}
						}
					}
				}
				if (totalLength < minLength) {
					newCommands = []
				}
				newCommands = newCommands.filter((_, i) => !toDelete.includes(i))
			}
		}

		let lastCmd = ""
		let toDel = []
		for (let i = 0; i < newCommands.length - 1; i++) {
			let cmd = newCommands[i]
			if (cmd.type == "M" && lastCmd == "M") {
				toDel.push(i - 1)
			}

			lastCmd = cmd.type
		}
		toDel.reverse().forEach(ind => newCommands.splice(ind, 1))

		newCommands.forEach(cmd => {
			if (cmd.type == "M") {
				ct.moveTo(cmd.x, cmd.y)
			} else if (cmd.type == "L") {
				ct.lineTo(cmd.x, cmd.y)
			}
		})

		this.d = newCommands.map(command => this.commandToString(command)).join("")
	}

	render(ct, overWriteFill = false, overWriteStroke = false) {
		this.doCautiousPath(ct)

		ct.stroke()

		ct.closePath()
	}
	renderOnCnv(ct, overWriteFill = false, overWriteStroke = false) {
		// if (this.onlyClip) return
		ct.save()

		if (this.clippedBy) {
			ct.clip(this.clippedBy)
		}
		if (this.currentTranslate.x != 0 || this.currentTranslate.y != 0) {
			ct.translate(this.currentTranslate.x, this.currentTranslate.y)
			// ct.rotate(this.rotation)
		}
		if (this.isFill) {
			ct.fillStyle = overWriteFill ? overWriteFill : this.fillStyle
			ct.fill(this.path)
		}
		if (this.isStroke) {
			ct.strokeStyle = overWriteStroke ? overWriteStroke : this.strokeStyle
			ct.lineWidth = this.lineWidth
			ct.stroke(this.path)
		}

		ct.restore()
	}
	translate(x, y) {
		this.currentTranslate.add(x, y)
		return this
	}

	rotate(by) {
		this.rotation = by
	}
	setTranslate(x, y) {
		this.currentTranslate = new Vec2(x, y)
		return this
	}
	setClippedBy(path) {
		this.clippedBy = path
	}
	setTransform(x, y) {
		this.svg.setAttributeNS(null, "transform", "translate(" + x + " " + y + ")")
		return this
	}
	setClipPath(path) {
		this.svg.setAttributeNS(null, "clip-path", "url(#" + path.id + ")")
		this.clipPaths = path.clipPaths
		return this
	}
	copy() {
		let newP = new VPathSVG(new Path2D(this.path), this.z, {
			fillStyle: this.fillStyle,
			strokeStyle: this.strokeStyle,
			lineWidth: this.lineWidth,
			isFill: this.isFill,
			isStroke: this.isStroke
		})
		newP.commands = this.commands.slice(0)

		return newP
	}
	getClipPath() {
		let svg = document.createElementNS("http://www.w3.org/2000/svg", "path")
	}
	setSvgAttribute(name, val) {
		this.svg.setAttributeNS(null, name, val)
	}
	getD() {
		return this.d
		return this.commands.map(command => this.commandToString(command)).join("")
	}
	rect(p, w, h) {
		p.moveTo(this)
		p.copy().add(w, 0).lineTo(this)
		p.copy().add(w, h).lineTo(this)
		p.copy().add(0, h).lineTo(this)
		p.lineTo(this)
		return this
	}
	commandToString(cmd) {
		let tx = 0 // this.currentTranslate.x
		let ty = 0 // this.currentTranslate.y
		switch (cmd.type) {
			case "M":
				return "M" + (cmd.x + tx) + "," + (cmd.y + ty) + " "
			case "L":
				return "L" + (cmd.x + tx) + "," + (cmd.y + ty) + " "
			case "Q":
				return (
					"Q" +
					(cmd.cx + tx) +
					"," +
					(cmd.cy + ty) +
					" " +
					(cmd.px + tx) +
					"," +
					(cmd.py + ty) +
					" "
				)
			case "C":
				return (
					"C" +
					(cmd.c0x + tx) +
					"," +
					(cmd.c0y + ty) +
					" " +
					(cmd.c1x + tx) +
					"," +
					(cmd.c1y + ty) +
					" " +
					(cmd.p1x + tx) +
					"," +
					(cmd.p1y + ty) +
					" "
				)
			case "A":
				return (
					"A" +
					" " +
					cmd.rad0 +
					"," +
					cmd.rad1 +
					" " +
					cmd.rotation +
					" 1 0 " +
					(cmd.x + tx) +
					" " +
					(cmd.y + ty + 0.01) +
					" "
				)
			case "Z":
				return "Z "
		}
	}
	getSvg() {
		let strokeCol = isExportColors
			? this.isFill
				? this.fillStyle
				: this.strokeStyle
			: "black"
		this.svg.setAttributeNS(null, "d", this.getD())
		this.svg.fillStyle = strokeCol
		this.svg.setAttributeNS(
			null,
			"style",
			[
				"fill:none;",
				"stroke-width:" + 0.5 + ";",
				"stroke:" + strokeCol + ";"
			].join("")
		)

		return this.svg
	}
	beginPath() {
		if (this.isContext) {
			this.path.beginPath()
		}
		return this
	}

	moveTo(x, y) {
		this.path.moveTo(x, y)
		this.commands.push({ type: "M", x, y })
		return this
	}
	lineTo(x, y) {
		this.path.lineTo(x, y)
		this.commands.push({ type: "L", x, y })

		return this
	}
	quadraticCurveTo(cx, cy, px, py) {
		this.path.quadraticCurveTo(cx, cy, px, py)
		this.commands.push({ type: "Q", cx, cy, px, py })

		return this
	}
	bezierCurveTo(c0x, c0y, c1x, c1y, p1x, p1y) {
		this.path.bezierCurveTo(c0x, c0y, c1x, c1y, p1x, p1y)
		this.commands.push({ type: "C", c0x, c0y, c1x, c1y, p1x, p1y })

		return this
	}
	arc(x, y, rad, beginningAng, endAng) {
		this.moveTo(x, y)
		this.path.arc(x, y, rad, beginningAng, endAng)
		this.commands.push(
			this.commands.push({ type: "A", rad0: rad, rad1: rad, rotation: 0, x, y })
		)
		// this.d +=
		// 	"A" + " " + rad + "," + rad + " " + 0 + " 0 0 " + x + "," + y + " "
		return this
	}

	closePath() {
		this.commands.push({ type: "Z" })

		// this.d += "Z "
		if (this.isContext) {
			this.path.closePath()
		}
		return this
	}
	stroke() {
		if (this.isContext) {
			this.path.lineWidth = this.lineWidth
			this.path.strokeStyle = this.strokeStyle
			this.path.stroke()
		}
		return this
	}
	fill() {
		if (this.isContext) {
			this.path.fillStyle = this.fillStyle
			this.path.fill()
		}
		return this
	}
}

class VSquareSVG extends VPathSVG {
	constructor(path, p, w, h, margin = 2, opts = {}) {
		super(path, opts)
		p.copy().add(margin, margin).moveTo(this)
		p.copy()
			.add(0, margin)
			.addAngle(0, w - margin)
			.lineTo(this)
		p.copy()
			.addAngle(0, w - margin)
			.addAngle(PI05, h - margin)
			.lineTo(this)
		p.copy()
			.add(margin, 0)
			.addAngle(PI05, h - margin)
			.lineTo(this)
		p.copy().add(margin, margin).lineTo(this)
	}
}
class CircleSVG extends VPathSVG {
	constructor(z, p, rad0, opts = {}) {
		super(new Path2D(), opts)

		this.id = svgIdCounter++

		this.p = p.copy()
		this.z = opts.z

		this.p = p
		this.rad0 = rad0

		this.penDownAng = 0
		this.startAng = randomStartingAngles ? rndAng() : 0

		this.path.arc(this.p.x, this.p.y, rad0, 0, PI2)
		this.rotation = 0
		allCircles.push(this)
	}
	getBoundingRect() {
		if (!this.boundingRect) {
			let margin = boundingRectMargin

			this.boundingRect = new Rect({
				x: this.p.x - this.rad0 - margin,
				y: this.p.y - this.rad0 - margin,
				w: this.rad0 * 2 + margin * 2,
				h: this.rad0 * 2 + margin * 2
			})
		}
		return this.boundingRect
	}
	translate(x, y) {
		this.currentTranslate = new Vec2(x, y)
	}
	doCautiousPath(ct) {
		ct.beginPath()
		let isDown = false
		let steps = Math.ceil(PI2 * this.rad0)
		let startAng = this.startAng
		let penDownAng = 0
		let newD = ""
		let fromToPairs = []
		let curPair = []
		let samplePoints = []
		let pp = this.p.copy().addVector(this.currentTranslate)
		for (let i = 0; i <= steps; i++) {
			let ang = this.startAng + (PI2 * i) / steps
			samplePoints.push(pp.copy().addAngle(ang, this.rad0))
		}
		for (let i = 0; i <= steps; i++) {
			let ang = this.startAng + (PI2 * i) / steps
			let p = samplePoints[i]
			if (!isDown) {
				if (this.testPixel(p)) {
					startAng = ang
					isDown = true
					curPair.push(ang)
				}
			} else {
				if (!this.testPixel(p) || i == steps) {
					curPair.push(ang)
					fromToPairs.push(curPair)
					curPair = []
					isDown = false
				}
			}
		}
		fromToPairs.forEach(pair => {
			let fromAng = pair[0]
			let toAng = pair[1]
			let length = (toAng - fromAng) * this.rad0
			if (length > MIN_LINE_LENGTH) {
				let isLargeArc = toAng - fromAng > PI ? 1 : 0
				let p0 = pp.copy().addAngle(fromAng, this.rad0)
				let p1 = pp.copy().addAngle(toAng, this.rad0)
				newD += "M " + p0.x + "," + p0.y + " "

				if (Math.abs(toAng - fromAng) > PI) {
					let midP = pp
						.copy()
						.addAngle(fromAng + (toAng - fromAng) / 2, this.rad0)
					isLargeArc = (toAng - fromAng) * 0.5 > PI ? 1 : 0
					newD +=
						"A " +
						this.rad0 +
						"," +
						this.rad0 +
						" " +
						"1 " +
						isLargeArc +
						" 1 " +
						midP.x +
						"," +
						midP.y +
						" "
				}

				newD +=
					"A " +
					this.rad0 +
					"," +
					this.rad0 +
					" " +
					"1 " +
					isLargeArc +
					" 1 " +
					p1.x +
					"," +
					p1.y +
					" "
				ct.moveTo(p0.x, p0.y)
				ct.arc(pp.x, pp.y, this.rad0, fromAng, toAng)
			}
		})
		this.d = newD
	}
	getD() {
		return this.d
	}
}
class CircleRingSVG extends VPathSVG {
	constructor(z, p, rad0, rad1, opts = {}) {
		super(new Path2D(), z, opts)

		this.id = svgIdCounter++

		this.p = p.copy()
		this.z = z

		this.p = p

		this.rad0 = rad0
		this.rad1 = rad1

		this.path.arc(this.p.x, this.p.y, rad0, 0, PI2)
		this.path.arc(this.p.x, this.p.y, rad1, 0, PI2)
		this.rotation = 0
	}
	getBoundingRect() {
		if (!this.boundingRect) {
			let margin = boundingRectMargin
			this.boundingRect = new Rect({
				x: this.p.x - this.rad0 - margin,
				y: this.p.y - this.rad0 - margin,
				w: this.rad0 * 2 + margin * 2,
				h: this.rad0 * 2 + margin * 2
			})
		}
		return this.boundingRect

		// if (rect.x)
		return rect
	}
	translate(x, y) {
		this.currentTranslate = new Vec2(x, y)
	}
	renderTest() {
		testC.save()
		this.currentTranslate
			.copy()
			.rotateAround(new Vec2(), -this.rotation)
			.translate(testC)

		testC.fill(this.path, "evenodd")
		testC.stroke(this.path)
		testC.restore()
	}

	renderOnCnv(ct, overWriteFill = false, overWriteStroke = false) {
		ct.save()

		if (this.currentTranslate.x != 0 || this.currentTranslate.y != 0) {
			ct.translate(this.currentTranslate.x, this.currentTranslate.y)
			// ct.rotate(this.rotation)
		}
		if (this.isFill) {
			ct.fillStyle = overWriteFill ? overWriteFill : this.fillStyle
			ct.fill(this.path, "evenodd")
		}
		if (this.isStroke) {
			ct.strokeStyle = overWriteStroke ? overWriteStroke : this.strokeStyle
			ct.lineWidth = this.lineWidth

			ct.beginPath()
			ct.arc(0, 0, this.rad0, 0, PI2)
			ct.stroke()
			ct.closePath()
			ct.beginPath()
			ct.arc(0, 0, this.rad1, 0, PI2)
			ct.stroke()
			ct.closePath()
		}

		ct.restore()
	}
	doCautiousPath(ct) {
		ct.beginPath()
		let isDown = false
		let steps = Math.ceil(PI2 * this.rad0)
		let startAng = 0
		let newD = ""
		let samplePoints = []
		let fromToPairs = []
		let curPair = []
		let pp = this.p.copy().addVector(this.currentTranslate)
		for (let i = 0; i <= steps; i++) {
			let ang = (PI2 * i) / steps
			samplePoints.push(pp.copy().addAngle(ang, this.rad0))
		}
		for (let i = 0; i <= steps; i++) {
			let ang = (PI2 * i) / steps
			let p = samplePoints[i]
			if (!isDown) {
				if (this.testPixel(p)) {
					startAng = ang
					isDown = true
					curPair.push(ang)
				}
			} else {
				if (!this.testPixel(p) || i == steps) {
					isDown = false
					curPair.push(ang)
					fromToPairs.push(curPair)
					curPair = []
				}
			}
		}

		fromToPairs.forEach(pair => {
			let fromAng = pair[0]
			let toAng = pair[1]
			let length = (toAng - fromAng) * this.rad0
			if (length > MIN_LINE_LENGTH) {
				let isLargeArc = toAng - fromAng > PI ? 1 : 0
				let p0 = pp.copy().addAngle(fromAng, this.rad0)
				let p1 = pp.copy().addAngle(toAng, this.rad0)
				newD += "M " + p0.x + "," + p0.y + " "

				if (Math.abs(toAng - fromAng) > PI) {
					let midP = pp
						.copy()
						.addAngle(fromAng + (toAng - fromAng) / 2, this.rad0)
					isLargeArc = (toAng - fromAng) * 0.5 > PI ? 1 : 0
					newD +=
						"A " +
						this.rad0 +
						"," +
						this.rad0 +
						" " +
						"1 " +
						isLargeArc +
						" 1 " +
						midP.x +
						"," +
						midP.y +
						" "
				}

				newD +=
					"A " +
					this.rad0 +
					"," +
					this.rad0 +
					" " +
					"1 " +
					isLargeArc +
					" 1 " +
					p1.x +
					"," +
					p1.y +
					" "
				ct.moveTo(p0.x, p0.y)
				ct.arc(pp.x, pp.y, this.rad0, fromAng, toAng)
			}
		})

		isDown = false
		steps = Math.ceil(PI2 * this.rad1)
		startAng = 0
		samplePoints = []
		fromToPairs = []
		curPair = []

		for (let i = 0; i <= steps; i++) {
			let ang = (PI2 * i) / steps
			samplePoints.push(pp.copy().addAngle(ang, this.rad1))
		}
		for (let i = 0; i <= steps; i++) {
			let ang = (PI2 * i) / steps
			let p = samplePoints[i]
			if (!isDown) {
				if (this.testPixel(p)) {
					startAng = ang
					isDown = true
					curPair.push(ang)
				}
			} else {
				if (!this.testPixel(p) || i == steps) {
					isDown = false
					curPair.push(ang)
					fromToPairs.push(curPair)
					curPair = []
				}
			}
		}

		fromToPairs.forEach(pair => {
			let fromAng = pair[0]
			let toAng = pair[1]
			let length = (toAng - fromAng) * this.rad1
			if (length > MIN_LINE_LENGTH) {
				let isLargeArc = toAng - fromAng > PI ? 1 : 0
				let p0 = pp.copy().addAngle(fromAng, this.rad1)
				let p1 = pp.copy().addAngle(toAng, this.rad1)
				newD += "M " + p0.x + "," + p0.y + " "

				if (Math.abs(toAng - fromAng) > PI) {
					let midP = pp
						.copy()
						.addAngle(fromAng + (toAng - fromAng) / 2, this.rad1)
					isLargeArc = (toAng - fromAng) * 0.5 > PI ? 1 : 0
					newD +=
						"A " +
						this.rad1 +
						"," +
						this.rad1 +
						" " +
						"1 " +
						isLargeArc +
						" 1 " +
						midP.x +
						"," +
						midP.y +
						" "
				}

				newD +=
					"A " +
					this.rad1 +
					"," +
					this.rad1 +
					" " +
					"1 " +
					isLargeArc +
					" 1 " +
					p1.x +
					"," +
					p1.y +
					" "
				ct.moveTo(p0.x, p0.y)
				ct.arc(pp.x, pp.y, this.rad1, fromAng, toAng)
			}
		})
		this.d = newD
	}
	getD() {
		return this.d
	}
}

function getUrlParam(param) {
	const queryString = window.location.search
	let urlParams = new URLSearchParams(queryString)
	if (urlParams.has(param)) {
		return urlParams.get(param)
	}
	return false
}
function getSVGHref() {
	let svg = document.querySelector("svg")

	let serializer = new XMLSerializer()
	let source = serializer.serializeToString(svg)

	/**From https://stackoverflow.com/questions/23218174/how-do-i-save-export-an-svg-file-after-creating-an-svg-with-d3-js-ie-safari-an **/
	if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
		source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
	}
	if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
		source = source.replace(
			/^<svg/,
			'<svg xmlns:xlink="http://www.w3.org/1999/xlink"'
		)
	}

	source = '<?xml version="1.0" standalone="no"?>\r\n' + source
	/**end from */
	return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source)
}

var svgGenerating = false
function generateSvgPlot() {
	let svgEl = document.querySelector("#svgPlottable")

	while (svgEl.lastChild) {
		svgEl.removeChild(svgEl.lastChild)
	}

	svgEl.setAttributeNS(null, "viewbox", "0 0 2000 2000")
	svgEl.setAttributeNS(null, "height", "2000px")
	svgEl.setAttributeNS(null, "width", "2000px")

	let shapesByColor = {}
	// allShapes.forEach((shape, i) => {
	for (let i = allShapes.length - 1; i >= 0; i--) {
		let shape = allShapes[i]
		if (shape.getD() != "" && !shape.onlyClip) {
			let shapeSvg = shape.getSvg()
			if (i < Infinity) {
				if (!shapesByColor.hasOwnProperty(shapeSvg.fillStyle)) {
					shapesByColor[shapeSvg.fillStyle] = []
				}
				shapesByColor[shapeSvg.fillStyle].push(shapeSvg)
			}
		}
	}
	// })

	Object.values(shapesByColor).forEach(shapes => {
		let grp = document.createElementNS("http://www.w3.org/2000/svg", "g")
		shapes.forEach(shape => grp.appendChild(shape))
		svgEl.appendChild(grp)
	})

	let v = document.createElement("a")
	v.href = getSVGHref()
	v.download = document.title + " by Bewelge"
	v.click()

	cnvSvgPlot.style.display = "none"
	cnv.style.display = "block"
	// bgCnv.style.display = "block"
	svgGenerating = false
}
let allShapes = []

function renderAll() {
	document.querySelector("#plotterSettings").style.display = "none"
	// allShapes = []
	svgGenerating = true
	// if (!bgDisabled) {
	// 	if (!customBgStripesEnabled && !customBgCirclesEnabled) {
	// 		allShapes = allShapes.concat(bgShapes)
	// 	} else {
	// 		fillCustomBg()
	// 		allShapes = allShapes.concat(customBgShapes)
	// 	}
	// }

	testC.fillStyle = "black"
	testC.fillRect(0, 0, width, height)
	testC.clearRect(0, 0, width, height)
	cSvgPlot.clearRect(0, 0, width, height)
	allShapes.forEach(shape => shape.updateTranslate())
	let reversed = allShapes.slice(0).reverse()
	let shapes = allShapes.slice(0)
	// .filter(shape => shape.commands.length != 0)
	// let maxSkip = 0
	// shapes.forEach(shape => shape.getBoundingRect())
	// while (shapes.length > 0) {
	// let skipped = []
	// let drawn = []
	// DrawAction.with(() => {
	// 	testData = null
	// 	// }
	// })
	// c.clearRect(0, 0, width, height)

	forloop: for (let i = shapes.length - 1; i >= 0; i -= 1) {
		let gf = shapes[i]
		if (i < 0 || i > shapes.length - 1) break forloop
		if (shapes.length && !gf.discard && gf.test && gf.test()) {
			// let br = gf.boundingRect
			// let foundDrawn = drawn.find(shape => br.intersects(shape.boundingRect))
			// let foundSkipped = skipped.find(shape =>
			// 	br.intersects(shape.boundingRect)
			// )
			// if (
			// 	skipped.length < maxSkip &&
			// 	(foundDrawn != undefined || foundSkipped != undefined)
			// ) {
			// 	// console.log(123)
			// 	skipped.push(gf)
			// 	c.fillStyle = "rgba(255,0,0,0.2)"
			// 	gf.boundingRect.render(c)

			// 	continue forloop
			// }
			// if ((skipped.length >= maxSkip || drawn.length >= 20) && i != 0) {
			// 	DrawAction.with(() => {
			// 		testData = null
			// 		// }
			// 	})
			// 	break forloop
			// }
			DrawAction.with(() => {
				if (!gf.onlyClip) {
					gf.render(cSvgPlot)
				}
				if ((gf.isFill && gf.d != "") || gf.onlyClip || gf.alwaysClip) {
					gf.renderTest()
					testData = null
					// if (gf.getBoundingRect) {
					// 	let rect = gf.getBoundingRect()
					// 	let newDt = testC.getImageData(rect.x, rect.y, rect.w, rect.h)
					// 	try {
					// 		testData.data.set(
					// 			newDt.data,
					// 			Math.floor(rect.x) * 4 + Math.floor(rect.y) * 4 * width
					// 		)
					// 	} catch (e) {
					// 		console.log(e)
					// 	}
					// } else {

					// }
				}
			})
			// if (gf.isFill || gf.onlyClip || gf.alwaysClip) {
			// 	drawn.push(gf)
			// 	c.fillStyle = "rgba(0,0,250,0.2)"
			// 	gf.boundingRect.render(c)
			// }
			// shapes.splice(i, 1)
		}
	}
	// }
	reversed.forEach((gf, i) => {})

	cnvSvgPlot.style.display = "block"
	cnv.style.display = "none"
	// bgCnv.style.display = "none"
	renderSvgLoop()
}

function renderSvgLoop() {
	drawNext(svgSpeed)
	if (toDraw.length) {
		window.requestAnimationFrame(renderSvgLoop)
	} else {
		generateSvgPlot()
	}
}
