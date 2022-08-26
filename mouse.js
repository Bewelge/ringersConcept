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
