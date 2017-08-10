let jsonfile = require('jsonfile');
let JSONStream = require('JSONStream');
let fs = require('fs');

// Fn to remove dupes from array
var removeDuplicates = (array) => {
  return array.filter((elem, pos, arr) => {
    return arr.indexOf(elem) == pos;
  });
}

// Stats
let statistics = {
  cardsImported: 0,
  dbEntries: 0
};

// Load the deck
let rawdeck = jsonfile.readFileSync('input/deck.json');

// Extract and normalize cards into words
let deck = rawdeck.map((card) => {
  return card.Front ? normalized = card.Front.trim().replace(/^to /, '').replace(/^a /, '') : card.Front;
});
deck = removeDuplicates(deck);
statistics.cardsImported = deck.length;

// Load the DB using streams
let stream = JSONStream.parse('*');
var readStream = fs.createReadStream('db/freq_en.json');
readStream.pipe(stream);

let result = [];
let dbEntries = 0;

stream.on('data', function (data) {
  dbEntries++;
  if (deck.includes(data.word)) {
    result.push(data);
    deck.splice(deck.indexOf(data.word), 1)
  }
});

stream.on('end', function (data) {
  statistics.dbEntries = dbEntries;
  sort();
});

function sort() {
  // Sort by frequency descending
  result.sort((a, b) => {
    let afreq = parseInt(a.frequency);
    let bfreq = parseInt(b.frequency);
    if (afreq > bfreq)
      return -1;
    if (afreq < bfreq)
      return 1;
    return 0;
  });

  // Write result
  var resultStream = fs.createWriteStream('output/result.txt');
  result.forEach((element) => {
    resultStream.write(element.frequency + '\t' + element.word + '\n');
  });
  resultStream.end();

  var ignoredStream = fs.createWriteStream('output/ignored.txt');
  deck.forEach((element) => {
    ignoredStream.write(element + '\t' + element + '\n');
  });
  ignoredStream.end();

  console.log(`Statistics:
  Words imported: ${statistics.cardsImported}
  Words exported: ${result.length}
  Words not found: ${deck.length}
  DB entries: ${statistics.dbEntries}
  `);
}