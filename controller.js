document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);
document.addEventListener('touchend', handleTouchEnd, false);

var xDown = null;
var yDown = null;

function getTouches(evt) {
    return evt.touches ||             // browser API
        evt.originalEvent.touches; // jQuery
}

function handleTouchStart(evt) {
    const firstTouch = getTouches(evt)[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;

    document.getElementById("swipe-info").innerHTML = "Touch start";
}

function handleTouchMove(evt) {
    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    displayBox(xUp, yUp, xDown, yDown);
}

function handleTouchEnd(evt) {
    var xUp = evt.changedTouches[0].clientX;
    var yUp = evt.changedTouches[0].clientY;
    
    document.getElementById("swipe-info").innerHTML = "Touch end<br>Start - X: " + xDown + ", Y: " + yDown + "<br>End - X: " + xUp + ", Y: " + yUp;
    displayBox(xUp, yUp, xDown, yDown);
}

function displayBox(xUp, yUp, xDown, yDown) {
    var box = document.getElementById("draw-box");
    box.style.height = Math.abs(yUp - yDown) + "px";
    box.style.width = Math.abs(xUp - xDown) + "px";
    box.style.top = Math.min(yUp, yDown) + "px";
    box.style.left = Math.min(xUp, xDown) + "px";
}