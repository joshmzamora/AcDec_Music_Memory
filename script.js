// --- Game Data ---
const songs = [
  // ... (Your songs array remains the same)
  {
    title: "Lost Your Head Blues",
    artist: "Bessie Smith",
    file: "songs/lost.mp3",
    link: "https://en.wikipedia.org/wiki/Bessie_Smith",
    rangeStart: 0,
    rangeEnd: 175,
  },
  {
    title: "Dippermouth Blues",
    artist: "King Oliver",
    file: "songs/dippermouth.mp3",
    link: "https://en.wikipedia.org/wiki/King_Oliver",
    rangeStart: 0,
    rangeEnd: 149,
  },
  // ... (rest of your songs)
  {
    title: "Sicilienne",
    artist: "Germaine Tailleferre",
    file: "songs/sicilienne.mp3",
    link: "https://en.wikipedia.org/wiki/Germaine_Tailleferre",
    rangeStart: 0,
    rangeEnd: 145,
  },
];

// --- DOM Elements ---
const audio = document.getElementById("player");
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const endScreen = document.getElementById("end-screen");
const guessInput = document.getElementById("guess");
const scoreDisplay = document.getElementById("score");
const progressText = document.getElementById("progress-text");
const progressBar = document.getElementById("progress");
const hardInputDiv = document.getElementById("hard-input");
const answerBankDiv = document.getElementById("answer-bank");
const hintCountSpan = document.getElementById("hint-count");
const easyModeBtn = document.getElementById("easy-mode-btn");
const hardModeBtn = document.getElementById("hard-mode-btn");

// --- Game State Variables ---
// FIX 1: Set default mode to 'easy' to match the HTML default selection
let mode = "easy";
let quizType = "both";
let currentSong = null;
let score = 0;
let snippetLength = 15;
let snippetStart = 0;
let snippetEnd = 0;
let progressInterval;
let stage = "title"; // 'title' or 'artist'
let hintsRemaining = 3;
let missedSongs = new Set(); // Use a Set to store unique missed songs
let quizSongs = []; // Shuffled array of songs for the current quiz
let songIndex = 0; // Index for current song in quizSongs

// --- Utility Functions ---
// ... (shuffleArray and levenshtein functions remain the same)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function levenshtein(a, b) {
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      m[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? m[i - 1][j - 1]
          : Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

// --- UI & Control Functions ---

function setMode(selected) {
  mode = selected;
  // Visual update logic
  easyModeBtn.classList.remove("selected");
  hardModeBtn.classList.remove("selected");
  if (mode === "easy") {
    easyModeBtn.classList.add("selected");
  } else {
    hardModeBtn.classList.add("selected");
  }
}

function startGame() {
  quizType = document.getElementById("quiz-type").value;
  snippetLength = parseInt(document.getElementById("snippet-length").value);

  startScreen.style.display = "none";
  gameScreen.style.display = "block";

  // Reset game state
  score = 0;
  missedSongs.clear();
  quizSongs = [...songs];
  shuffleArray(quizSongs);
  songIndex = 0;

  // FIX 2: Force the UI to update based on the current mode before nextSong
  updateGameUI();

  nextSong();
}

function updateGameUI() {
  progressText.textContent = `Question ${songIndex + 1} of ${songs.length}`;
  scoreDisplay.textContent = `Score: ${score}`;
  hintCountSpan.textContent = hintsRemaining;

  // This section ensures the correct input is visible based on 'mode'
  if (mode === "easy") {
    hardInputDiv.style.display = "none";
    answerBankDiv.style.display = "flex";
    renderAnswerBank(); // <-- STEP 1: Renders the bank for the CURRENT stage ('title' first)
  } else {
    hardInputDiv.style.display = "flex";
    answerBankDiv.style.display = "none";
  }

  // Update input placeholder based on current guessing stage (Hard Mode only)
  if (stage === "title") {
    guessInput.placeholder = "Type your guess: Song Title";
  } else if (stage === "artist") {
    guessInput.placeholder = "Type your guess: Artist Name";
  }
}

function renderAnswerBank() {
  const bank = answerBankDiv;
  bank.innerHTML = "";
  if (mode === "easy") {
    let answers = [];

    // This logic determines the content of the bank:
    // If it's the artist stage, show artist names; otherwise, show titles.
    if (quizType === "artist" || (quizType === "both" && stage === "artist")) {
      answers = songs.map((s) => s.artist); // <-- Shows ARTIST bank
    } else {
      answers = songs.map((s) => s.title); // <-- Shows TITLE bank
    }

    // Shuffle and limit the unique answers for the word bank
    let uniqueAnswers = [...new Set(answers)];
    shuffleArray(uniqueAnswers);

    // Limit to the first 10 unique answers
    uniqueAnswers.slice(0, 10).forEach((ans) => {
      let btn = document.createElement("button");
      btn.textContent = ans;
      btn.onclick = () => submitGuess(ans);
      bank.appendChild(btn);
    });
  }
}

function nextSong() {
  // 1. Check if the quiz is over
  if (songIndex >= quizSongs.length) {
    displayEndScreen();
    return;
  }

  // 2. Setup next song
  currentSong = quizSongs[songIndex];
  stage = quizType === "artist" ? "artist" : "title"; // Start stage based on quiz type
  hintsRemaining = 3;
  guessInput.value = "";

  clearInterval(progressInterval);
  progressBar.style.width = "0%";

  // FIX 3: updateGameUI is called here too, maintaining consistency
  updateGameUI();

  // 3. Play audio snippet
  audio.src = currentSong.file;
  audio.load();
  audio.onloadedmetadata = () => {
    let rangeStart = currentSong.rangeStart || 0;
    let rangeEnd = currentSong.rangeEnd || audio.duration;
    let possibleStartRange = rangeEnd - rangeStart - snippetLength;

    if (possibleStartRange < 0) {
      console.error(
        "The defined range for " +
          currentSong.title +
          " is shorter than " +
          snippetLength +
          " seconds. Using start of range."
      );
      snippetStart = rangeStart;
    } else {
      snippetStart =
        rangeStart + Math.floor(Math.random() * (possibleStartRange + 1));
    }

    snippetEnd = snippetStart + snippetLength;
    audio.currentTime = snippetStart;
    audio.play();
    updateStatus("🎵 Now Playing...");
    trackProgress();
  };
}

function repeatSnippet() {
  if (currentSong) {
    audio.currentTime = snippetStart;
    audio.play();
    updateStatus("🎵 Now Playing...");
    trackProgress();
  }
}

function skipSong() {
  if (currentSong) {
    missedSongs.add(currentSong);
    showOverlay(
      `⏭️ Skipped. Answer: ${currentSong.title} by ${currentSong.artist}`,
      "#FFA500"
    );
  }
  songIndex++;
  setTimeout(nextSong, 2500); // Wait for feedback overlay to finish
}

function submitGuess(inputGuess = null) {
  let guess = inputGuess || guessInput.value.trim();
  if (!guess) return;

  audio.pause();
  clearInterval(progressInterval);
  updateStatus("Idle");

  const normalizedGuess = guess.toLowerCase();
  let correct = false;
  let targetAnswer = "";
  let targetType = "";
  let songCompleted = false;

  // 1. Determine the target answer based on the current stage/quiz type
  if (stage === "title" && (quizType === "title" || quizType === "both")) {
    targetAnswer = currentSong.title;
    targetType = "Title";
  } else if (
    stage === "artist" &&
    (quizType === "artist" || quizType === "both")
  ) {
    targetAnswer = currentSong.artist;
    targetType = "Artist";
  } else {
    return;
  }

  // 2. Check correctness using Levenshtein distance
  correct = levenshtein(normalizedGuess, targetAnswer.toLowerCase()) <= 3;

  if (correct) {
    score++;
    showOverlay(`✅ Correct ${targetType}!`, "#4CAF50");

    // --- KEY TRANSITION LOGIC ---
    if (quizType === "both" && targetType === "Title") {
      // Step A: Update the internal state to prepare for the Artist guess
      stage = "artist";
      guessInput.value = "";

      // Step B: Call updateGameUI, which in turn calls renderAnswerBank()
      // This switches the word bank from Titles to Artists.
      updateGameUI();

      // Step C: Replay the snippet for the user to guess the artist
      setTimeout(repeatSnippet, 1000);
      return; // Stops here, waiting for the artist guess
    }
    songCompleted = true; // If not "both" or if "Artist" was guessed, the song is done
  } else {
    showOverlay(
      `❌ Incorrect ${targetType}. Correct: ${targetAnswer}`,
      "#FF0000"
    );
    missedSongs.add(currentSong);
    songCompleted = true;
  }

  scoreDisplay.textContent = `Score: ${score}`;

  if (songCompleted) {
    songIndex++;
    setTimeout(nextSong, 2500);
  }
}

function showHint() {
  if (hintsRemaining <= 0) {
    showOverlay("No hints left!", "#FF0000");
    return;
  }

  let hintMsg = "";
  const target = stage === "title" ? currentSong.title : currentSong.artist;

  if (hintsRemaining === 3) {
    hintMsg = "First letter: " + target[0].toUpperCase();
  } else if (hintsRemaining === 2) {
    // Reveal the other element
    if (stage === "title") {
      hintMsg = "Artist is: " + currentSong.artist;
    } else {
      hintMsg = "Title is: " + currentSong.title;
    }
  } else if (hintsRemaining === 1) {
    // Reveal word count
    hintMsg = "Word count: " + target.split(" ").length;
  }

  hintsRemaining--;
  hintCountSpan.textContent = hintsRemaining;
  showOverlay("💡 Hint: " + hintMsg, "#1e90ff");
}

// --- Audio & Progress Functions ---

function updateStatus(text) {
  document.getElementById("status").textContent = text;
}

function trackProgress() {
  clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    if (!audio.paused) {
      const pct =
        ((audio.currentTime - snippetStart) / (snippetEnd - snippetStart)) *
        100;
      progressBar.style.width = Math.min(100, Math.max(0, pct)) + "%";
      if (audio.currentTime >= snippetEnd) {
        audio.pause();
        clearInterval(progressInterval);
        updateStatus("✅ Snippet Ended");
      }
    }
  }, 200);
}

function showOverlay(message, color = "#ffd700") {
  const overlay = document.getElementById("overlay-feedback");
  const feedback = document.getElementById("feedback");
  feedback.textContent = message;
  feedback.style.color = color;
  overlay.style.opacity = "1";
  overlay.style.pointerEvents = "auto";
  setTimeout(hideOverlay, 2000);
}

function hideOverlay() {
  const overlay = document.getElementById("overlay-feedback");
  overlay.style.opacity = "0";
  overlay.style.pointerEvents = "none";
}

// --- End Game Functions ---

function displayEndScreen() {
  audio.pause();
  gameScreen.style.display = "none";
  endScreen.style.display = "block";

  const totalPossiblePoints = songs.length * (quizType === "both" ? 2 : 1);

  document.getElementById("final-score").innerHTML = `
    <h2>Quiz Complete!</h2>
    <p>Final Score: <strong>${score}/${totalPossiblePoints}</strong></p>
    <p>Accuracy: <strong>${Math.round(
      (score / totalPossiblePoints) * 100
    )}%</strong></p>
  `;

  let reviewDiv = document.getElementById("review-answers");
  reviewDiv.innerHTML = "<h3>Review Missed Songs:</h3>";

  if (missedSongs.size === 0) {
    reviewDiv.innerHTML += "<p>🎉 Excellent! You didn't miss any songs!</p>";
  } else {
    missedSongs.forEach((s) => {
      reviewDiv.innerHTML += `<p>${s.title} by ${s.artist} - <a href="${s.link}" target="_blank">Learn More</a></p>`;
    });
  }
}

function restartGame() {
  endScreen.style.display = "none";
  startScreen.style.display = "block";
}
