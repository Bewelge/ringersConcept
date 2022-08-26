var toDraw = []
function addDrawAct(action) {
	toDraw.push(action)
}
function drawNext(x) {
	while (x-- > 0 && toDraw.length) {
		toDraw.shift().do()
	}
}
class DrawAction {
	constructor(opts = {}) {
		if (opts.hasOwnProperty("action")) {
			this.action = opts.action
		}
	}
	do(c) {
		this.action(c)
	}
	static with(f) {
		return new DrawAction({ action: f })
	}
}
