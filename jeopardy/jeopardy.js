// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

const NUM_CATEGORIES = 6;
const NUM_QUESTIONS_PER_CAT = 5;
const API_URL = "https://rithm-jeopardy.herokuapp.com/api";

let categories = [];


/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
    const res = await axios.get(`${API_URL}/categories`, {
        params: { count: 100}
    });

    // only use categories that have enough clues for board
    const usable = res.data.filter(c => c.clues_count >= NUM_QUESTIONS_PER_CAT); 
    const ids = usable.map(c => c.id); // pull out ids

    const chosen = new Set(); // pick NUM_CATEGORIES unique random ids
    while (chosen.size < NUM_CATEGORIES) {
        const randId = ids[Math.floor(Math.random() * ids.length)];
        chosen.add(randId);
    }
    return [...chosen];
}


/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    const res = await axios.get(`${API_URL}/category`, {
        params: { id: catId }
    });
    const { title, clues} = res.data;
    const picked = [];
    const usedIdx = new Set();

    while (picked.length < NUM_QUESTIONS_PER_CAT) {
        const idx = Math.floor(Math.random() * clues.length);
        if (usedIdx.has(idx)) continue;
        usedIdx.add(idx);
        
        picked.push({
            question: clues[idx].question,
            answer: clues[idx].answer,
            showing: null
        });
    }
    return { title, clues: picked };
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
    const $thead = $("#jeopardy thead");
    const $tbody = $("#jeopardy tbody");

    // clear any existing board
    $thead.empty();
    $tbody.empty();

    // build thead category titles
    const $headRow = $("<tr>");
    for (let c = 0; c < categories.length; c++) {
        $headRow.append($("<th>").text(categories[c].title));
    }
    $thead.append($headRow);

    //build tbody question marks
    for (let r = 0; r < NUM_QUESTIONS_PER_CAT; r++) {
        const $row = $("<tr>");

        for (let c = 0; c < categories.length; c++) {
            const $cell = $("<td>")
            .text("?")
            .attr("data-cat-idx", c)
            .attr("data-clue-idx", r);

        $row.append($cell);
        }
        $tbody.append($row);
    }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
    const $td = $(evt.target);

    // only handle clicks on tds
    if (!$td.is("td")) return;

    const catIdx = +$td.attr("data-cat-idx");
    const clueIdx = +$td.attr("data-clue-idx");

    const clue = categories[catIdx].clues[clueIdx];

    if (clue.showing === null) {
        $td.text(clue.question);
        clue.showing = "question";
        $td.addClass("revealed");
    } else if (clue.showing === "question") {
        $td.text(clue.answer);
        clue.showing = "answer";
        //if "answer", do nothing
    }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    $("#spinner").show();
    $("#start").prop("disabled", true).text("Loading...");
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    $("#spinner").hide();
    $("#start").prop("disabled", false).text("Restart");
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  showLoadingView();

  try {
    const ids = await getCategoryIds();
    categories = await Promise.all(ids.map(getCategory));
    await fillTable();
  } catch (err) {
    console.error("Error setting up game:", err);
    alert("Could not load Jeopardy data. Please try again.");
  } finally {
    hideLoadingView();
  }
}


/** On click of start / restart button, set up game. */

$("#start").on("click", setupAndStart);

/** On page load, add event handler for clicking clues */

$("#jeopardy").on("click", "td", handleClick);
