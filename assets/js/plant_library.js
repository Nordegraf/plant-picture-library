var contentDiv = document.getElementById("plant-content");
// variables
$.getJSON("/plant-picture-library/data.json", function(plants) {
  console.log(plants);

  $(document).ready(function(){
    // add all plants to page
    var promises = [];
    $.each(plants, function(i, plant) {
      promises[i] = addPlant(i);
    })

    $.when.apply($, promises).done(function() {
      $(window).trigger("ready");
    });
  });
});

function addPlants(attr, value, plants) {
    // search through data for plants with attr
    // add them and wait for them to be added
    var promises = [];

    for (var i = 0; i < plants.length; i++) {
      if (plants[i][attr].includes(value)) {
        // check if hidden
        if (plants[i]["hide"]) {
          continue;
        }
        promises.push(addPlant(i));
      }
    }

    return promises;
}

function addPlant(id) {
  return $.get("/plant-picture-library/plants/"+id+".html", function(data) {
    $("#plant-content").append(data);
  }).promise();
}
