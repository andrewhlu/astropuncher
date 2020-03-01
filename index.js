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

var team = "green";

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
var database = firebase.database();

AFRAME.registerComponent('generate-asteroids', {
    init: function() {
        let asteroidEntity = this.el;

        database.ref("/green/asteroidSpawns").on("value", (snapshot) => {
            var rawData = snapshot.val();
            var rawDataKeys = Object.keys(rawData);
            var asteroidData = rawData[rawDataKeys[rawDataKeys.length - 1]];

            // Starting position and rotation for alien
            var position = {
                x: 0,
                y: 0.5,
                z: 2.5 - 5*(asteroidData.position)
            };
            console.log(position);

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

            asteroidEntity.appendChild(newAlien);
            console.log("Spawned new alien");

            setTimeout(() => {
                asteroidEntity.removeChild(newAlien);
            }, 3000);

            // Asteroid Spawn
            var fSpeed = Math.cos(asteroidData.angle);
            var sSpeed = Math.sin(asteroidData.angle);
            console.log("fSpeed: " + fSpeed + ", sSpeed: " + sSpeed);

            var points = [];
            var fDistance = 0;
            var sDistance = position.z;
            while(fDistance < 14) {
                // Remember, moving right is equal to negative Z, and moving forward is equal to negative X!
                var unitsToMove = sSpeed > 0 ? (2.5 - sDistance) / sSpeed : (2.5 + sDistance) / sSpeed * -1;
                console.log("unitsToMove: " + unitsToMove);
                if(unitsToMove < 0) {break;}
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
                    console.log("sSpeed * unitsToMove: " + sSpeed * unitsToMove + ", sDistance: " + sDistance);
                    fDistance += (fSpeed * unitsToMove);
                    sDistance = nextPoint.z;
                    sSpeed *= -1;
                    points.push(nextPoint);
                }
            }

            console.log(points);

            var time = 5000;
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

            console.log(animations);

            let newAsteroid = document.getElementById('asteroid').cloneNode(true);
            newAsteroid.setAttribute("position", position);
            newAsteroid.setAttribute("rotation", rotation);
            newAsteroid.setAttribute("visible", true);
            newAsteroid.setAttribute("asteroid", true);
            for(var i = 0; i < animations.length; i++) {
                newAsteroid.setAttribute('animation' + (i > 0 ? '__' + i : ''), animations[i]);
            }
            
            asteroidEntity.appendChild(newAsteroid);

            setTimeout(() => {
                asteroidEntity.removeChild(newAsteroid);
            }, time + 50000);
        });
    }
});