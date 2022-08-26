class Flowfield {
	constructor(dim) {
		this.dim = dim
		this.ff = Array(dim)
			.fill(0)
			.map(row =>
				Array(dim)
					.fill(0)
					.map(cell => rndAng())
			)
	}
	smooth(strength) {
		this.ff.forEach((_, row) =>
			_.forEach((ang, col) => {
				let neighs = [
					[row, col - 1],
					[row, col + 1],
					[row - 1, col],
					[row + 1, col],
					[row - 1, col - 1],
					[row + 1, col + 1],
					[row + 1, col - 1],
					[row - 1, col + 1]
				].filter(
					n =>
						n[0] >= 0 && n[0] < this.dim - 1 && n[1] >= 0 && n[1] < this.dim - 1
				)
				let sum = 0
				neighs.forEach(n => (sum += this.ff[n[0]][n[1]]))
				sum *= 1 / neighs.length
				let diff = getSignedAng(ang, sum)
				this.ff[row][col] = ang * (1 - strength) + diff * strength
			})
		)
	}
	influenceAng(x, y, ang, force) {
		let ffCol = Math.max(
			0,
			Math.min(
				this.ff.length - 1,
				Math.floor((Math.abs(x - width / 2) / (width / 2)) * this.ff.length)
			)
		)
		let ffRow = Math.max(
			0,
			Math.min(this.ff.length - 1, Math.floor((y / height) * this.ff.length))
		)

		this.ff[ffRow][ffCol] < 0 ? (this.ff[ffRow][ffCol] += PI2) : null
		let diff = this.ff[ffRow][ffCol] - ang

		diff = ((diff + PI) % PI2) - PI
		this.ff[ffRow][ffCol] = this.ff[ffRow][ffCol] + Math.sign(diff) * force
	}
	getAng(x, y) {
		let ffCol = Math.max(
			0,
			Math.min(
				this.ff.length - 1,
				Math.floor((Math.abs(x - width / 2) / (width / 2)) * this.ff.length)
			)
		)
		let ffRow = Math.max(
			0,
			Math.min(this.ff.length - 1, Math.floor((y / height) * this.ff.length))
		)
		if (isNaN(ffRow) || isNaN(ffCol)) {
			console.log(123)
		}
		return this.ff[ffRow][ffCol]
	}
}
