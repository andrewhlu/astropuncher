// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBl2ghVkvo9skQwo8jkH58Mwzc7bOK8Moo",
    authDomain: "sbhacks-b2019.firebaseapp.com",
    databaseURL: "https://sbhacks-b2019.firebaseio.com",
    projectId: "sbhacks-b2019",
    storageBucket: "sbhacks-b2019.appspot.com",
    messagingSenderId: "937961984218",
    appId: "1:937961984218:web:6b7fd909cd26eb868755e3",
    measurementId: "G-7YHG475TJB"
};
const team = "green";

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Set up event listeners for touch events
document.addEventListener('touchstart', handleTouchStart, false);
document.addEventListener('touchmove', handleTouchMove, false);
document.addEventListener('touchend', handleTouchEnd, false);

var xDown = null;
var yDown = null;

function toggleDebugMode() {
    var debugDiv = document.getElementById("debug-div");
    if(debugDiv.getAttribute("hidden") === null) {
        debugDiv.setAttribute("hidden", true);
    }
    else {
        debugDiv.removeAttribute("hidden");
    }
}

function checkValidLine(xUp, yUp, xDown, yDown) {
    displayError("checkValidLine: " + checkIfInElement(xDown, yDown, "play-area") + ", " + checkIfInElement(xUp, yUp, "block-area") + ", " + checkIfInElement(xUp, yUp, "play-area"));
    return checkIfInElement(xDown, yDown, "play-area") && (checkIfInElement(xUp, yUp, "block-area") || checkIfInElement(xUp, yUp, "play-area"));
}

function checkIfInElement(x, y, element) {
    var rect = document.getElementById(element).getBoundingClientRect();
    if(rect.top < y && rect.bottom > y && rect.left < x && rect.right > x) {
        return true;
    }
    else {
        return false;
    }
}

function handleTouchStart(evt) {
    const firstTouch = evt.touches[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;

    document.getElementById("swipe-info").innerHTML = "Touch start";
}

function handleTouchMove(evt) {
    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    if(checkValidLine(xUp, yUp, xDown, yDown)) {
        displayLine(xUp, yUp, xDown, yDown);
    }
}

function handleTouchEnd(evt) {
    var xUp = evt.changedTouches[0].clientX;
    var yUp = evt.changedTouches[0].clientY;
    
    document.getElementById("swipe-info").innerHTML = "Touch end<br>Start - X: " + xDown + ", Y: " + yDown + "<br>End - X: " + xUp + ", Y: " + yUp;

    if(checkValidLine(xUp, yUp, xDown, yDown)) {
        displayLine(xUp, yUp, xDown, yDown);

        // This is a valid alien spawn, add to database
        database.ref("/" + team + "/energy").once("value", (snapshot) => {
            var energy = snapshot.val();
            if(getEnergyUsage(xUp, yUp, xDown, yDown) > energy) {
                // Not enough energy!
                displayError("Not enough energy!");
            }
            else {
                // Enough energy, deduct energy
                database.ref("/" + team + "/energy").set(energy - getEnergyUsage(xUp, yUp, xDown, yDown), (error) => {
                    if(error) {
                        console.log(error);
                        displayError("An error occurred. Check console.");
                    }
                    else {
                        var rect = document.getElementById("play-area").getBoundingClientRect();

                        // Add asteroid to list
                        var newAsteroid = {
                            angle: getAngle(xUp, yUp, xDown, yDown),
                            position: (xDown - rect.left) / (rect.right - rect.left),
                            energy: getEnergyUsage(xUp, yUp, xDown, yDown)
                        };

                        database.ref("/" + team + "/asteroidSpawns").push().set(newAsteroid, (error) => {
                            if(error) {
                                console.log(error);
                                displayError("An error occurred. Check console.");
                            }
                            else {
                                displayError("Asteroid spawned!");
                            }
                        });
                    }
                });
            }
        });
    }
}

function displayError(error) {
    document.getElementById("error-message").innerHTML = error;
}

function displayLine(xUp, yUp, xDown, yDown) {
    var box = document.getElementById("touch-line");
    box.style.width = "0px";
    box.style.height = yDown - yUp > 0 ? getLength(xUp, yUp, xDown, yDown) + "px" : "0px";
    box.style.top = yDown - getLength(xUp, yUp, xDown, yDown) + "px";
    box.style.left = xDown + "px";
    box.style.transformOrigin = "bottom right";
    box.style.transform = "rotate(" + getAngle(xUp, yUp, xDown, yDown) + "rad)";
}

function getLength(x1, y1, x2, y2) {
    // Returns the distance between two X and Y coordinates
    return Math.pow(Math.pow(Math.abs(y1 - y2),2) + Math.pow(Math.abs(x1 - x2),2),0.5);
}

function getAngle(xUp, yUp, xDown, yDown) {
    return Math.atan((xUp - xDown)/(yDown - yUp));
}

function getEnergyUsage(xUp, yUp, xDown, yDown) {
    var length = getLength(xUp, yUp, xDown, yDown);
    if(length > 500) {
        return 50;
    }
    else if(length < 100) {
        return 5;
    }
    else {
        return Math.floor(45 * ((length - 100) / 400) + 5);
    }
}

database.ref("/" + team + "/health").on("value", (snapshot) => {
    var health = snapshot.val();
    document.getElementById("current-health").style.height = window.innerHeight * ((100 - health) / 100) + "px";
    document.getElementById("health-counter").innerHTML = health;
});

database.ref("/" + team + "/energy").on("value", (snapshot) => {
    var energy = snapshot.val();
    document.getElementById("current-energy").style.height = window.innerHeight * ((100 - energy) / 100) + "px";
    document.getElementById("energy-counter").innerHTML = energy;
});
