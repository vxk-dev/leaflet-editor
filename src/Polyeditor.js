if (L.PolyEditHandler) {

  var _actionType = {
    ADDVERTEX: 0,
    DELVERTEX: 1,
    MODVERTEX: 2,
    ADDPOLY: 3,
    DELPOLY: 4
  };

  L.PolyEditor = L.Class.extend({

    actionType: _actionType,

    initialize: function(map, options) {
      this._map = map;
      this._group = L.featureGroup();
      this._history = [];
      this._polyedit = new L.PolyEditHandler(map);
      this._polyedit.history = this._history;
      this._editedpoly = null;

      this._group.on('click', function(evt) {
        if(this._editedpoly !== null) {
          this._polyedit.removeHooks();
          this._removeHandlers(evt.layer);
        }
        if(this._editedpoly === evt.layer) {
          this._editedpoly = null;  // and over, disabling editing
        } else {
          this._editedpoly = evt.layer;
          this._polyedit.addHooks(evt.layer);

          this._addHandlers(evt.layer);
        }
      }, this);
    },

    _addHandlers: function(poly) {
      poly.on('middle:marker:dragstart', function(e) {
        this.origMarkerPos = e.marker._latlng;
      }, this);
      poly.on('middle:marker:dragend', function(e) {
        this.onAddPoint(e);
      }, this);
      poly.on('point:marker:click', function(e) {
        if(this._polyedit.removePoint(e.marker)) {
          this.onDelPoint(e);
        }
      }, this);
      poly.on('point:marker:dragstart', function(e) {
        this.origMarkerPos = e.marker._latlng;
      }, this);
      poly.on('point:marker:dragend', function(e) {
        this.onModPoint(e);
      }, this);
    },

    _removeHandlers: function(poly) {
      poly.off('middle:marker:dragstart');
      poly.off('middle:marker:dragend');
      poly.off('point:marker:click');
      poly.off('point:marker:dragstart');
      poly.off('point:marker:dragend');
    },

    addFeatures: function(features) {
      for(var l in features._layers) {
        this._group.addLayer(features._layers[l]);
      }
    },

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

    undo: function() {
      if(this._history.length === 0) { return; }

      var lastChange = this._history.pop();
      var poly = lastChange[1];

      switch(lastChange[0]) {
      case _actionType.ADDVERTEX:
        poly._latlngs.splice(poly._latlngs.indexOf(lastChange[2]), 1);
        break;
      case _actionType.DELVERTEX:
        poly._latlngs.splice(lastChange[2], 0, lastChange[3]);
        break;
      case _actionType.MODVERTEX:
        lastChange[3].lat = lastChange[2].lat;
        lastChange[3].lng = lastChange[2].lng;
        break;
      case _actionType.ADDPOLY:
        break;
      case _actionType.DELPOLY:
        break;
      }

      poly.redraw();
    },

  }); // End L.Edit.Topology

} else {
  throw "Error: L.PolyEditHandler required";
}
