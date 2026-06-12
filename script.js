// Firebase Configuration
const firebaseConfig = {
apiKey: "AIzaSyB1iPXeT656B-Xo1q_r0ulbGetidzfw3G4",
authDomain: "d-r-screening-platform.firebaseapp.com",
projectId: "d-r-screening-platform",
storageBucket: "d-r-screening-platform.firebasestorage.app",
messagingSenderId: "1024542444473",
appId: "1:1024542444473:web:2b19ca2f7e2d00c1f54468",
measurementId: "G-ZKEHB258XV"
  
};
function showLoginPage() {
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("coachDashboard").style.display = "none";
  document.getElementById("districtDashboard").style.display = "none";
}

window.onload = showLoginPage;

let currentPlayer = null;
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

let registrationStream = null;

async function compareProfileAndFace() {

  const profileImg = document.getElementById("profilePreview");
  const capturedImg = document.getElementById("facePreview");

  const profileDetection = await faceapi
    .detectSingleFace(profileImg)
    .withFaceLandmarks()
    .withFaceDescriptor();

  const capturedDetection = await faceapi
    .detectSingleFace(capturedImg)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!profileDetection || !capturedDetection) {
    alert("Face not detected in one of the images");
    return false;
  }

  const distance = faceapi.euclideanDistance(
    profileDetection.descriptor,
    capturedDetection.descriptor
  );

  console.log("Face Distance:", distance);

  if (distance < 0.6) {
    alert("✅ Face Matched");
    return true;
  } else {
    alert("❌ Image Mismatched");
    return false;
  }
}

console.log("Firebase Connected Successfully!");

// LOGIN
function login() {
  
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
  .then(() => {

    document.getElementById("loginBox").style.display = "none";
    document.getElementById("coachDashboard").style.display = "block";

    alert("Login Successful");

  })
  .catch((error) => {

    alert(error.message);

  });

}

// SHOW PLAYER FORM
function showPlayerForm() {

document.getElementById("playerForm").style.display = "block";

}
// PASS SLIP CAMERA
let passSlipStream = null;

async function startPassSlipCamera() {

  try {

    passSlipStream = await navigator.mediaDevices.getUserMedia({
      video: true
    });

    document.getElementById("passSlipVideo").srcObject = passSlipStream;

  } catch (error) {

    alert("Camera Error: " + error.message);

  }

}

// SAVE PLAYER
  async function savePlayer() {

  alert("Save Player button clicked");

  const playerName = document.getElementById("playerName").value;
  const school = document.getElementById("school").value;
  const district = document.getElementById("district").value;
  const sport = document.getElementById("sport").value;
  const lin = document.getElementById("lin").value;
  const indexNumber = document.getElementById("indexNumber").value;
  const passSlipNumber = document.getElementById("passSlipNumber").value;
  const dateOfBirth = document.getElementById("dateOfBirth").value;
  const category = document.getElementById("category").value;

  const profilePhoto =
    document.getElementById("profilePreview").src;

  if (
    !playerName ||
    !school ||
    !district ||
    !sport ||
    !lin ||
    !indexNumber ||
    !passSlipNumber ||
    !dateOfBirth ||
    !category
  ) {
    alert("Please fill all fields.");
    return;
  }

  if (!profilePhoto || profilePhoto === window.location.href) {
    alert("Please upload a profile photo.");
    return;
  }

  const snapshot = await db.collection("players").get();

let duplicate = false;

snapshot.forEach(doc => {

  const player = doc.data();

  if (
    player.indexNumber === indexNumber ||
    player.lin === lin ||
    player.passSlipNumber === passSlipNumber
  ) {
    duplicate = true;
  }

});

if (duplicate) {
  alert("Duplicate player detected.");
  return;
}
    alert("Reached Firebase save");

  db.collection("players").add({
    
    playerName: playerName,
    school: school,
    district: district,
    sport: sport,
    lin: lin,
    indexNumber: indexNumber,
    passSlipNumber: passSlipNumber,
    dateOfBirth: dateOfBirth,
    category: category,

    profilePhoto: profilePhoto,
    
    status: "Pending",
    createdAt: new Date()

  })

  .then(() => {
    
    alert("Firebase save successful");

    alert("Player Saved Successfully");

    document.getElementById("playerName").value = "";
    document.getElementById("school").value = "";
    document.getElementById("district").value = "";
    document.getElementById("sport").value = "";
    document.getElementById("lin").value = "";
    document.getElementById("indexNumber").value = "";
    document.getElementById("passSlipNumber").value = "";
    document.getElementById("dateOfBirth").value = "";
    document.getElementById("category").value = "";

  })

  .catch((error) => {

    alert("Firebase Error: " + error.message);

  });

}

// LOAD PLAYERS
function loadPlayers() {

  const table = document.getElementById("playersTable");

  table.innerHTML = "";

  db.collection("players")
    .get()
    .then((snapshot) => {

      snapshot.forEach((doc) => {

        const player = doc.data();

     table.innerHTML += `
<tr>
<td>${player.playerName || ""}</td>
<td>${player.school || ""}</td>
<td>${player.district || ""}</td>
<td>${player.sport || ""}</td>
<td>${player.lin || ""}</td>

<td>${player.indexNumber || ""}</td>
<td>${player.passSlipNumber || ""}</td>

<td>
${
player.status === "Approved"
? '<span style="color:green;font-weight:bold;">✅ Approved</span>'
: player.status === "Rejected"
? '<span style="color:red;font-weight:bold;">❌ Rejected</span>'
: '<span style="color:orange;font-weight:bold;">⏳ Pending</span>'
}
</td>

<td>
<button onclick="approvePlayer('${doc.id}')">
Approve
</button>

<button onclick="rejectPlayer('${doc.id}')">
Reject
</button>
</td>

</tr>
`;
      });

    })
    .catch((error) => {
      console.log(error);
    });

}
// APPROVE PLAYER
function approvePlayer(id) {

  db.collection("players").doc(id).update({
    status: "Approved"
  })

  .then(() => {

    loadPlayers();
    loadApprovedPlayers();

  });

}

// REJECT PLAYER
function rejectPlayer(id) {

db.collection("players")
.doc(id)
.update({
status: "Rejected"
})
.then(() => {

  alert("Player Rejected");

  loadPlayers();

});

}

// REGIONAL DASHBOARD
function showRegional() {

document.getElementById("districtDashboard").style.display = "none";
document.getElementById("regionalDashboard").style.display = "block";

loadApprovedPlayers();

}

// SHOW SITE ADMIN
function showSiteAdmin() {

  document.getElementById("regionalDashboard").style.display = "none";

  document.getElementById("siteAdminDashboard").style.display = "block";

  loadAllPlayers();

  loadStatistics();

}
// LOAD APPROVED PLAYERS
function loadApprovedPlayers() {

  const table = document.getElementById("regionalPlayersTable");

  table.innerHTML = "";

  db.collection("players")
    .where("status", "==", "Approved")
    .get()
    .then((snapshot) => {

      snapshot.forEach((doc) => {

        const player = doc.data();

        table.innerHTML += `
  <tr>
    <td>${player.playerName || ""}</td>
    <td>${player.school || ""}</td>
    <td>${player.district || ""}</td>
    <td>${player.sport || ""}</td>
    <td>${player.lin || ""}</td>

    <td>${player.indexNumber || ""}</td>

    <td>${player.passSlipNumber || ""}</td>

    <td>${player.status || ""}</td>
    <td>
  </tr>
`;
      });

    })
    .catch((error) => {
      console.log(error);
    });

}

// LOAD ALL PLAYERS
function loadAllPlayers() {

  console.log("loadAllPlayers started");

  const table = document.getElementById("sitePlayersTable");

  table.innerHTML = "";

  db.collection("players")
    .get()
    .then((snapshot) => {

      console.log("Players found:", snapshot.size);

      snapshot.forEach((doc) => {

        console.log(doc.id, doc.data());

        const player = doc.data();

       table.innerHTML += `
<tr>

<td>${player.playerName || ""}</td>

<td>${player.school || ""}</td>

<td>${player.district || ""}</td>

<td>${player.sport || ""}</td>

<td>${player.lin || ""}</td>

<td>${player.indexNumber || ""}</td>

<td>${player.passSlipNumber || ""}</td>

<td>${player.category || ""}</td>

<td>${player.status || ""}</td>

<td>
<button onclick="deletePlayer('${doc.id}')">
Delete
</button>
</td>

</tr>
`;
      });

    })
    .catch((error) => {
      console.log("ERROR:", error);
    });

}

// DELETE PLAYER
function deletePlayer(id) {

  if (!confirm("Are you sure you want to delete this player?")) {
    return;
  }

  db.collection("players")
    .doc(id)
    .delete()
    .then(() => {

      alert("Player Deleted Successfully");

      loadAllPlayers();
      loadStatistics();

    })
    .catch((error) => {

      console.log(error);
      alert(error.message);

    });

}

// BACK TO LOG IN
function backToLogin() {
  document.getElementById("coachDashboard").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}

function backToCoach() {
  document.getElementById("districtDashboard").style.display = "none";
  document.getElementById("coachDashboard").style.display = "block";
}

function backToDistrict() {
  document.getElementById("regionalDashboard").style.display = "none";
  document.getElementById("districtDashboard").style.display = "block";
}

function backToRegional() {
  document.getElementById("siteAdminDashboard").style.display = "none";
  document.getElementById("regionalDashboard").style.display = "block";
}

// LOAD STATISTICS
function loadStatistics() {

  db.collection("players").get()
    .then((snapshot) => {

      let total = 0;
      let approved = 0;
      let rejected = 0;
      let pending = 0;

      snapshot.forEach((doc) => {

        total++;

        const player = doc.data();

        if (player.status === "Approved") {
          approved++;
        } else if (player.status === "Rejected") {
          rejected++;
        } else {
          pending++;
        }

      });

      document.getElementById("statTotal").innerText = total;
      document.getElementById("statApproved").innerText = approved;
      document.getElementById("statRejected").innerText = rejected;
      document.getElementById("statPending").innerText = pending;

    });

}

// SEARCH PLAYER
function searchPlayer() {

  const lin = document.getElementById("searchLIN").value.trim();

  if (!lin) {
    alert("Enter LIN Number");
    return;
  }

  db.collection("players")
    .where("lin", "==", lin)
    .get()
    .then((snapshot) => {

      if (snapshot.empty) {
        alert("No player found");
        return;
      }

      snapshot.forEach((doc) => {

        const player = doc.data();

        alert(
          "Player: " + player.playerName +
          "\nSchool: " + player.school +
          "\nDistrict: " + player.district +
          "\nSport: " + player.sport +
          "\nLIN: " + player.lin +
          "\nStatus: " + player.status
        );

      });

    })
    .catch((error) => {

      console.log(error);
      alert(error.message);

    });
}

// START CAMERA
let videoStream;

async function startCamera() {

  alert("Start Camera clicked");

  const video = document.getElementById("video");

  try {

    videoStream = await navigator.mediaDevices.getUserMedia({
      video: true
    });

    video.srcObject = videoStream;

    await video.play();

    alert("Camera started successfully");

  } catch (error) {

    console.error(error);

    alert(
      error.message ||
      error.name ||
      JSON.stringify(error)
    );

  }

}
// LOAD MODELS (IMPORTANT)
async function loadModels() {

  const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

  console.log("Face Models Loaded Successfully");
}

loadModels();

// VERIFY FACE
async function verifyFace() {
  if (!currentPlayer) {

  document.getElementById("faceResult").innerText =
    "❌ Search student first";

  return;

}

  const video = document.getElementById("video");

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    document.getElementById("faceResult").innerText =
      "❌ No face detected. Improve lighting / face position.";
    return;
  }

const liveDescriptor = detection.descriptor;

let matched = false;

if (!currentPlayer.faceImage) {

  document.getElementById("faceResult").innerText =
    "❌ No registered face found for this student";

  return;

}

const stored = JSON.parse(currentPlayer.faceImage);

const distance =
  faceapi.euclideanDistance(liveDescriptor, stored);

console.log("Distance:", distance);

if (distance < 0.5) {
  matched = true;
}
 let finalResult = "";

if (matched) {

  // Calculate age again
  const dob = new Date(currentPlayer.dateOfBirth);
  const today = new Date();

  let age =
    today.getFullYear() - dob.getFullYear();

  const m =
    today.getMonth() - dob.getMonth();

  if (
    m < 0 ||
    (m === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  if (age > 20) {

    finalResult =
      "❌ FACE VERIFIED\n" +
      "❌ OVER AGE\n\n" +
      "🚫 NOT CLEARED TO PLAY";

  } else {

    finalResult =
      "✅ FACE VERIFIED\n" +
      "✅ STUDENT VERIFIED\n" +
      "✅ AGE ELIGIBLE\n\n" +
      "🎉 CLEARED TO PLAY";

  }

} else {

  finalResult =
    "❌ FACE DOES NOT MATCH STUDENT\n\n" +
    "🚫 NOT CLEARED TO PLAY";

}

document.getElementById("faceResult").innerText =
  finalResult;
}

// VERIFY STUDENT
function verifyStudent() {
  
  alert("verifyStudent is running");

  const value =
    document.getElementById("searchStudent").value.trim();

  if (!value) {
    alert("Enter Index Number or Pass Slip Number");
    return;
  }
  
  db.collection("players")
    .get()
    .then((snapshot) => {

      let found = false;

      snapshot.forEach((doc) => {

        const player = doc.data();
        
        console.log(player);

        if (
          player.indexNumber === value ||
          player.passSlipNumber === value
        ) {
          currentPlayer = player;

  found = true;

          let age = 0;
let division = "";
let eligibility = "";

if (player.dateOfBirth) {

  const dob = new Date(player.dateOfBirth);
  const today = new Date();

  age = today.getFullYear() - dob.getFullYear();

  const m = today.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  if (age <= 16) {
    division = "U16";
    eligibility = "✅ ELIGIBLE";
  } else if (age === 17) {
    division = "U17";
    eligibility = "✅ ELIGIBLE";
  } else if (age === 18) {
    division = "U18";
    eligibility = "✅ ELIGIBLE";
  } else if (age === 19) {
    division = "U19";
    eligibility = "✅ ELIGIBLE";
  } else if (age === 20) {
    division = "U20";
    eligibility = "✅ ELIGIBLE";
  } else {
    division = "OVER AGE";
    eligibility = "❌ NOT ELIGIBLE";
  }

}

          found = true;

          document.getElementById("verificationResult").innerHTML = `
            <div style="padding:15px;border:1px solid #ccc;border-radius:10px;background:white;">
            <img
  src="${player.profilePhoto || ''}"
  width="150"
  height="150"
  style="border:2px solid #333;border-radius:10px;"
>

              <h3>Player Details</h3>

              <p><strong>Name:</strong> ${player.playerName}</p>
              <p><strong>School:</strong> ${player.school}</p>
              <p><strong>District:</strong> ${player.district}</p>
              <p><strong>Sport:</strong> ${player.sport}</p>
              <p><strong>LIN:</strong> ${player.lin}</p>
              <p><strong>Index Number:</strong> ${player.indexNumber}</p>
              <p><strong>Pass Slip:</strong> ${player.passSlipNumber}</p>
              <p><strong>Status:</strong> ${player.status}</p>
              <p><strong>Date of Birth:</strong> ${player.dateOfBirth}</p>

<p><strong>Age:</strong> ${age}</p>

<p><strong>Division:</strong> ${division}</p>

<p><strong>Eligibility:</strong> ${eligibility}</p>

            </div>
          `;
        }

      });

      if (!found) {

        document.getElementById("verificationResult").innerHTML = `
          <div style="color:red;font-weight:bold;">
            ❌ Student Record Not Found
          </div>
        `;
        document.getElementById("qrcode").innerHTML = "";

new QRCode(
  document.getElementById("qrcode"),
  {
    text: JSON.stringify({
      name: player.playerName,
      school: player.school,
      sport: player.sport,
      indexNumber: player.indexNumber,
      passSlipNumber: player.passSlipNumber,
      status: player.status
    }),
    width: 180,
    height: 180
  }
);

      }

    })
    .catch((error) => {

      console.log(error);
      alert(error.message);

    });

}
document.getElementById("profilePhoto")
.addEventListener("change", function(event) {

  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {

    document.getElementById("profilePreview").src =
      e.target.result;

  };

  reader.readAsDataURL(file);

});

window.onload = function () {
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("coachDashboard").style.display = "none";
  document.getElementById("districtDashboard").style.display = "none";
};

function showDistrict() {

  document.getElementById("coachDashboard").style.display = "none";

  document.getElementById("districtDashboard").style.display = "block";

  loadPlayers();

}
setInterval(() => {

  const clock = document.getElementById("liveClock");

  if (clock) {
    clock.innerHTML = new Date().toLocaleString();
  }

}, 1000);
