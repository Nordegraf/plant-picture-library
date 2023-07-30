---
---

var contentDiv = document.getElementById("plant-content");
var numPerPage = 24;
var pageNum = 0;

// variables
$.getJSON("{{ "/data.json" | relative_url }}", function(plants) {

  plants.sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });

  addPage(pageNum, plants);

  // hide load more button if there are no more plants
  if (plants.length <= numPerPage*(pageNum+1)) {
    $("#load-more").hide();
  }

  // add pages when buttons are clicked
  $('#load-more').on("click", function() {
    pageNum++;
    addPage(pageNum, plants);

    if (plants.length <= numPerPage*(pageNum+1)) {
      $("#load-more").hide();
    }
  });

  $(document).trigger("ready");
});

function addPage(pageNum, plants) {
  // add page to contentDiv
  var promises = [];
  var startIndex = pageNum*numPerPage;
  var endIndex = (pageNum+1)*numPerPage;

  if (endIndex > plants.length) {
    endIndex = plants.length - 1;
  }

  for (var i = startIndex; i < endIndex; i++) {
    plantID = plants[i].id;
    promises[i - startIndex] = addPlant(plantID);
  }

  $.when.apply($, promises).done(function() {
    $grid.isotope('reloadItems').isotope();
  });
}

function addPlants(attr, value, plants) {
    // search through data for plants with attr
    // add them and wait for them to be added
    var promises = [];

    for (var i = 0; i < plants.length; i++) {
      if (plants[i][attr].includes(value)) {
        promises.push(addPlant(i));
      }
    }

    return promises;
}

function addPlant(id) {
  return $.get("{{ site.baseurl }}/plants/"+id+".html", function(data) {
    $("#plant-content").append(data);
  }).promise();
}
