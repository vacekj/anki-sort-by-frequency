let jsonfile = require('jsonfile');
let JSONStream = require('JSONStream');
let fs = require('fs');
var natural = require('natural');

// Stats
let statistics = {
  cardsImported: 0,
  cardsExported: 0,
  cardsIgnored: 0,
  dbEntries: 0
};

// Load the deck
let rawdeck = jsonfile.readFileSync('input/deck.json');

// Extract and normalize cards into words
let deck = rawdeck.map((card) => {
  return card.Front ? normalized = card.Front.trim().replace('to ','').replace('a ','') : card.Front;
});
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
    if (data.word == 'solstice')
       l = l;
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

  statistics.cardsExported = result.length;
  statistics.cardsIgnored = statistics.cardsImported - result.length;

  // Write result
  jsonfile.writeFileSync('output/result.json', result);
  let wordCount = 0;

  var resultStream = fs.createWriteStream('output/result.txt');
  result.forEach((element) => {
    resultStream.write(element.frequency + '\t' + element.word + '\n');
    wordCount++;
  });
  resultStream.end();

  var deckStream = fs.createWriteStream('output/ignored.txt');
  deck.forEach((element) => {
    deckStream.write(element + '\t' + element + '\n');
    wordCount++;
  });
  deckStream.end();
  console.log('Total words exported: ' + wordCount);
  console.log(`Statistics:
  Words imported: ${statistics.cardsImported}
  Words exported: ${statistics.cardsExported}
  Words not found: ${statistics.cardsIgnored} (${deck.length})
  DB entries: ${statistics.dbEntries}
  `);

}