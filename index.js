let jsonfile = require('jsonfile');
let JSONStream = require('JSONStream');
let fs = require('fs');

// Stats
let statistics = {
	cardsImported: 0,
	dbEntries: 0
};

let paths = {
	frequencyDB: 'db/freq_en.json',
	inputDeck: 'input/deck.json'
};

// Load the deck
let rawdeck = jsonfile.readFileSync(paths.inputDeck);

// Extract and normalize cards into words
let deck = rawdeck.map((card) => {
	return card.Front ? card.Front.trim().replace(/^to /, '').replace(/^a /, '') : card.Front;
});
let dedupedDeck = removeDuplicates(deck);
statistics.cardsImported = dedupedDeck.length;

// Load the DB using streams
let stream = JSONStream.parse('*');
var readStream = fs.createReadStream(paths.frequencyDB);
readStream.pipe(stream);

let result = [];
let dbEntries = 0;

stream.on('data', function (data) {
	dbEntries++;
	if (dedupedDeck.includes(data.word)) {
		result.push(data);
		dedupedDeck.splice(dedupedDeck.indexOf(data.word), 1)
	}
});

stream.on('end', function (data) {
	statistics.dbEntries = dbEntries;
	let sortedResult = sort(result);
	writeResult(sortedResult);
});

function sort(arr) {
	// Sort by frequency descending
	return arr.sort((a, b) => {
		let afreq = parseInt(a.frequency);
		let bfreq = parseInt(b.frequency);
		if (afreq > bfreq)
			return -1;
		if (afreq < bfreq)
			return 1;
		return 0;
	});
}

function writeResult(res) {
	// Write result
	let resultStream = fs.createWriteStream('output/result.txt');
	res.forEach((element) => {
		resultStream.write(element.frequency + '\t' + element.word + '\n');
	});
	resultStream.end();

	// Output ignored
	let ignoredStream = fs.createWriteStream('output/ignored.txt');
	dedupedDeck.forEach((element) => {
		ignoredStream.write(element + '\t' + element + '\n');
	});
	ignoredStream.end();

	console.log(`Statistics:
	Words imported: ${statistics.cardsImported}
	Words exported: ${res.length}
	Words not found: ${dedupedDeck.length}
	DB entries: ${statistics.dbEntries}
	`);
}

// Fn to remove dupes from array
function removeDuplicates(array) {
	return array.filter((elem, pos, arr) => {
		return arr.indexOf(elem) == pos;
	});
}