// --- Game Data ---
const songs = [
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
  {
    title: "Hotter Than That",
    artist: "Louis Armstrong and His Hot Five",
    file: "songs/hotter.mp3",
    rangeStart: 0,
    rangeEnd: 180,
  },
  {
    title: "The Stampede",
    artist: "Fletcher Henderson",
    file: "songs/stampede.mp3",
    link: "https://en.wikipedia.org/wiki/Fletcher_Henderson",
    rangeStart: 0,
    rangeEnd: 192,
  },
  {
    title: "The Charleston",
    artist: "Arthur Gibbs",
    file: "songs/charleston.mp3",
    link: "https://en.wikipedia.org/wiki/The_Charleston_(dance)",
    rangeStart: 0,
    rangeEnd: 181,
  },
  {
    title: "Tea for Two",
    artist: "Marion Harris",
    file: "songs/tea.mp3",
    link: "https://en.wikipedia.org/wiki/Tea_for_Two_(song)",
    rangeStart: 0,
    rangeEnd: 182,
  },
  {
    title: "Can’t Help Lovin’ Dat Man",
    artist: "Helen Morgan",
    file: "songs/canthelp.mp3",
    link: "https://en.wikipedia.org/wiki/Can%27t_Help_Lovin%27_Dat_Man",
    rangeStart: 0,
    rangeEnd: 181,
  },
  {
    title: "Sweet Georgia Brown",
    artist: "Ben Bernie",
    file: "songs/georgia.mp3",
    link: "https://en.wikipedia.org/wiki/Sweet_Georgia_Brown",
    rangeStart: 0,
    rangeEnd: 177,
  },
  {
    title: "Toot, Toot, Tootsie!",
    artist: "Al Jolson",
    file: "songs/tootsie.mp3",
    link: "https://en.wikipedia.org/wiki/Toot,_Toot,_Tootsie_(Goo%27_Bye!)",
    rangeStart: 0,
    rangeEnd: 147,
  },
  {
    title: "La création du monde",
    artist: "Darius Milhaud",
    file: "songs/creation.mp3",
    link: "https://en.wikipedia.org/wiki/La_cr%C3%A9ation_du_monde",
    rangeStart: 0,
    rangeEnd: 333,
  },
  {
    title: "Rhapsody in Blue",
    artist: "George Gershwin",
    file: "songs/rhapsody.mp3",
    link: "https://en.wikipedia.org/wiki/Rhapsody_in_Blue",
    rangeStart: 0,
    rangeEnd: 300,
  },
  {
    title: "Burlesque",
    artist: "Aaron Copland",
    file: "songs/burlesque.mp3",
    link: "https://en.wikipedia.org/wiki/Music_for_the_Theatre",
    rangeStart: 0,
    rangeEnd: 195,
  },
  {
    title: "Violin Sonata No. 2 – Blues",
    artist: "Maurice Ravel",
    file: "songs/violin.mp3",
    link: "https://en.wikipedia.org/wiki/Violin_Sonata_No._2_(Ravel)",
    rangeStart: 0,
    rangeEnd: 299,
  },
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
let mode = "hard";
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

/** Shuffles an array in place (Fisher-Yates) */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/** Utility: Levenshtein distance for fuzzy matching */
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

  // FIX: Ensure hard-input and answer-bank have the correct initial display styles
  if (mode === "easy") {
    hardInputDiv.style.display = "none";
    answerBankDiv.style.display = "flex"; // Use 'flex' to make the word bank buttons layout nicely
  } else {
    hardInputDiv.style.display = "flex";
    answerBankDiv.style.display = "none";
  }

  nextSong();
}

function updateGameUI() {
  progressText.textContent = `Question ${songIndex + 1} of ${songs.length}`;
  scoreDisplay.textContent = `Score: ${score}`;
  hintCountSpan.textContent = hintsRemaining;

  // Update input placeholder based on current guessing stage
  if (stage === "title") {
    guessInput.placeholder = "Type your guess: Song Title";
  } else if (stage === "artist") {
    guessInput.placeholder = "Type your guess: Artist Name";
  }

  // FIX: Re-render bank when switching stages in 'both' mode
  if (mode === "easy") {
    renderAnswerBank();
  }
}

function renderAnswerBank() {
  const bank = answerBankDiv;
  bank.innerHTML = "";
  if (mode === "easy") {
    let answers = [];

    // FIX: Correctly determine which list of answers to show based on the current stage
    if (quizType === "artist" || (quizType === "both" && stage === "artist")) {
      answers = songs.map((s) => s.artist);
    } else {
      // title or both/title stage
      answers = songs.map((s) => s.title);
    }
    shuffleArray(answers);

    // Limit to the first 10 unique answers to prevent overwhelming the screen
    answers = [...new Set(answers)].slice(0, 10);

    answers.forEach((ans) => {
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

  updateGameUI();

  // 3. Play audio snippet
  audio.src = currentSong.file;
  audio.load();
  audio.onloadedmetadata = () => {
    let rangeStart = currentSong.rangeStart;
    let rangeEnd = currentSong.rangeEnd;
    let possibleStartRange = rangeEnd - rangeStart - 15;

    if (possibleStartRange < 0) {
      console.error(
        "The defined range for " +
          currentSong.title +
          " is shorter than 15 seconds."
      );
      snippetStart = rangeStart;
    } else {
      snippetStart =
        rangeStart + Math.floor(Math.random() * (possibleStartRange + 1));
    }

    snippetEnd = snippetStart + 15;
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
  let answerText = "";
  let isTitleStage = stage === "title";

  // Determine correctness and answer text based on the current stage
  if (isTitleStage) {
    correct =
      levenshtein(normalizedGuess, currentSong.title.toLowerCase()) <= 3;
    answerText = currentSong.title;
  } else {
    // stage === "artist"
    correct =
      levenshtein(normalizedGuess, currentSong.artist.toLowerCase()) <= 3;
    answerText = currentSong.artist;
  }

  let songCompleted = false;

  if (correct) {
    score++;
    showOverlay(`✅ Correct ${isTitleStage ? "Title" : "Artist"}!`, "#4CAF50");

    if (quizType === "both" && isTitleStage) {
      // Transition from title to artist stage
      stage = "artist";
      guessInput.value = "";
      updateGameUI();
      // Wait briefly, then replay the snippet for the next guess
      setTimeout(repeatSnippet, 1000);
      return;
    }
    songCompleted = true;
  } else {
    showOverlay(
      `❌ Incorrect ${
        isTitleStage ? "Title" : "Artist"
      }. Correct: ${answerText}`,
      "#FF0000"
    );
    missedSongs.add(currentSong);
    songCompleted = true;
  }

  scoreDisplay.textContent = `Score: ${score}`;

  if (songCompleted) {
    songIndex++;
    // Move to the next song after a short delay to display feedback
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
