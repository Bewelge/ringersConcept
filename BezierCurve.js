class BezierCurve {
	constructor(p0, c0, c1, p1) {
		this._c0 = c0
		this._c1 = c1
		this._p0 = p0
		this._p1 = p1
	}
	get p0() {
		return this._p0
	}
	get p1() {
		return this._p1
	}
	get c0() {
		return this._c0
	}
	get c1() {
		return this._c1
	}
	copy() {
		return new BezierCurve(
			this.p0.copy(),
			this.c0.copy(),
			this.c1.copy(),
			this.p1.copy()
		)
	}
	getLength(segments = 10) {
		let sum = 0
		let curP = this.p0.copy()
		for (let i = 1; i < segments; i++) {
			let nextP = this.getPointAt(i / segments)
			sum += curP.distanceTo(nextP)
			curP = nextP
		}
		return sum
	}
	translate(vec) {
		this._c0.addVector(vec)
		this._c1.addVector(vec)
		this._p0.addVector(vec)
		this._p1.addVector(vec)
	}
	getAngleAt(t) {
		return this.getPointAt(t - 0.01).angleTo(this.getPointAt(t))
	}
	getPointAt(t) {
		//B(t) = (1-t)**3 p0 + 3(1 - t)**2 t P1 + 3(1-t)t**2 P2 + t**3 P3
		let x =
			(1 - t) * (1 - t) * (1 - t) * this.p0.x +
			3 * (1 - t) * (1 - t) * t * this.c0.x +
			3 * (1 - t) * t * t * this.c1.x +
			t * t * t * this.p1.x
		let y =
			(1 - t) * (1 - t) * (1 - t) * this.p0.y +
			3 * (1 - t) * (1 - t) * t * this.c0.y +
			3 * (1 - t) * t * t * this.c1.y +
			t * t * t * this.p1.y
		return new Vec2(x, y)
	}
	curveTo(path) {
		path.bezierCurveTo(
			this.c0.x,
			this.c0.y,
			this.c1.x,
			this.c1.y,
			this.p1.x,
			this.p1.y
		)
	}
	reverseCurveTo(path) {
		path.bezierCurveTo(
			this.c1.x,
			this.c1.y,
			this.c0.x,
			this.c0.y,
			this.p0.x,
			this.p0.y
		)
	}
	mirrorReverseCurveTo(path) {
		let mp0 = this.c0.copy().mirrorAcross(this.p0, this.p1)
		let mp1 = this.c1.copy().mirrorAcross(this.p0, this.p1)
		path.bezierCurveTo(mp1.x, mp1.y, mp0.x, mp0.y, this.p0.x, this.p0.y)
	}
	doCurveTo(path) {
		path.moveTo(this.p0.x, this.p0.y)
		this.curveTo(path)
	}
}
