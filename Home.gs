/**
* sets up all listeners
* @constructor Home
*/

var Home = (function (ns) {
  'use strict';

  // The initialize function must be run to activate elements
  ns.init = function (reason) {


    DomUtils.elem("createdeck")
    .addEventListener('click' , function () {
      Client.createDeck();
    });
    
  };
  
  return ns;
  
})(Home || {});
