let map;
let drawn_shape;
let infoWindow;
let free_polygon;
const side_bar_out = false;
const earthRadius = 6378137.0;
let markers = [];
const apiUrl = 'http://localhost:3000/api';

let locations = [];

function getLocations() {
  $.get(
    `${apiUrl}/get`,
    response => {
      if (response.success) {
        locations = response.data;
      }
    }
  );
}

function submit() {
  if (!$('#name').val()) {
    alert('Please input the name!');
    return;
  }
  if (!$('#latitude').val()) {
    alert('Please input a latitude!');
    return;
  }
  if (!$('#longitude').val()) {
    alert('Please input a longitude!');
    return;
  }
  if (!$('#telephone').val()) {
    alert('Please input the telephone!');
    return;
  }
  if (!$('#address').val()) {
    alert('Please input the address!');
    return;
  }

  const payload = {
    name: $('#name').val(),
    latitude: $('#latitude').val(),
    longitude: $('#longitude').val(),
    telephone: $('#telephone').val(),
    address: $('#address').val()
  }

  $.post(
    `${apiUrl}/post`,
    payload,
    response => {
      if (response.success) {
        initMap();
      }
    }
  );

}

//Displays map
function initMap() {
  $.get(
    `${apiUrl}/get`,
    response => {
      if (response.success) {
        const autocomplete = new google.maps.places.Autocomplete($('#address')[0], {});

        google.maps.event.addListener(autocomplete, 'place_changed', function() {
          const place = autocomplete.getPlace();
          $('#latitude').val(place.geometry.location.lat());
          $('#longitude').val(place.geometry.location.lng());
        });
        locations = response.data;
        map = create_map(new google.maps.LatLng(-33, 151));
        map.addListener('tilesloaded', function() {});


        //create drawing manager at top center
        const drawingManager = create_draw_manager();
        drawingManager.setMap(map);

        // Create the search box and link it to the UI element.
        var input = document.getElementById('autocomplete');
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

        //infowindow for the markers
        infoWindow = new google.maps.InfoWindow();

        //Listens for any drawing events with circle rectangle or polygon
        google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event){
          if(drawn_shape != null){
            drawn_shape.overlay.setMap(null);
            drawn_shape = null;
          }
          else if(free_polygon != null){
            free_polygon.setMap(null);
            free_polygon = null;
          }
          drawn_shape = event;
          drawingManager.setDrawingMode(null);
          let availableCount = 0;
          for(let i = 0; i < locations.length; i++) {
            const isContain = drawn_shape.overlay.getBounds().contains(new google.maps.LatLng(locations[i].latitude, locations[i].longitude));
            if (isContain) {
              availableCount++;
              markers[i].setVisible(true);
            } else {
              markers[i].setVisible(false);
            }
          }
          alert('There are ' + availableCount + ' locations in selected area.');
          //trigger a places changed event
        });

        //creates custom control of free hand drawing on drawing manager
        create_free_button();
        drawMarker(map, infoWindow)

        //creates prototype for free drawing
        google.maps.Polygon.prototype.douglasPeucker = function(tolerance){
          var res = null;
          //adjust tolerance depending on the zoom level
          tolerance = tolerance * Math.pow(2, 20 - map.getZoom());
          if(this.getPath() && this.getPath().getLength()){
            var points = this.getPath().getArray();
            var Line = function(p1, p2){
              this.p1 = p1;
              this.p2 = p2;

              this.distanceToPoint = function(point){
                //calculate slope
                var m = (this.p2.lat() - this.p1.lat()) / (this.p2.lng() - this.p1.lng());
                var b = this.p1.lat() - (m * this.p1.lng()), d = [];
                // distance to the linear equation
                d.push(Math.abs(point.lat() - (m * point.lng()) - b) / Math.sqrt(Math.pow(m, 2) + 1));
                // distance to p1
                d.push(Math.sqrt(Math.pow((point.lng() - this.p1.lng()), 2) + Math.pow((point.lat() - this.p1.lat()), 2)));
                // distance to p2
                d.push(Math.sqrt(Math.pow((point.lng() - this.p2.lng()), 2) + Math.pow((point.lat() - this.p2.lat()), 2)));
                // return the smallest distance
                return d.sort(function(a, b){
                  return (a - b); //causes an array to be sorted numerically and ascending
                })[0];
              };
            };

            var douglasPeucker = function(points, tolerance){
              if(points.length <= 2) return [points[0]];
              var returnPoints = [],
                // make line from start to end
                line = new Line(points[0], points[points.length - 1]),
                // find the largest distance from intermediate poitns to this line
                maxDistance = 0,
                maxDistanceIndex = 0,
                p;
              for(var i = 1; i <= points.length - 2; i++){
                var distance = line.distanceToPoint(points[i]);
                if(distance > maxDistance){
                  maxDistance = distance;
                  maxDistanceIndex = i;
                }
              }
              // check if the max distance is greater than our tollerance allows
              if(maxDistance >= tolerance){
                p = points[maxDistanceIndex];
                line.distanceToPoint(p, true);
                // include this point in the output
                returnPoints = returnPoints.concat(douglasPeucker(points.slice(0, maxDistanceIndex + 1), tolerance));
                // returnPoints.push( points[maxDistanceIndex] );
                returnPoints = returnPoints.concat(douglasPeucker(points.slice(maxDistanceIndex, points.length), tolerance));
              } else {
                // ditching this point
                p = points[maxDistanceIndex];
                line.distanceToPoint(p, true);
                returnPoints = [points[0]];
              }
              return returnPoints;
            };
            res = douglasPeucker(points, tolerance);
            // always have to push the very last point on so it doesn't get left off
            res.push(points[points.length - 1]);
            this.setPath(res);
          }
          return this;
        };
      }
    }
  );
}

/********************Map Creator*******************/
function create_map(center){
  return new google.maps.Map(document.getElementById('map'),{
    center: center,
    zoom:10,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER
    },
    streetViewControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER
    }
  });
}

/********************Draw Mark*******************/
function drawMarker(map, infoWindow) {
  for (let i = 0; i < locations.length; i++) {
    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(locations[i].latitude, locations[i].longitude),
      map: map
    });

    google.maps.event.addListener(marker, 'click', (function (marker, i) {
      return function () {
        const content = `
          <h4>Name: ${locations[i].name}</h4>
          <h4>Telephone: ${locations[i].telephone}</h4>
          <h4>Address: ${locations[i].address}</h4>
        `;
        infoWindow.setContent(content);
        infoWindow.open(map, marker);
      }
    })(marker, i));

    markers.push(marker);
  }
}

/********************FREE BUTTON*******************/
function create_free_button(){
  var customControlDiv = document.createElement('div');
  CustomControl(customControlDiv, map);
  customControlDiv.index = 1;
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(customControlDiv);
}

//CustomControl for the free hand drawer
function CustomControl(controlDiv, map) {
  // Set CSS for the control border
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = '#ffffff';
  controlUI.style.borderStyle = 'solid';
  controlUI.style.borderWidth = '1px';
  controlUI.style.borderColor = '#ccc';
  controlUI.style.height = '25px';
  controlUI.style.marginTop = '4px';
  controlUI.style.marginLeft = '-6px';
  controlUI.style.paddingTop = '1px';
  controlUI.style.cursor = 'pointer';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'Click to set the map to Home';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior
  var controlText = document.createElement('div');
  controlText.style.fontFamily = 'Arial,sans-serif';
  controlText.style.fontSize = '11px';
  controlText.style.paddingLeft = '4px';
  controlText.style.paddingRight = '4px';
  controlText.style.marginTop = '4px';
  controlText.style.fontWeight = 'bold';
  controlText.innerHTML = 'Draw area';
  controlUI.appendChild(controlText);

  let controlSearchUI = document.createElement('div');
  controlSearchUI.style.backgroundColor = '#ffffff';
  controlSearchUI.style.borderStyle = 'solid';
  controlSearchUI.style.borderWidth = '1px';
  controlSearchUI.style.borderColor = '#ccc';
  controlSearchUI.style.height = '25px';
  controlSearchUI.style.marginTop = '4px';
  controlSearchUI.style.marginLeft = '-6px';
  controlSearchUI.style.paddingTop = '1px';
  controlSearchUI.style.cursor = 'pointer';
  controlSearchUI.style.textAlign = 'center';
  controlSearchUI.title = 'Search in this area';
  controlDiv.appendChild(controlSearchUI);

  // Set CSS for the control interior
  let controlSearchText = document.createElement('div');
  controlSearchText.style.fontFamily = 'Arial,sans-serif';
  controlSearchText.style.fontSize = '11px';
  controlSearchText.style.paddingLeft = '4px';
  controlSearchText.style.paddingRight = '4px';
  controlSearchText.style.marginTop = '4px';
  controlSearchText.style.fontWeight = 'bold';
  controlSearchText.innerHTML = 'Search in this area';
  controlSearchUI.appendChild(controlSearchText);

  // Setup the click event listeners
  google.maps.event.addDomListener(controlUI, 'click', function () {
    //Free Drawing Listener
    var overlay = new google.maps.OverlayView();
    overlay.draw = function () {};
    overlay.setMap(map);
    var isDrawing = false;
    var polyLine;
    var polygon_array = Array();
    var overlay;
    map.setOptions({draggable: false});
    //listener for mouse down
    google.maps.event.addListenerOnce(map, 'mousedown', function () {
      // for(let i = 0; i < locations.length; i++) {
      //   markers[i].setVisible(true);
      // }
      overlay = new google.maps.OverlayView();
      overlay.draw = function () {};
      overlay.setMap(map);
      isDrawing=true;
      polyLine = new google.maps.Polyline({
        strokeColor: "#1c3452",
        strokeOpacity: 0.8,
        map: map,
        clickable: false
      });
      $("#map").mousemove(function (e) {
        if(isDrawing == true)
        {
          var pageX = e.pageX;
          var pageY = e.pageY;
          if(side_bar_out) pageX -= 300;
          var point = new google.maps.Point(parseInt(pageX), parseInt(pageY));

          var latLng = overlay.getProjection().fromContainerPixelToLatLng(point);

          polyLine.getPath().push(latLng);

          latLng = String(latLng);
          latLng=latLng.replace("(","");
          latLng=latLng.replace(")","");

          var array_lng =  latLng.split(',');
          polygon_array.push(new google.maps.LatLng(array_lng[0],array_lng[1])) ;
        }
      });

    });
    //listener for mouse up
    var map_listener = google.maps.event.addListenerOnce(map, 'mouseup', function () {
      isDrawing=false;
      //console.log(polygon_array);
      if(free_polygon != null){
        free_polygon.setMap(null);
        free_polygon = null;
      }
      else if(drawn_shape != null){
        drawn_shape.overlay.setMap(null);
        drawn_shape = null;
      }
      free_polygon = new google.maps.Polygon({
        paths: polygon_array,
        strokeColor: "#1c3452",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#1c3452",
        fillOpacity: 0.35,
        editable:false,
        clickable: false,
        geodesic: false
      });

      //simplify polygon
      free_polygon.douglasPeucker(360.0 / (2.0 * Math.PI * earthRadius));

      polygon_array=Array();
      free_polygon.setMap(map);
      let availableCount = 0;
      for(let i = 0; i < locations.length; i++) {
        const isContain = google.maps.geometry.poly.containsLocation(
          new google.maps.LatLng(locations[i].latitude, locations[i].longitude),
          free_polygon
        );
        if (isContain) {
          availableCount++;
          markers[i].setVisible(true);
        } else {
          markers[i].setVisible(false);
        }
      }
      alert('There are ' + availableCount + ' locations in selected area.');
      if(polyLine != null) polyLine.setMap(null);
      map.setOptions({draggable: true});
    });
  });


  google.maps.event.addDomListener(controlSearchUI, 'click', function () {
    if (free_polygon) {
      free_polygon.setMap(null);
    }
    var bounds = map.getBounds();
    let availableCount = 0;
    for(let i = 0; i < locations.length; i++) {
      const isContain = bounds.contains(new google.maps.LatLng(locations[i].latitude, locations[i].longitude));
      if (isContain) {
        availableCount++;
        markers[i].setVisible(true);
      } else {
        markers[i].setVisible(false);
      }
    }
    alert('There are ' + availableCount + ' locations in selected area.');
  });
}

/********************Drawing Manager*******************/
function create_draw_manager(){
  drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.CIRCLE,
        google.maps.drawing.OverlayType.RECTANGLE
      ]
    },
    circleOptions: {
      fillColor: '#1c3452',
      fillOpacity: .2,
      strokeWeight: .1,
      clickable: true,
      editable: false,
      zIndex: 1
    },
    rectangleOptions:{
      fillColor: '#1c3452',
      fillOpacity: .2,
      strokeWeight: .1,
      clickable: true,
      editable: false,
      zIndex: 1
    }
  });
  return drawingManager;
}
