let jsonfile = require('jsonfile');
let JSONStream = require('JSONStream');
let fs = require('fs');
var natural = require('natural');

// Load the deck
let rawdeck = jsonfile.readFileSync('deck.json');
// Extract the word
let deck = rawdeck.map((card) => {
  if (card.Front) {
    return natural.PorterStemmer.stem(card.Front) ? natural.PorterStemmer.stem(card.Front) : card.Front // Stem the word (consignment -> consign)
  }
  else {
    return card.Front;
  }
});

// Load the DB using streams
let stream = JSONStream.parse('*');
var readStream = fs.createReadStream('freq_en.json');
readStream.pipe(stream);

let result = [];

stream.on('data', function (data) {
  if (deck.includes(data.word)) {
    result.push(data);
  }
});

stream.on('end', function (data) {
  sort()
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

  // Write result to file
  jsonfile.writeFileSync('result.json', result);
  let wordCount = 0;
  var logger = fs.createWriteStream('result.txt');
  result.forEach((element) => {
    logger.write(element.frequency + '\t' + element.word + '\n');
    wordCount++;
  });
  console.log('Total words exported: ' + wordCount);
  logger.end();
}