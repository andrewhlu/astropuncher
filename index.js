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

        database.ref("/" + team + "/asteroidSpawns").on("value", (snapshot) => {
            var rawData = snapshot.val();
            var rawDataKeys = Object.keys(rawData);
            var asteroidData = rawData[rawDataKeys[rawDataKeys.length - 1]];

            var position = {
                x: 2,
                y: 0.5,
                z: 2.5 - 5*(asteroidData.position)
            };

            console.log(position);

            var rotation = {
                x: 0,
                y: 0,
                z: 0
            };

            let newAlien = document.getElementById('alien-green').cloneNode(true);
            newAlien.setAttribute("position", position);
            newAlien.setAttribute("rotation", rotation);
            newAlien.setAttribute('visible', true);

            asteroidEntity.appendChild(newAlien);
            console.log("Spawned new alien");

            setTimeout(() => {
                asteroidEntity.removeChild(newAlien);
            }, 10000);
        });
    }
});