let chart;
let dataTable;
let fragmentsClient;
let counter = 0;
let tableOptions = {
  timeline: { showRowLabels: false }
};
let addTitles = [];
let nothingDiv;

window.onload = () => {
  window.ldf.Logger.setLevel('error');
  fragmentsClient = new ldf.FragmentsClient('https://data.betweenourworlds.org/latest');
  google.charts.load('current', {'packages':['timeline']});
  google.charts.setOnLoadCallback(setUpChart);
  nothingDiv = document.querySelector("#nothing");

  document.querySelector("#search").addEventListener("submit", e => {
    nothingDiv.classList.add('hidden');
    e.preventDefault();
  });

  document.querySelectorAll('input[type=submit]').forEach(i => {
    i.onclick = function() {
      nothingDiv.classList.add('hidden');

      if (this.value === "Search") {
        let titleDiv = document.querySelector("#title");
        let title = titleDiv.value;

        if (title === "") {
          nothingDiv.innerHTML = `Please fill in a title first.`;
          nothingDiv.classList.remove('hidden');
        } else {
          titleDiv.value = "";

          if (addTitles.indexOf(title) === -1) {
            addAnime(title);
          } else {
            nothingDiv.innerHTML = `'${title}' is already on the timeline.`;
            nothingDiv.classList.remove('hidden');
          }
        }
      } else if (this.value === "Clear") {
        clear();
      } else {
        loadExamples();
      }
    };
  });
};

function loadExamples(){
  clear();
  anime = ['Naruto', 'One Piece', 'Fairy Tail', 'Your Lie in April', 'Golden Time'];

  anime.forEach(a => {
    addAnime(a);
  });
}

function clear() {
  if (dataTable.getNumberOfRows() !== 0) {
    for (let i = 0; i < addTitles.length; i ++) {
      dataTable.removeRow(0);
    }

    addTitles = [];

    chart.clearChart();
  }
}

function addAnime(title, lang = "") {
  if (lang !== "") {
    lang = '@' + lang;
  }

  let found = false;
  let limit = 1;
  let query = `SELECT * {
    ?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://dbpedia.org/ontology/Anime>.
    ?s <http://schema.org/name> "${title}"${lang}.
    ?s <http://schema.org/startDate> ?start .
    OPTIONAL {?s <http://schema.org/endDate> ?end .}
  } LIMIT ${limit}`;

  let results;

  try {
    results = new ldf.SparqlIterator(query, { fragmentsClient: fragmentsClient });
  } catch (e) {
    console.log(e);
  }

  results.on('data', result => {
    let end;

    if (result['?end']) {
      end = new Date(Date.parse(N3.Util.getLiteralValue(result['?end'])))
    } else {
      end = new Date();
    }

    dataTable.addRows([
      [ '' + counter,
      title,
      new Date(Date.parse(N3.Util.getLiteralValue(result['?start']))),
      end ]
    ]);
    counter ++;
    found = true;
    //document.querySelector('#counter').innerHTML = `${counter}/${limit} done`;
  });

  results.on('end', () => {
    if (found) {
      addTitles.push(title);
      chart.draw(dataTable, tableOptions);
    } else if (lang === "") {
      addAnime(title, "en");
    } else {
      nothingDiv.innerHTML = `'${title}' not found.`;
      nothingDiv.classList.remove('hidden');
    }
  })
}

function setUpChart() {
  let container = document.getElementById('timeline');
  chart = new google.visualization.Timeline(container);
  dataTable = new google.visualization.DataTable();

  dataTable.addColumn({ type: 'string', id: 'Term' });
  dataTable.addColumn({ type: 'string', id: 'Name' });
  dataTable.addColumn({ type: 'date', id: 'Start' });
  dataTable.addColumn({ type: 'date', id: 'End' });
}
