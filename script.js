
const firebaseConfig = {
  apiKey: "AIzaSyCYmoUq4KyZjb5VAU4IYNOLnd8M4d2ZfUM",
  authDomain: "dont-push-b6170.firebaseapp.com",
  projectId: "dont-push-b6170",
  storageBucket: "dont-push-b6170.appspot.com",
  messagingSenderId: "813001059051",
  appId: "1:813001059051:web:1b16d1d94d0372b6d62c92"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let currentUser = null;
let totalClicks = 0;

// Language toggle
const langButtons = document.querySelectorAll(".lang-toggle button");
const translatables = document.querySelectorAll("[data-de]");

langButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        langButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const lang = btn.id === "lang-en" ? "en" : "de";
        translatables.forEach(el => {
            el.textContent = el.dataset[lang];
        });
    });
});

document.getElementById("submitName").onclick = function () {
    const username = document.getElementById("username").value.trim();
    if (!username) {
        alert("Bitte gib einen Namen ein / Please enter a name.");
        return;
    }

    db.ref("users/" + username).once("value").then(snapshot => {
        if (snapshot.exists()) {
            alert("Name bereits vergeben / Name already taken.");
        } else {
            currentUser = username;
            db.ref("users/" + username).set({
                clicks: 0,
                lastClickDate: new Date().toISOString().split('T')[0],
                freeClicks: 3
            });
            document.querySelector(".button-area").style.display = "block";
            document.getElementById("submitName").disabled = true;
            document.getElementById("username").disabled = true;
            updateGlobalClicks();
            updateLeaderboard();
        }
    });
};

document.getElementById("dontPush").onclick = function () {
    if (!currentUser) return;

    const today = new Date().toISOString().split('T')[0];

    db.ref("users/" + currentUser).once("value").then(snapshot => {
        const data = snapshot.val();
        let clicks = data.clicks;
        let freeClicks = data.freeClicks || 0;
        let lastDate = data.lastClickDate || today;

        if (lastDate !== today) {
            freeClicks = 3;
            lastDate = today;
        }

        if (freeClicks > 0) {
            freeClicks -= 1;
            clicks += 1;
            playClickSound();
            incrementGlobalClicks();
        } else {
            const confirmClick = confirm("Keine Freiklicks mehr. 1 Klick = 0,30 €. Trotzdem klicken?");
            if (!confirmClick) return;
            clicks += 1;
            playClickSound();
            incrementGlobalClicks();
        }

        document.getElementById("freeClicksLeft").textContent = "Freiklicks übrig: " + freeClicks;

        db.ref("users/" + currentUser).update({
            clicks: clicks,
            lastClickDate: lastDate,
            freeClicks: freeClicks
        });

        updateLeaderboard();
    });
};

function playClickSound() {
    const audio = new Audio("click.mp3");
    audio.play();
}

function incrementGlobalClicks() {
    const countRef = db.ref("globalClicks");
    countRef.transaction(current => (current || 0) + 1);
}

function updateGlobalClicks() {
    const countRef = db.ref("globalClicks");
    countRef.on("value", snapshot => {
        const count = snapshot.val() || 0;
        document.getElementById("globalClicks").textContent = "Gesamtanzahl Klicks: " + count;
    });
}

function updateLeaderboard() {
    db.ref("users").once("value").then(snapshot => {
        const data = snapshot.val() || {};
        const sorted = Object.entries(data).sort((a, b) => b[1].clicks - a[1].clicks);
        const table = document.getElementById("leaderboardTable");
        table.innerHTML = "";
        sorted.forEach(([name, userData], index) => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${index + 1}</td><td>${name}</td><td>${userData.clicks}</td>`;
            table.appendChild(row);
        });
    });
}

updateGlobalClicks();
updateLeaderboard();
