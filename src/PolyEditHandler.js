L.Edit = L.Edit || {};

/*
 * L.Edit.Poly is an editing handler for polylines and polygons.
 */

L.PolyEditHandler = L.Handler.extend({

  options: {
    icon: new L.DivIcon({
      iconSize: new L.Point(8, 8),
      className: 'leaflet-div-icon leaflet-editing-icon'
    }),
    touchIcon: new L.DivIcon({
      iconSize: new L.Point(20, 20),
      className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
    }),
  },

  initialize: function (map, options) {
    // if touch, switch to touch icon
    if (L.Browser.touch) {
      this.options.icon = this.options.touchIcon;
    }

    this._markerGroup = new L.LayerGroup();
    this._map = map;

    L.setOptions(this, options);
  },

  addHooks: function (poly) {
    this._poly = poly;

    if (!(poly instanceof L.Polygon)) {
      poly.options.editing.fill = false;
    }

    this.updateMarkers();
    this._map.addLayer(this._markerGroup);

    poly.setStyle(poly.options.editing);
  },

  removeHooks: function () {
    var poly = this._poly;

    poly.setStyle(poly.options.original);

    this._map.removeLayer(this._markerGroup);
    delete this._markers;
  },

  updateMarkers: function () {
    this._markerGroup.clearLayers();
    this._initMarkers();
  },

  _initMarkers: function () {
    this._markers = [];

    var latlngs = this._poly._latlngs,
      i, j, len, marker;

    // TODO refactor holes implementation in Polygon to support it here

    for (i = 0, len = latlngs.length; i < len; i++) {

      marker = this._createMarker(latlngs[i], i);
      this._initPointMarker(marker);
      this._markers.push(marker);
    }

    var markerLeft, markerRight;

    for (i = 0, j = len - 1; i < len; j = i++) {
      if (i === 0 && !(L.Polygon && (this._poly instanceof L.Polygon))) {
        continue;
      }

      markerLeft = this._markers[j];
      markerRight = this._markers[i];

      this._createMiddleMarker(markerLeft, markerRight);
      this._updatePrevNext(markerLeft, markerRight);
    }
  },

  _createMarker: function (latlng, index) {
    // Extending L.Marker in TouchEvents.js to include touch.
    var marker = new L.Marker(latlng, {
      draggable: true,
      icon: this.options.icon,
    });

    marker._origLatLng = latlng;
    marker._index = index;

    marker
      .on('drag', this._onMarkerDrag, this)
      .on('touchmove', this._onTouchMove, this);

    this._markerGroup.addLayer(marker);

    return marker;
  },

  _initPointMarker: function (marker) {

    function onDragEnd() {
      this._poly.fire('point:marker:dragend', {marker: marker});
    }

    function onDragStart() {
      this._poly.fire('point:marker:dragstart', {marker: marker});
    }

    function onMarkerClick() {
      this._poly.fire('point:marker:click', {marker: marker});
    }

    marker
      .on('dragstart', onDragStart, this)
      .on('dragend', onDragEnd, this)
      .on('touchend', onDragEnd, this)
      .on('click', onMarkerClick, this);
  },

  _removeMarker: function (marker) {
    var i = marker._index;

    this._markerGroup.removeLayer(marker);
    this._markers.splice(i, 1);
    this._poly.spliceLatLngs(i, 1);
    this._updateIndexes(i, -1);

    marker
      .off('drag', this._onMarkerDrag, this)
      .off('touchmove', this._onMarkerDrag, this)
      .off('click', this._onMarkerClick, this);
  },

  _onMarkerDrag: function (e) {
    var marker = e.target;

    L.extend(marker._origLatLng, marker._latlng);

    if (marker._middleLeft) {
      marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
    }
    if (marker._middleRight) {
      marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
    }

    this._poly.redraw();
  },

  removePoint: function (marker) {

    var minPoints = L.Polygon && (this._poly instanceof L.Polygon) ? 4 : 3;

    // If removing this point would create an invalid polyline/polygon don't remove
    if (this._poly._latlngs.length < minPoints) {
      return false;
    }

    // remove the marker
    this._removeMarker(marker);

    // update prev/next links of adjacent markers
    this._updatePrevNext(marker._prev, marker._next);

    // remove ghost markers near the removed marker
    if (marker._middleLeft) {
      this._markerGroup.removeLayer(marker._middleLeft);
    }
    if (marker._middleRight) {
      this._markerGroup.removeLayer(marker._middleRight);
    }

    // create a ghost marker in place of the removed one
    if (marker._prev && marker._next) {
      this._createMiddleMarker(marker._prev, marker._next);
    } else if (!marker._prev) {
      marker._next._middleLeft = null;
    } else if (!marker._next) {
      marker._prev._middleRight = null;
    }
    return true;
  },

  _onTouchMove: function (e) {

    var layerPoint = this._map.mouseEventToLayerPoint(e.originalEvent.touches[0]),
      latlng = this._map.layerPointToLatLng(layerPoint),
      marker = e.target;

    L.extend(marker._origLatLng, latlng);

    if (marker._middleLeft) {
      marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
    }
    if (marker._middleRight) {
      marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
    }

    this._poly.redraw();
    this.updateMarkers();
  },

  _updateIndexes: function (index, delta) {
    this._markerGroup.eachLayer(function (marker) {
      if (marker._index > index) {
        marker._index += delta;
      }
    });
  },

  _createMiddleMarker: function (marker1, marker2) {
    var latlng = this._getMiddleLatLng(marker1, marker2),
      marker = this._createMarker(latlng),
      onClick,
      onDragStart,
      onDragEnd;

    marker.setOpacity(0.6);

    marker1._middleRight = marker2._middleLeft = marker;

    onDragStart = function () {
      var i = marker2._index;

      marker._index = i;

      marker.off('click', onClick, this);

      latlng.lat = marker.getLatLng().lat;
      latlng.lng = marker.getLatLng().lng;
      this._poly.spliceLatLngs(i, 0, latlng);
      this._markers.splice(i, 0, marker);

      marker.setOpacity(1);

      this._updateIndexes(i, 1);
      marker2._index++;
      this._updatePrevNext(marker1, marker);
      this._updatePrevNext(marker, marker2);

      this._poly.fire('middle:marker:dragstart', {marker: marker});
    };

    onDragEnd = function () {
      marker.off('click', onClick, this);
      marker.off('dragstart', onDragStart, this);
      marker.off('dragend', onDragEnd, this);
      marker.off('touchmove', onDragStart, this);

      this._createMiddleMarker(marker1, marker);
      this._createMiddleMarker(marker, marker2);
      this._initPointMarker(marker);
      this._poly.fire('middle:marker:dragend', {marker: marker});
    };

    onClick = function () {
      onDragStart.call(this);
      onDragEnd.call(this);
    };

    marker
      .on('click', onClick, this)
      .on('dragstart', onDragStart, this)
      .on('dragend', onDragEnd, this)
      .on('touchmove', onDragStart, this);

    this._markerGroup.addLayer(marker);
  },

  _updatePrevNext: function (marker1, marker2) {
    if (marker1) {
      marker1._next = marker2;
    }
    if (marker2) {
      marker2._prev = marker1;
    }
  },

  _getMiddleLatLng: function (marker1, marker2) {
    var map = this._poly._map,
      p1 = map.project(marker1.getLatLng()),
      p2 = map.project(marker2.getLatLng());

    return map.unproject(p1._add(p2)._divideBy(2));
  }
});
