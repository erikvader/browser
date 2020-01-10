const openExternally = "open externally";

function getChoices(latestChoice) {
  let choices = [];
  if (latestChoice !== null) {
    choices.push([latestChoice]);
  } else {
    choices.push([]);
  }
  choices.push(window.delugeDirs);
  choices.push([openExternally]);
  return choices;
}

function download(latestChoice, choice) {
  if (!getChoices().flat().includes(choice)) {
    throw new Error("invalid choice");
  }

  if (choice === openExternally) {
    // just open it
  } else if (choice === latestChoice) {
    // set directly to this
  } else {
    // open file explorer for choice
    return choice
  }
  return null;
}

module.exports = {getChoices, download};
