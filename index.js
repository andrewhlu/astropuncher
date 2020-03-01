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

var team = "none";

var leftHandPos = {};
var rightHandPos = {};

// Function to get the other team
function getOtherTeam() {
    if (team === "green") {
        return "purple";
    }
    else if(team === "purple") {
        return "green";
    }
    else {
        return "none";
    }
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

// Set reset state to false
database.ref("/reset").set(false, (error) => {
    if(error) {
        console.log(error);
    }
});

// Setup universal game components
AFRAME.registerComponent("left-hand", {
    init: function() {
        console.log("Initialized left hand");

        this.el.addEventListener("triggerdown", (event) => {
            if(team === "none") {
                team = "green";
                console.log("Joined green team");

                document.querySelector("#home-play-area").setAttribute("color", "#70AD47");
                document.querySelector("#enemy-play-area").setAttribute("color", "#924DA7");
                initializeGame();
            }
        });
    },
    tick: function() {
        leftHandPos =  this.el.getAttribute("position");
    }
});

AFRAME.registerComponent("right-hand", {
    init: function() {
        console.log("Initialized right hand");

        this.el.addEventListener("triggerdown", (event) => {
            if(team === "none") {
                team = "purple";
                console.log("Joined purple team");

                document.querySelector("#home-play-area").setAttribute("color", "#924DA7");
                document.querySelector("#enemy-play-area").setAttribute("color", "#70AD47");
                initializeGame();
            }
        });
    },
    tick: function() {
        rightHandPos =  this.el.getAttribute("position");
    }
});

AFRAME.registerComponent("text-display", {
    init: function() {
        this.el.setAttribute("text", {
            value: "Press the left trigger to join the Green team.     Press the right trigger to join the Purple team."
        });
    }
});

// Setup team specific game components once a team has been selected
function initializeGame() {
    let asteroidEntity = document.querySelector("#asteroids");
    let titleText = document.querySelector("#title-text");
    let subText = document.querySelector("#sub-text");

    // Display your health
    database.ref("/" + team + "/health").on("value", (snapshot) => {
        var health = snapshot.val();
        subText.setAttribute("text", {value: "Health: " + health + "%"});

        if(health <= 0) {
            titleText.setAttribute("text", {value: "Mission Failed!"});
        }
    });

    // Check for win condition
    database.ref("/" + getOtherTeam() + "/health").on("value", (snapshot) => {
        var health = snapshot.val();
        if(health <= 0) {
            titleText.setAttribute("text", {value: "Mission Success!"});
        }
    });

    // Set up your team's asteroids
    database.ref("/" + team + "/asteroidSpawns").on("value", (snapshot) => {
        var rawData = snapshot.val();
        var rawDataKeys = Object.keys(rawData);
        var asteroidData = rawData[rawDataKeys[rawDataKeys.length - 1]];

        // Starting position and rotation for alien
        var position = {
            x: 2,
            y: 0.5,
            z: 2.5 - 5*(asteroidData.position)
        };

        var rotation = {
            x: 0,
            y: 0,
            z: 0
        };

        // Alien Spawn
        let newAlien = document.getElementById("alien-" + team).cloneNode(true);
        newAlien.setAttribute("position", position);
        newAlien.setAttribute("rotation", rotation);
        newAlien.setAttribute('visible', true);

        // Asteroid Spawn
        var fSpeed = Math.cos(asteroidData.angle);
        var sSpeed = Math.sin(asteroidData.angle);

        var points = [];
        var fDistance = 0;
        var sDistance = position.z;
        while(fDistance < 14) {
            // Remember, moving right is equal to negative Z, and moving forward is equal to negative X!
            var unitsToMove = sSpeed > 0 ? (2.5 - sDistance) / sSpeed : (2.5 + sDistance) / sSpeed * -1;
            if(unitsToMove * fSpeed + fDistance >= 14) {
                // We will reach the back wall before reaching the side
                unitsToMove = (14 - fDistance) / fSpeed;
                var nextPoint = {
                    x: position.x - 14,
                    z: sSpeed * unitsToMove + sDistance
                };
                fDistance = 14;
                points.push(nextPoint);
            }
            else  {
                // We will hit the right side
                var nextPoint = {
                    x: position.x - (fSpeed * unitsToMove) - fDistance,
                    z: sSpeed * unitsToMove + sDistance
                };
                fDistance += (fSpeed * unitsToMove);
                sDistance = nextPoint.z;
                sSpeed *= -1;
                points.push(nextPoint);
            }
        }

        var time = 1000;
        var animations = [
            {
                property: "position",
                from: position,
                to: {
                    x: points[0].x,
                    y: 0.5,
                    z: points[0].z
                },
                dur: 2000,
                delay: time,
                easing: "linear"
            }
        ];

        time += 2000;

        for(var i = 1; i < points.length; i++) {
            animations.push({
                property: "position",
                from: {
                    x: animations[i-1].to.x,
                    y: animations[i-1].to.y,
                    z: animations[i-1].to.z
                },
                to: {
                    x: points[i].x,
                    y: 0.5,
                    z: points[i].z
                },
                dur: 2000,
                delay: time,
                easing: "linear"
            });
            time += 2000;
        }

        let newAsteroid = document.getElementById('asteroid').cloneNode(true);
        newAsteroid.setAttribute("position", position);
        newAsteroid.setAttribute("rotation", rotation);
        newAsteroid.setAttribute("visible", true);
        newAsteroid.setAttribute(team + "-asteroid", true);
        for(var i = 0; i < animations.length; i++) {
            newAsteroid.setAttribute('animation' + (i > 0 ? '__' + i : ''), animations[i]);
        }
        asteroidEntity.appendChild(newAlien);
        asteroidEntity.appendChild(newAsteroid);
        console.log("Asteroid spawned for team " + team + "!");

        setTimeout(() => {
            asteroidEntity.removeChild(newAlien);
        }, 3000);

        setTimeout(() => {
            asteroidEntity.removeChild(newAsteroid);
        }, time);
    });

    // Set up other team's asteroids
    database.ref("/" + getOtherTeam() + "/asteroidSpawns").on("value", (snapshot) => {
        var rawData = snapshot.val();
        var rawDataKeys = Object.keys(rawData);
        var asteroidData = rawData[rawDataKeys[rawDataKeys.length - 1]];

        // Starting position and rotation for alien
        var position = {
            x: -12,
            y: 0.5,
            z: -2.5 + 5*(asteroidData.position)
        };

        var rotation = {
            x: 0,
            y: 180,
            z: 0
        };

        // Alien Spawn
        let newAlien = document.getElementById("alien-" + getOtherTeam()).cloneNode(true);
        newAlien.setAttribute("position", position);
        newAlien.setAttribute("rotation", rotation);
        newAlien.setAttribute('visible', true);

        // Asteroid Spawn
        var fSpeed = Math.cos(asteroidData.angle);
        var sSpeed = Math.sin(asteroidData.angle);

        var points = [];
        var fDistance = 0;
        var sDistance = position.z;
        while(fDistance < 14) {
            // Remember, moving right is equal to positive Z, and moving forward is equal to positive X!
            var unitsToMove = sSpeed > 0 ? (2.5 - sDistance) / sSpeed : (2.5 + sDistance) / sSpeed * -1;
            if(unitsToMove * fSpeed + fDistance >= 14) {
                // We will reach the back wall before reaching the side
                unitsToMove = (14 - fDistance) / fSpeed;
                var nextPoint = {
                    x: position.x + 14,
                    z: sSpeed * unitsToMove + sDistance
                };
                fDistance = 14;
                points.push(nextPoint);
            }
            else  {
                // We will hit the right side
                var nextPoint = {
                    x: position.x + (fSpeed * unitsToMove) + fDistance,
                    z: sSpeed * unitsToMove + sDistance
                };
                fDistance += (fSpeed * unitsToMove);
                sDistance = nextPoint.z;
                sSpeed *= -1;
                points.push(nextPoint);
            }
        }

        var time = 1000;
        var animations = [
            {
                property: "position",
                from: position,
                to: {
                    x: points[0].x,
                    y: 0.5,
                    z: points[0].z
                },
                dur: 2000,
                delay: time,
                easing: "linear"
            }
        ];

        time += 2000;

        for(var i = 1; i < points.length; i++) {
            animations.push({
                property: "position",
                from: {
                    x: animations[i-1].to.x,
                    y: animations[i-1].to.y,
                    z: animations[i-1].to.z
                },
                to: {
                    x: points[i].x,
                    y: 0.5,
                    z: points[i].z
                },
                dur: 2000,
                delay: time,
                easing: "linear"
            });
            time += 2000;
        }

        let newAsteroid = document.getElementById('asteroid').cloneNode(true);
        newAsteroid.setAttribute("position", position);
        newAsteroid.setAttribute("rotation", rotation);
        newAsteroid.setAttribute("visible", true);
        newAsteroid.setAttribute(getOtherTeam() + "-asteroid", true);
        for(var i = 0; i < animations.length; i++) {
            newAsteroid.setAttribute('animation' + (i > 0 ? '__' + i : ''), animations[i]);
        }
        asteroidEntity.appendChild(newAlien);
        asteroidEntity.appendChild(newAsteroid);
        console.log("Asteroid spawned for team " + getOtherTeam() + "!");

        setTimeout(() => {
            asteroidEntity.removeChild(newAlien);
        }, 3000);

        setTimeout(() => {
            asteroidEntity.removeChild(newAsteroid);
        
            database.ref("/" + team + "/health").once("value", (snapshot) => {
                var health = snapshot.val();
                health -= 10;
                database.ref("/" + team + "/health").set(health, (error) => {
                    if(error) {
                        console.log(error);
                    }
                })
            })
        }, time);
    });
}

AFRAME.registerComponent("green-asteroid", {
    init: function() {
        var threshold = 0.5;
        var asteroid = this.el;
        
        if(team === "purple") {
            var asteroidInterval = window.setInterval(() => {
                var asteroidPosition = asteroid.object3D.position;
    
                if(Math.abs(asteroidPosition.x - leftHandPos.x) < threshold && Math.abs(asteroidPosition.z - leftHandPos.z) < threshold) {
                    console.log("Hit a green asteroid! Left Hand");
                    clearInterval(asteroidInterval);
                    asteroid.parentNode.removeChild(asteroid);
                }
                else if(Math.abs(asteroidPosition.x - rightHandPos.x) < threshold && Math.abs(asteroidPosition.z - rightHandPos.z) < threshold) {
                    console.log("Hit a green asteroid! Right Hand");
                    clearInterval(asteroidInterval);
                    asteroid.parentNode.removeChild(asteroid);
                }
            }, 100);
        }
    }
});

AFRAME.registerComponent("purple-asteroid", {
    init: function() {
        var threshold = 0.5;
        var asteroid = this.el;
        
        if(team === "green") {
            var asteroidInterval = window.setInterval(() => {
                var asteroidPosition = asteroid.object3D.position;
    
                if(Math.abs(asteroidPosition.x - leftHandPos.x) < threshold && Math.abs(asteroidPosition.z - leftHandPos.z) < threshold) {
                    console.log("Hit a purple asteroid! Left Hand");
                    clearInterval(asteroidInterval);
                    asteroid.parentNode.removeChild(asteroid);
                }
                else if(Math.abs(asteroidPosition.x - rightHandPos.x) < threshold && Math.abs(asteroidPosition.z - rightHandPos.z) < threshold) {
                    console.log("Hit a purple asteroid! Right Hand");
                    clearInterval(asteroidInterval);
                    asteroid.parentNode.removeChild(asteroid);
                }
            }, 100);
        }
    }
});

// Remote Refresh
database.ref("/reset").on("value", (snapshot) => {
    var status = snapshot.val();
    if(status) {
        location.reload();
    }
});

// Reset Game
const resetState = {
    "green" : {
        "blocks" : 0,
        "energy" : 100,
        "health" : 100,
        "hits" : 0,
        "position" : {
            "x" : 0,
            "z" : 0
        }
    },
    "purple" : {
        "blocks" : 0,
        "energy" : 100,
        "health" : 100,
        "hits" : 0,
        "position" : {
            "x" : 0,
            "z" : 0
        }
    },
    "reset" : true
};

function resetGame() {
    database.ref("/").set(resetState, (error) => {
        if(error) {
            console.log(error);
        }
    });
}
