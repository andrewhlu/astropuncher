document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);
document.addEventListener('touchend', handleTouchEnd, false);

var xDown = null;
var yDown = null;

function handleTouchStart(evt) {
    const firstTouch = evt.touches[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;

    document.getElementById("swipe-info").innerHTML = "Touch start";
}

function handleTouchMove(evt) {
    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    displayLine(xUp, yUp, xDown, yDown);
}

function handleTouchEnd(evt) {
    var xUp = evt.changedTouches[0].clientX;
    var yUp = evt.changedTouches[0].clientY;
    
    document.getElementById("swipe-info").innerHTML = "Touch end<br>Start - X: " + xDown + ", Y: " + yDown + "<br>End - X: " + xUp + ", Y: " + yUp;
    displayLine(xUp, yUp, xDown, yDown);
}

function displayLine(xUp, yUp, xDown, yDown) {
    var box = document.getElementById("touch-line");
    box.style.width = "0px";
    box.style.height = yDown - yUp > 0 ? getLength(xUp, yUp, xDown, yDown) + "px" : "0px";
    box.style.top = yDown - getLength(xUp, yUp, xDown, yDown) + "px";
    box.style.left = xDown + "px";
    box.style.transformOrigin = "bottom right";
    box.style.transform = "rotate(" + Math.atan((xUp - xDown)/(yDown - yUp)) * 180 / Math.PI + "deg)";
}

function getLength(x1, y1, x2, y2) {
    // Returns the distance between two X and Y coordinates
    return Math.pow(Math.pow(Math.abs(y1 - y2),2) + Math.pow(Math.abs(x1 - x2),2),0.5);
}