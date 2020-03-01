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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

// Setup universal game components
AFRAME.registerComponent("left-hand", {
    init: function() {
        console.log("Initialized left hand");

        this.el.addEventListener("triggerdown", (event) => {
            if(team === "none") {
                team = "green";
                console.log("Joined green team");

                var subText = document.querySelector("#sub-text");
                subText.setAttribute("text", {value: "Joined Green Team"});
                setTimeout(() => {
                    subText.setAttribute("visible", false);
                }, 5000);
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

                var subText = document.querySelector("#sub-text");
                subText.setAttribute("text", {value: "Joined Purple Team"});
                setTimeout(() => {
                    subText.setAttribute("visible", false);
                }, 5000);
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
AFRAME.registerComponent('generate-asteroids', {
    init: function() {
        let asteroidEntity = this.el;

        database.ref("/green/asteroidSpawns").on("value", (snapshot) => {
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
            let newAlien = document.getElementById('alien-green').cloneNode(true);
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
            newAsteroid.setAttribute("green-asteroid", true);
            for(var i = 0; i < animations.length; i++) {
                newAsteroid.setAttribute('animation' + (i > 0 ? '__' + i : ''), animations[i]);
            }
            asteroidEntity.appendChild(newAlien);
            asteroidEntity.appendChild(newAsteroid);
            console.log("Asteroid spawned!")

            setTimeout(() => {
                asteroidEntity.removeChild(newAlien);
            }, 3000);

            setTimeout(() => {
                asteroidEntity.removeChild(newAsteroid);

                database.ref("/green/health").once("value", (snapshot) => {
                    var health = snapshot.val();
                    health -= 10;
                    database.ref("/green/health").set(health, (error) => {
                        if(error) {
                            console.log(error);
                        }
                    })
                })
            }, time);
        });
    }
});

AFRAME.registerComponent("green-asteroid", {
    init: function() {
        var threshold = 0.5;
        var asteroid = this.el;
        
        if(team === "purple") {
            console.log("Team green asteroid");
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
            console.log("Team purple asteroid");
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
