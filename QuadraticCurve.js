class QuadraticCurve {
	constructor(p0, c1, p1) {
		this._c1 = c1
		this._p0 = p0
		this._p1 = p1
	}
	get p1() {
		return this._p1
	}
	get p0() {
		return this._p0
	}
	get c1() {
		return this._c1
	}

	getPointAt(t) {
		//B(t) = (1-t)**3 p0 + 3(1 - t)**2 t P1 + 3(1-t)t**2 P2 + t**3 P3
		let x =
			(1 - t) * (1 - t) * this.p0.x +
			2 * (1 - t) * t * this.c1.x +
			t * t * this.p1.x
		let y =
			(1 - t) * (1 - t) * this.p0.y +
			2 * (1 - t) * t * this.c1.y +
			t * t * this.p1.y
		return new Vec2(x, y)
	}
	curveTo(path) {
		path.quadraticCurveTo(this.c1.x, this.c1.y, this.p1.x, this.p1.y)
	}
	doCurveTo(path) {
		path.moveTo(this.p0.x, this.p0.y)
		path.quadraticCurveTo(this.c1.x, this.c1.y, this.p1.x, this.p1.y)
	}
}
