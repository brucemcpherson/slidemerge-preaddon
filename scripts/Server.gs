/**
* used to expose memebers of a namespace
* @param {string} namespace name
* @param {method} method name
*/
function exposeRun(namespace, method, argArray) {
  
  var func = namespace ? this[namespace][method] : this[method];
  if (argArray && argArray.length) {
    return func.apply(this, argArray);
  } else {
    return func();
  }
}



var Server = (function(ns) {
  
  ns.settings = {

  };


  // entry point
  ns.start = function (params) {
  
    // get data parameters
    ns.settings.params = params;

    // open eveything
    ns.getEverything();
  
    // generate the dup requests
    // returns [ each row [each slide] ]
    ns.createDupRequests();

    // copy files 
    ns.createFiles();
  
    // now apply subs
    ns.applySubs();
  
    // now apply   
    ns.execute ();
  
  };
  
  // ready to go
  ns.execute = function () {
  
    return Server.settings.package.copies.map (function (d,i) {
      return Slides.Presentations.batchUpdate({'requests': ns.settings.package.reqs[i]}, d.getId());
    });
    

  };
  
  // enhance duprequests with text subs
  ns.applySubs = function () {
    
   
    if (ns.settings.params.options.type === "multiple") {
      return applySubsMulti();
    }
    
    // this is the single version which is a lot more complicated
    var dr = ns.settings.package.dupRequests;
    var fiddler = ns.settings.package.fiddler;
    var headers = fiddler.getHeaders();
    
    // this is the sheet data
    var data = ns.settings.package.fiddler.getData();
    
    // this'll be used to put them in the correct position later
    var insertions = [], masters = [];
    
    ns.settings.package.reqs = data.map  (function (d,i) {
      
      // duplicate all slides in template & move to correct position
      var p = dr[i].reduce (function (t,c,j) {
        t.push ( {duplicateObject:c});
        
        // and do this later on once all the slides have been created
        // because dup puts them in a daft order
        insertions.push  ({
          updateSlidesPosition:{
            slideObjectIds : [c.objectIds[c.objectId]],
            insertionIndex: dr[i].length * i + j 
          }});
        
        // and we'll not need to be duplicating masters, except for the first one
        if (i && ns.settings.params.options.masters.indexOf(j+1) !== -1) {
          masters.push ({
            deleteObject:{
              objectId : c.objectIds[c.objectId]
            }});
        }
        
        return t;
      },[]);
      
      // common to all
      var pobs =  dr[i].map (function (e) {
        return e.objectIds[e.objectId];
      });
      
      // global subs
      Object.keys(ns.settings.params.static).forEach (function (h) {
        var s = ns.settings.params.static[h];
        // image sub
        imageSub (p ,  s, h ,pobs);
        
        // text subs
        textSub (p , s , h ,pobs);
      });
        
      
      // substitute values from data
      headers.forEach (function (h) {

        var  s = d[h].toString();
        
        // image substitutions
        imageSub (p , s , h ,pobs);
        
        // text substitutions
        textSub (p , s , h ,pobs);
        
      });
      return p;
    });
    

    // delete the original templates
    var dels = ns.settings.package.objectIds.map(function(e) {
      return {
        deleteObject: {
          objectId:e
        }
      } 
    });
    Array.prototype.push.apply (ns.settings.package.reqs, dels);

    // sort
    Array.prototype.push.apply (ns.settings.package.reqs, insertions);
    
    // delete any masters that dont need to be duplicated
    Array.prototype.push.apply (ns.settings.package.reqs, masters);

    // wrap in array to be compat with multi
    ns.settings.package.reqs =[ns.settings.package.reqs];
    
  };
  
  // for when we're creating multiple files.
  function applySubsMulti () {
    
    
    var dr = ns.settings.package.dupRequests;
    var fiddler = ns.settings.package.fiddler;
    var headers = fiddler.getHeaders();
    
    // this is the sheet data
    var data = ns.settings.package.fiddler.getData();
    
    // need a set of reqs for each file
    ns.settings.package.reqs = data.map(function (d,i) {

      var p = [];
      // common to all
      var pobs =  dr[i].map (function (e) {
        return e.objectId;
      });
      
      // global subs
      Object.keys(ns.settings.params.static).forEach (function (h) {
        var s = ns.settings.params.static[h];
        // image sub
        imageSub (p ,  s, h ,pobs);
        
        // text subs
        textSub (p , s , h ,pobs);
      });
      
      // substitute values from data
      headers.forEach (function (h) {
        
        var  s = d[h].toString();
        
        // image substitutions
        imageSub (p , s , h ,pobs);
        
        // text substitutions
        textSub (p , s , h ,pobs);
        
      });
      return p;
      
      
    });  
    
  };
  
  
  // substitute global values
  function imageSub (reqs , text , field, pobs) {
    
    // image subs
    if (text.slice(0,4) === "http") {
      reqs.push ({ replaceAllShapesWithImage:{
        imageUrl:text,
        replaceMethod: 'CENTER_INSIDE',
        pageObjectIds:pobs,
        containsText:{
          text:"{{{" + field + "}}}",
          matchCase:true
        }
      }});
    }
    return reqs;
  }
  
  function textSub (reqs , text , field , pobs) {
    
    // text substitution
    reqs.push ({ replaceAllText:{
      replaceText:text,
      pageObjectIds:pobs,
      containsText:{
        text:"{{" + field + "}}",
        matchCase:true
      }
    }});
  }
  
  //
  // create the new files
  //
  ns.createFiles = function () {
    
    var sx = ns.settings.package;
    var so = ns.settings.params.options;
    var sp = ns.settings.params;
    
    // if its a single type, we only need to create one file
    if (so.type === "single") {
      sx.copies = [sx.templateFile.makeCopy(sp.presoName, sx.presoFolder)];
    }
    else if (so.type === "multiple") {
      sx.copies = sx.fiddler.getData().map (function(d,sindex) {
        var n =  (sp.presoName + "-" + (so.suffixHeading ? row[so.suffixHeading] : sindex + (so.startRow || 1)));
        return sx.templateFile.makeCopy(n, sx.presoFolder)
      });
    }
    else {
      throw 'unknown type ' + so.type;
    }

  };
  
  //
  // the dup requests contain a batch request to duplicate - one for every row in the data
  // 
  ns.createDupRequests = function () {
    
    var sk = ns.settings.package;
   
    sk.dupRequests = sk.fiddler.getData().map(function (d,i) {
      return  sk.objectIds.map (function (e) {
        var eid = {};
        eid[e] = e + "_row_" + i;
        return  { 
          objectId: e,
          objectIds: eid
        };
      });
    });
  };
  
  /**
  * create a data package of everything we'll need to make this happen
  */
  ns.getEverything = function() {
    
    // open the sheet
    var st = ns.settings;
    var sp = st.params;  
  
    var ss = SpreadsheetApp.openById(sp.sheetId);
    if (!ss) throw "could not open spreadsheet " + sp.sheetId;

    var sheet = ss.getSheetByName(sp.sheetName);
    if (!sheet) throw "could not open spreadsheet " + sp.sheetName;

    // get the sheet data and filter out what we don't need
    var fiddler = new Fiddler()
    .setValues(sheet.getDataRange().getValues())
    .filterRows (function ( row, properties) {
      var rn = properties.rowOffset +1;
      return (!sp.options.startRow || rn  >= sp.options.startRow ) && (!sp.options.finishRow || rn <= sp.options.finishRow) ;
    });
    
    // get the template
    var template = DriveApp.getFileById(sp.template);
    if (!template) throw "could not open slides template " + sp.template;

    // and the folder - we'll duplicate the slide to there
    var folder = ns.getDriveFolderFromPath(sp.presoFolder);
    if (!folder) throw "could not open/create output folder " + sp.presoFolder;

    // and the deck
    var deck = Slides.Presentations.get(template.getId());
    if (!deck) throw "could not get slides";
   
    // and we're good to go
    st.package = {
      presoFolder: folder,
      fiddler: fiddler,
      sheet: sheet,
      ss: ss,
      templateFile: template,
      deck:deck,
      objectIds:getObjectIds(deck)
    };
    
    
  };


  /** 
  * this one will find all the objectids in a deck
  */
  function getObjectIds (preso) {
    
    // find the objectIds of interest on each slide
    return preso.slides.map(function(s) {
      return s.objectId;
    });
    
  }
  
  /**
   * server side util to find folder from path
   */
  ns.getDriveFolderFromPath = function (path) {
    return (path || "/").split("/").reduce ( function(prev,current) {
      if (prev && current) {
        var fldrs = prev.getFoldersByName(current);
        return fldrs.hasNext() ? fldrs.next() : null;
      }
      else { 
        return current ? null : prev; 
      }
    },DriveApp.getRootFolder()); 
}


  return ns;
})(Server || {});
