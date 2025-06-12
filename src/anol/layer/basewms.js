import AnolBaseLayer from '../layer.js';

/**
 * @ngdoc object
 * @name anol.layer.BaseWMS
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Image
 * @param {Object} options.olLayer.source Options for ol.source.ImageWMS
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */
class BaseWMS extends AnolBaseLayer {
    constructor(_options) {
        super(_options);
        this.CLASS_NAME = 'anol.layer.BaseWMS';
        this.OL_LAYER_CLASS = undefined;
        this.OL_SOURCE_CLASS = undefined;

        if (angular.isUndefined(_options)) {
            return;
        }

        const defaults = {};
        this.options = $.extend(true, {}, defaults, _options);

        this.wmsSourceLayers = anol.helper.stringSplit(this.olSourceOptions.params.LAYERS, ',');
        if (this.olLayerOptions.visible === false) {
            this.olSourceOptions.params.LAYERS = '';
        }
        this.visible = this.olLayerOptions.visible !== false;
    }

    isCombinable(other) {
        return angular.isDefined(other.anolGroup) || angular.isDefined(this.anolGroup) ?
            other.anolGroup === this.anolGroup && other.anolGroup.childrenAreCombinable() :
            this.isCombinableInGroup(other);
    }

    isCombinableInGroup(other) {
        var ownParams = angular.merge({}, this.olSourceOptions.params);
        delete ownParams.LAYERS;
        var otherParams = angular.merge({}, other.olSourceOptions.params);
        delete otherParams.LAYERS;

        return super.isCombinable(other) &&
            this.olSourceOptions.url === other.olSourceOptions.url &&
            !this.isBackground &&
            angular.equals(ownParams, otherParams) &&
            angular.equals(this.anolGroup, other.anolGroup) &&
            angular.isUndefined(this.options.opacity) && angular.isUndefined(other.options.opacity);
    }

    getCombinedLayer (other) {
        var olSource = this.olLayer.getSource();
        if (other.olLayerOptions.visible !== false) {
            var params = olSource.getParams();
            var layers = anol.helper.stringSplit(params.LAYERS, ',');
            layers = layers.concat(other.wmsSourceLayers);
            params.LAYERS = layers.join(',');
            olSource.updateParams(params);
        }
        olSource.get('anolLayers').push(other);
        this.olLayer.get('anolLayers').push(other);
        other.setOlLayer(this.olLayer)
        return this.olLayer;
    }

    removeOlLayer() {
        if (this.combined) {
            var olSource = this.olLayer.getSource();
            var anolLayers = olSource.get('anolLayers');
            var idx = anolLayers.indexOf(this);
            if (idx > -1) {
                anolLayers.splice(idx, 1);
            }
            olSource.set('anolLayers', anolLayers);
            this.olLayer.set('anolLayers', anolLayers.slice(0));

            // update layer params
            var layerParams = [];
            angular.forEach(anolLayers, function(layer) {
                if (layer.getVisible()) {
                    layerParams.push(layer.name);
                }
            })
            var params = olSource.getParams();
            params.LAYERS = layerParams.reverse().join(',');
            olSource.updateParams(params);
        }
    }
    getVisible() {
        if (this.combined) {
            return this.visible;
        }
        return this.olLayer.getVisible();
    }
    reOrderLayerParams(layers) {
        var olSource = this.olLayer.getSource();
        var layerParams = [];
        angular.forEach(layers, function (layer) {
            if (layer.getVisible()) {
                layerParams.push(layer.name);
            }
        })
        var params = olSource.getParams();
        params.LAYERS = layerParams.reverse().join(',');
        olSource.updateParams(params);
    }
    setVisible(visible) {
        if (visible === this.getVisible()) {
            return;
        }

        const insertLayerIdx = this.olLayer.get('anolLayers')
            .filter(l => l !== this && l.getVisible())
            .reduce((prev, next) => prev + next.wmsSourceLayers.length, 0);

        const source = this.olLayer.getSource();
        const params = source.getParams();

        let layers = anol.helper.stringSplit(params.LAYERS, ',').toReversed();
        if (!visible) {
            layers = anol.helper.excludeList(layers, this.wmsSourceLayers);
        } else {
            layers = anol.helper.concat(layers, this.wmsSourceLayers, insertLayerIdx);
        }
        params.LAYERS = layers.toReversed().join(',');
        source.updateParams(params);
        this.visible = visible;
        super.setVisible(layers.length > 0);
    }
    getLegendGraphicUrl() {
        var requestParams = {
            SERVICE: 'WMS',
            VERSION: '1.3.0',
            SLD_VERSION: '1.1.0',
            REQUEST: 'GetLegendGraphic',
            FORMAT: 'image/png',
            LAYER: this.wmsSourceLayers.join(',')
        };
        if (angular.isDefined(this.legend.version)) {
            requestParams.VERSION = this.legend.version;
        }
        if (angular.isDefined(this.legend.sldVersion)) {
            requestParams.SLD_VERSION = this.legend.sldVersion;
        }
        if (angular.isDefined(this.legend.format)) {
            requestParams.FORMAT = this.legend.format;
        }
        var url = this.olLayer.getSource().getUrl();
        if (url.indexOf('?') === -1) {
            url += '?';
        } else if (url.lastIndexOf('&') !== url.length - 1) {
            url += '&';
        }

        return url + $.param(requestParams);
    }
    getFeatureInfoUrl(coordinate, resolution, projection, params) {
        var requestParams = $.extend(true,
            {},
            {
                QUERY_LAYERS: this.wmsSourceLayers.join(','),
                LAYERS: this.wmsSourceLayers.join(',')
            },
            params
        );

        return this.olLayer.getSource().getFeatureInfoUrl(
            coordinate, resolution, projection, requestParams
        );
    }
}

export default BaseWMS;

