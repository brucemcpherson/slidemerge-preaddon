
var Client = (function (ns) {
 
  ns.init = function () {
    resetCursor();
  };
  
  ns.createDeck = function () {
    spinCursor();
    var du = DomUtils.elem;
   
    Provoke.run ("Server", "generateSlides",du('alias').value,du('readerkey').value,du('templateid').value,du('presoname').value)
    .then (function (result) {
      var url ="https://docs.google.com/presentation/d/" + result.presentationId + "/edit";
      App.showNotification ("Your deck", '<a href="'+url+'" target="_blank">is here</a>');
      resetCursor();
    })
    ['catch'] (function (err) {
      resetCursor();
      App.showNotification ("creating deck" , err);
    });
  }
  
  function resetCursor() {
    DomUtils.hide ('spinner',true);
  }
  function spinCursor() {
    DomUtils.hide ('spinner',false);
  }
  
  return ns;
})(Client || {});