

// settings for local testing
// these will be replaced by add-on settings
function localTest() {
  return {
    template: "1Q6K57zLdnL6Vm0gzKuukOLs0npA5BeBw2kO7xEb5Z9E", // the slide template id
    sheetId: "1t8IFpVvsas2uOiuT8g21qoeB4qf8IIZDLuC85OVVH1k", // the sheet id
    sheetName: "Actors", // the name of the sheet with the variable data
    presoFolder: "/Published Scripts/slidemerge/results", // the folder to write the output preso(s) to
    presoName: "actors-results", // the base name for the preso(s) created
    options: {
      type: "single",    // multiple , single
      suffixHeading: "", // used with multiple, to append to deck name, gets data from sheet row variable
      startRow: 1,       // where to start
      finishRow: 3,       // where to finish
      masters:[1]        // an array of slide positions (starting at 1 to not duplicate)
    },
    static: {
      demoTitle: "slidemerge demo - www.mcpher.com", // any variables here can be substituted in the body of the template
      appVersion: "alpha v0.1",
      appIcon: "https://storage.googleapis.com/effex-console-static/bundle/src/img/exn64.png"
    }
  };
}



// first set up the parameters, then go
function runTest() {
  // get data parameters
  Server.start (localTest());

}
