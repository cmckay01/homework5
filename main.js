var audioCtx;
var osc;
var timings;
var liveCodeState = [];

const playButton = document.querySelector('button');

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext);
  osc = audioCtx.createOscillator();
  timings = audioCtx.createGain();
  timings.gain.value = 0;
  osc.connect(timings).connect(audioCtx.destination);
  osc.start();
  scheduleAudio();
}

function scheduleAudio() {
  let timeElapsedSecs = 0;
  liveCodeState.forEach(noteData => {
    timings.gain.setTargetAtTime(1, audioCtx.currentTime + timeElapsedSecs, 0.01);
    osc.frequency.setTargetAtTime(noteData["pitch"], audioCtx.currentTime + timeElapsedSecs, 0.01);
    timeElapsedSecs += noteData["length"] / 10.0;
    timings.gain.setTargetAtTime(0, audioCtx.currentTime + timeElapsedSecs, 0.01);
    timeElapsedSecs += 0.2; // Rest between notes
  });
  setTimeout(scheduleAudio, timeElapsedSecs * 1000);
}

function parseCode(code) {
  let expandedCode = "";
  let repeatStack = [];

  for (let i = 0; i < code.length; i++) {
    if (code[i] === "[") {
      repeatStack.push(i);
    } else if (code[i] === "]") {
      let startIndex = repeatStack.pop();
      let repeatCount = parseInt(code[startIndex - 1]);
      let repeatedSection = code.substring(startIndex + 1, i);

      for (let j = 0; j < repeatCount; j++) {
        expandedCode += repeatedSection;
      }
    } else if (repeatStack.length === 0) {
      expandedCode += code[i];
    }
  }

  let oscillatorType = "sine"; // Default oscillator type
  let notes = expandedCode.trim().split(" ");

  if (["sine", "square", "sawtooth", "triangle"].includes(notes[0])) {
    oscillatorType = notes.shift();
  }

  notes = notes.map(note => {
    noteData = note.split("@");
    return {
      "length": eval(noteData[0]),
      "pitch": eval(noteData[1])
    };
  });

  return { notes, oscillatorType };
}

function genAudio(data) {
  liveCodeState = data.notes;
  osc.type = data.oscillatorType;
}

function reevaluate() {
  var code = document.getElementById('code').value;
  var data = parseCode(code);
  genAudio(data);
}

playButton.addEventListener('click', function () {
  if (!audioCtx) {
    initAudio();
  }
  reevaluate();
});