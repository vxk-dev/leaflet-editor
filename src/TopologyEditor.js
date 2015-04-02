if (L.PolyEditor) {

  L.TopologyEditor = L.PolyEditor.extend({

    onAddPoint: function(e) {
      this._history.push([
        _actionType.MODVERTEX, e.target,
        this.origMarkerPos, e.marker._latlng
      ]);
    },

    onDelPoint: function(e) {
      this._history.push([
        _actionType.DELVERTEX, e.target, e.marker._index, e.marker._latlng
      ]);
    },

    onModPoint: function(e) {
      this._history.push([
        _actionType.MODVERTEX, e.target,
        this.origMarkerPos, e.marker._latlng
      ]);
    },
    //
    // findTwins: function(point) {
    //   Object.keys(this._poly._map._layers).forEach(function(x, y) {
    //     if (this._poly._map._layers[d]._origLatLng && this._poly._map._layers[x]._origLatLng && this._poly._map._layers[d]._origLatLng.lat === this._poly._map._layers[x]._origLatLng.lat && this._poly._map._layers[d]._origLatLng.lng === this._poly._map._layers[x]._origLatLng.lng) {
    //       if (this._poly._map._layers[d]._leaflet_id !== this._poly._map._layers[x]._leaflet_id) {
    //         if (!this._poly._map._layers[d]._twinMarkers) {
    //           this._poly._map._layers[d]._twinMarkers = [];
    //         }
    //         if (this._poly._map._layers[d]._twinMarkers.indexOf(this._poly._map._layers[x]) < 0) {
    //           this._poly._map._layers[d]._twinMarkers.push(this._poly._map._layers[x]);
    //         }
    //
    //         if (!this._poly._map._layers[x]._twinMarkers) {
    //           this._poly._map._layers[x]._twinMarkers = [];
    //         }
    //         if (this._poly._map._layers[x]._twinMarkers.indexOf(this._poly._map._layers[d]) < 0) {
    //           this._poly._map._layers[x]._twinMarkers.push(this._poly._map._layers[d]);
    //         }
    //       }
    //     }
    // },

    // getNeighbourPolygons: function() {
    //   var par, i, neighbours = [];
    //   for(i=0; i<this._group.layers.length; i++) {
    //     par = this._group.layers[i];
    //   }
    // }

  }); // End L.Edit.Topology

} else {
  throw "Error: leaflet.draw.topology requires Leaflet.Draw and Leaflet.Snap";
}
