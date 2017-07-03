/*!
 *
 *  Web Starter Kit
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */
/* eslint-env browser */
(function() {
  'use strict';

  // Check to make sure service workers are supported in the current browser,
  // and that the current page is accessed from a secure origin. Using a
  // service worker from an insecure origin will trigger JS console errors. See
  // http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features
  var isLocalhost = Boolean(window.location.hostname === 'localhost' ||
      // [::1] is the IPv6 localhost address.
      window.location.hostname === '[::1]' ||
      // 127.0.0.1/8 is considered localhost for IPv4.
      window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      )
    );

  if ('serviceWorker' in navigator &&
      (window.location.protocol === 'https:' || isLocalhost)) {
    navigator.serviceWorker.register('service-worker.js')
    .then(function(registration) {
      // updatefound is fired if service-worker.js changes.
      registration.onupdatefound = function() {
        // updatefound is also fired the very first time the SW is installed,
        // and there's no need to prompt for a reload at that point.
        // So check here to see if the page is already controlled,
        // i.e. whether there's an existing service worker.
        if (navigator.serviceWorker.controller) {
          // The updatefound event implies that registration.installing is set:
          // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
          var installingWorker = registration.installing;

          installingWorker.onstatechange = function() {
            switch (installingWorker.state) {
              case 'installed':
                // At this point, the old content will have been purged and the
                // fresh content will have been added to the cache.
                // It's the perfect time to display a "New content is
                // available; please refresh." message in the page's interface.
                break;

              case 'redundant':
                throw new Error('The installing ' +
                                'service worker became redundant.');

              default:
                // Ignore
            }
          };
        }
      };
    }).catch(function(e) {
      console.error('Error during service worker registration:', e);
    });
  }

  /**
   * CUSTOM JAVASCRIPT STARTS HERE
   */

  var margin = { top: 50, left: 50, right: 50, bottom: 50 },
   height = 500 - margin.top - margin.bottom,
    width = 1028 - margin.left - margin.right;

  var svg = d3.select('#world')
    .append("svg")
    .attr("height", height + margin.top + margin.bottom)
    .attr("width", width + margin.left + margin.right)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  var mapDetails = d3.select("body").append("div")
    .attr("class", "map-details")
    .style("opacity", 0);

  /*
  Read in the world.topojson map
  Read in capitals.csv
  Read in authors.csv
   */

  d3.queue()
    .defer(d3.json, "scripts/world.json")
    .defer(d3.csv, "scripts/feminists.csv")
    .await(ready)


  /*
  Create a new projections using Mercator (geoMercator)
  and center it (translate) projections is what we use to convert globe lat/long to x/y coordinates
  and zoom in a certain amount (scale)
   */

  var projection = d3.geoMercator()
    .translate([width / 2, height / 2 ])



  /*
  create a path (geoPath) using the projection
   */
  var path = d3.geoPath()
    .projection(projection)

    //Add different scales .scale(100)

  function ready (error, data, feminists) {

    console.log(data);

    /*
    topojson.feature converts our RAW geo data into USEABLE geo data
    always pass it data, then data.objects.__something____ then get .features out of it
     */

    var countries = topojson.feature(data, data.objects.countries).features

    /*
    Add a path for each country
    Shapes -> path
     */

    svg.selectAll(".country")
      .data(countries)
      .enter().append("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", "#1E9244")
      .on('mouseover', function (d) {
        // add the class 'selected'
        d3.select(this).classed("selected", true)
      })
      .on('mouseout', function (d) {
        //remove the class 'selected'
        d3.select(this).classed("selected", false)
      })



    /*
    Add the author locations
    get the x/y from the lat/long + projections
     */

    console.log(feminists)

    var aCircles = svg.selectAll(".author-birth-place")
      .data(feminists)
      .enter().append("circle")


    var authorCircles = aCircles.attr("r", 3)


      .attr("cx", function(d) { return  projection([d.birthLong, d.birthLat])[0]})
      .attr("cy", function(d) { return  projection([d.birthLong, d.birthLat])[1]})


      .on("mouseover", function(d) {showToolTips(d, "author")})
      .on("mouseout", function(d) {hideToolTips(d)})
      .on("click", function(d) { })


    /*
    Add Publisher locations markers
     */
    var pCircles = svg.selectAll(".book-publisher")
      .data(feminists)
      .enter().append("circle");

    /*
      Format the publisher location markers
     */
    var publisherCircles = pCircles.attr("r", 3)
      .attr("fill", "red")


      .attr("cx", function(d) {return projection([d.pubLong, d.pubLat])[0]})
      .attr("cy", function(d) {return projection([d.pubLong, d.pubLat])[1]})

    /*
      event listeners for the  publisher markers
     */
      publisherCircles.on("mouseover", function(d){ showToolTips(d, "publisher")})
      publisherCircles.on("mouseout", function(d){ hideToolTips(d)})
      publisherCircles.on("click", function(d) {

        var pubXY= projection([d.pubLong, d.pubLat])
        var authXY = projection([d.birthLong, d.birthLat])
        var linePath = createLine(pubXY[0],pubXY[1],authXY[0],authXY[1])
        var pathTotalLength = linePath.node().getTotalLength();

        linePath.attr("stroke-dasharray", pathTotalLength + " " + pathTotalLength)
          .attr("stroke-dashoffset", pathTotalLength)
          .transition()
          .duration(3000)
          .ease(d3.easeCubic)
          .attr("stroke-dashoffset", 0)
          .attr("stroke-width", "2");

      })

  }


  /***************************************************************
   * Helper Functions
   ***************************************************************/


/*
  showToolTips: evaluates the type of marker, then formats the tool tip accordingly
  @param: d - the data
  @param: toolType - the type of marker being used. it will be either 'author' or 'publisher'
 */
  function showToolTips(d, toolType) {
     var title, city, country;

    div.transition()
      .duration(200)
      .style("opacity", .9)

    switch(toolType){
      case  "publisher":
        title = d.publisher
        city = d.pubCity
        country = d.pubCountry
        break;
      case "author":
        title = d.firstName + " " + d.lastName
        city = d.birthCity
        country = d.birthCountry
        break;
    }
    div.html(title + "<br />" + city + "," + country)
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY - 28) + "px");
  }
/*
hideToolTips: uses a transition to hide the tooltip
@param: d - not used, but carries the data for the markers
 */
  function hideToolTips(d) {
    div.transition()
      .duration(500)
      .style("opacity", 0)
    }

  /*
  createLine: uses the origin and destination xy coordinates to create an invisible line (path), and
  @param: x1, y1 - xy coordinates for the original marker
  @param: x2, y2 - xy coordinates for the destination marker
   */

  function createLine( x1, y1, x2, y2){
    var pathString = "M"+x1+" "+y1+" "+"L"+" "+x2+" "+y2
    var simpleLine = svg.append("path")
      .attr("d", pathString )
      .attr("stroke", "white")
      .attr("stroke-width", "0")
      .attr("fill", "none");


    return simpleLine
}




  /**
     * CUSTOM JAVASCRIPT ENDS HERE
     */
})();
